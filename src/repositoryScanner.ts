import path from "path";
import { randomBytes } from "crypto";
import { execSync } from "child_process";
import os from "os";
import { scanDirectory } from "./fileScanner";
import { scanGitCommitsForSecrets } from "./gitScanner";
import { AnalyzeRepositoryOptions } from "./types";

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
    console.log(`Cloning repository from ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${repoDir}`, { stdio: "pipe" });
    return repoDir;
  } catch (error: any) {
    throw new Error(`Failed to clone repository: ${error.message}`);
  }
};

const cleanUpRepository = (dirPath: string): void => {
  try {
    console.log(`Cleaning up repository at ${dirPath}...`);
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
