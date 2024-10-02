import path from "path";
import { randomBytes } from "crypto";
import { execSync } from "child_process";
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
    execSync(
      `git -c http.postBuffer=${GIT_HTTP_MAX_REQUEST_BUFFER} clone --depth 1 --filter=blob:none --single-branch ${repoUrl} ${repoDir}`,
      {
        stdio: "pipe",
        timeout: 300000, // 5 min
      }
    );
    return repoDir;
  } catch (error: any) {
    /**
     * the trick here basically is that sometimes for huge repository, git
     * clone will be successful but the git cli fails while trying to checkout to
     * the default branch, so if thats the case, return repoDir so we can already
     * scan the cloned directory
     *
     * I could have added --no-checkout to the git command but then we want to make sure its able to checkout
     * to the default branch for repos that are not huge so its better its handled gracefully here for very large
     * repos
     */
    if (error.message.includes("Clone succeeded, but checkout failed"))
      return repoDir;
    console.error(chalk.red(`Failed to clone repository: ${error.message}`));
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
