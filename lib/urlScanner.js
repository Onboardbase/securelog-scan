const { createWriteStream } = require("fs");
const path = require("path");
const { randomBytes } = require("crypto");
const { execSync } = require("child_process");
const { scanDirectory } = require("./fileScanner");
const os = require("os");
const { scanGitCommitsForSecrets } = require("./gitScanner");

const validateAndFormatRepoUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    if (!["github.com", "gitlab.com", "bitbucket.org"].includes(url.hostname)) {
      throw new Error("URL must be from GitHub, GitLab, or Bitbucket.");
    }
    if (!url.pathname.endsWith(".git")) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}.git`;
    }

    return url.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
};

const analyzeRepository = async (
  url,
  excludedFolders,
  extensionsToExclude,
  mergedRegexes
) => {
  /**
   * firstly try to access the http url to see if it's valid
   */
  const parsedUrl = validateAndFormatRepoUrl(url);
  const filePath = `${randomBytes(12).toString("hex")}`;
  try {
    // write the cloned repo to user's machine temporary directory
    const pathToSave = path.join(os.tmpdir(), filePath);

    execSync(`git clone ${`${parsedUrl}`} ${pathToSave}`, {
      stdio: "pipe", // execute command silently while capturing errors
    });

    // Scan the codebase
    await scanDirectory(
      pathToSave,
      excludedFolders,
      extensionsToExclude || [],
      mergedRegexes,
      url
    );

    // scan git commits history
    await scanGitCommitsForSecrets(pathToSave, 100, mergedRegexes, false, url);

    // delete repo folder
    execSync(
      `${
        os.platform() === "win32"
          ? `rd /s /q ${pathToSave}*`
          : `rm -rf ${pathToSave}*`
      } `
    );
  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
};

module.exports = { analyzeRepository };
