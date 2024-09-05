const axios = require("axios");
const { createWriteStream } = require("fs");
const path = require("path");
const { randomBytes } = require("crypto");
const unzipper = require("unzipper");
const { execSync } = require("child_process");
const { scanDirectory } = require("./fileScanner");
const os = require("os");

const downloadRepoZip = async (repoUrl, outputPath) => {
  const { hostname } = new URL(repoUrl);
  let zipUrl;

  if (hostname.includes("github.com")) {
    zipUrl =
      repoUrl.replace("https://github.com/", "https://github.com/") +
      "/archive/refs/heads/main.zip";
  } else if (hostname.includes("gitlab.com")) {
    zipUrl =
      repoUrl.replace("https://gitlab.com/", "https://gitlab.com/") +
      "/-/archive/main/main.zip";
  } else if (hostname.includes("bitbucket.org")) {
    zipUrl =
      repoUrl.replace("https://bitbucket.org/", "https://bitbucket.org/") +
      "/get/main.zip";
  } else {
    throw new Error(
      "Unsupported URL: Only GitHub, GitLab, and Bitbucket are supported."
    );
  }

  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios({
        url: zipUrl,
        method: "GET",
        responseType: "stream",
      });

      response.data.pipe(createWriteStream(outputPath));
      response.data.on("end", () =>
        resolve(`Downloaded zip file saved to ${outputPath}`)
      );
      response.data.on("error", (err) => reject(err));
    } catch (error) {
      console.log(error.message);
      process.exit(1);
    }
  });
};

const unzipRepo = async (path) => {
  const folderPath = path.split(".")[0];
  const directory = await unzipper.Open.file(path);
  await directory.extract({ path: folderPath });
  return folderPath;
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
  const filePath = `${randomBytes(12).toString("hex")}.zip`;
  try {
    // write the user's machine temporary directory
    const pathToSave = path.join(os.tmpdir(), filePath);

    // download file locally
    await downloadRepoZip(url, pathToSave);

    // unzip file
    const unzippedFolderPath = await unzipRepo(pathToSave);

    // Scan the codebase
    await scanDirectory(
      unzippedFolderPath,
      excludedFolders,
      extensionsToExclude || [],
      mergedRegexes,
      url
    );

    // this delete both the zipped and unzipped using wildcard (*)
    execSync(
      `${
        os.platform() === "win32"
          ? `rd /s /q ${unzippedFolderPath}*`
          : `rm -rf ${unzippedFolderPath}*`
      } `
    );
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = { analyzeRepository };
