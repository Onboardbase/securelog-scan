import path from "path";
import { randomBytes } from "crypto";
import { execSync, spawnSync } from "child_process";
import os from "os";
import chalk from "chalk";
import { scanDirectory } from "./fileScanner";
import { scanGitCommitsForSecrets } from "./gitScanner";
import { AnalyzeRepositoryOptions } from "./types";
import { GIT_HTTP_MAX_REQUEST_BUFFER } from "./constants";

const validateAndFormatRepoUrl = (urlString: string): string => {
  try {
    const url = new URL(urlString);

    // Only allow GitHub, GitLab, or Bitbucket URLs
    if (!["github.com", "gitlab.com", "bitbucket.org"].includes(url.hostname)) {
      throw new Error("URL must be from GitHub, GitLab, or Bitbucket.");
    }

    // Ensure the URL ends with `.git`
    if (!url.pathname.endsWith(".git")) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}.git`;
    }

    return url.toString();
  } catch (error: any) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
};

const cloneRepository = (repoUrl: string): string => {
  const tmpDir = os.tmpdir();
  const repoDir = path.join(tmpDir, randomBytes(12).toString("hex"));

  try {
    const command = `git -c http.postBuffer=${GIT_HTTP_MAX_REQUEST_BUFFER} -c core.compression=0 clone --depth 1 --filter=blob:none --single-branch ${repoUrl} ${repoDir}`;
    const result = spawnSync(command, {
      shell: true,
      timeout: 300000, // 5 mins
      stdio: "pipe",
      encoding: "utf-8",
    });

    if (result.status !== 0) {
      if (
        result.stderr.includes("Clone succeeded, but checkout failed") ||
        result.stderr.includes("error: unable to checkout working tree")
      ) {
        console.warn(
          chalk.yellow(
            "Clone succeeded but checkout failed. Running manual checkout..."
          )
        );

        // Attempt manual checkout to get the actual files
        const checkoutResult = spawnSync("git", ["checkout", "HEAD"], {
          cwd: repoDir,
          shell: true,
          stdio: "pipe",
          encoding: "utf-8",
        });

        if (checkoutResult.status !== 0) {
          console.error(
            chalk.red(`Manual checkout failed: ${checkoutResult.stderr.trim()}`)
          );
          process.exit(1);
        } else {
          console.log(chalk.green("Manual checkout succeeded."));
          return repoDir;
        }
      }

      // For other errors, display the error message and exit
      console.error(
        chalk.red(`Failed to clone repository: ${result.stderr.trim()}`)
      );
      process.exit(1);
    }

    return repoDir;
  } catch (error: any) {
    console.error(chalk.red(`Unexpected error: ${error.message}`));
    process.exit(1);
  }
};

const cleanUpRepository = (dirPath: string): void => {
  try {
    const removeCommand =
      os.platform() === "win32"
        ? `rd /s /q "${dirPath}"`
        : `rm -rf "${dirPath}"`;
    execSync(removeCommand);
  } catch (error: any) {
    console.error(`Error cleaning up repository: ${error.message}`);
  }
};

export const analyzeRepository = async (
  options: AnalyzeRepositoryOptions
): Promise<void> => {
  const { url, excludedFolders, excludedExtensions, verify, core } = options;

  // Validate and format the repository URL
  const repoUrl = validateAndFormatRepoUrl(url);
  let repoDir: string | null = null;

  try {
    // Clone the repository
    repoDir = cloneRepository(repoUrl);

    await Promise.all([
      scanDirectory({
        startDirectory: repoDir,
        excludedFolders,
        excludedExtensions,
        url: repoUrl,
        verify,
        core,
      }),
      scanGitCommitsForSecrets({
        startDirectory: repoDir,
        commitLimit: 100,
        excludedFolders,
        verify,
        url: repoUrl,
        core,
      }),
    ]);
  } catch (error: any) {
    console.error(`Error analyzing repository: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up the cloned repository
    if (repoDir) {
      cleanUpRepository(repoDir);
    }
  }
};
