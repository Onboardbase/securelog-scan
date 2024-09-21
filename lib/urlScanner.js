const path = require("path");
const { randomBytes } = require("crypto");
const { execSync, spawn } = require("child_process");
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

const cloneRepo = (parsedUrl, pathToSave) => {
  return new Promise((resolve, reject) => {
    const clone = spawn(`git clone ${parsedUrl} ${pathToSave}`);
    clone.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`git clone process exited with code ${code}`));
      }
    });
  });
};

const analyzeRepository = async ({
  url,
  excludedFolders,
  extensionsToExclude,
  verify,
  customDetectors,
}) => {
  const parsedUrl = validateAndFormatRepoUrl(url);
  const filePath = `${randomBytes(12).toString("hex")}`;
  try {
    // write the cloned repo to user's machine temporary directory
    const pathToSave = path.join(os.tmpdir(), filePath);
    await cloneRepo(parsedUrl, pathToSave);

    // Scan the codebase
    await scanDirectory({
      startDirectory: pathToSave,
      excludedFolders,
      excludedExtensions: extensionsToExclude || [],
      url,
      verify,
      customDetectors,
    });

    // scan git commits history
    await scanGitCommitsForSecrets({
      startDirectory: pathToSave,
      commitLimit: 100,
      excludedFolders,
      verify,
      url,
      customDetectors,
    });

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
