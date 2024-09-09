const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { getActualGitURLFilePath, isBinaryFile } = require("./util");
const { detectors } = require("./detectors/detectors");

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Function to scan a file for secrets
 */
const scanFileForSecrets = async (filePath, verify, url) => {
  const fileStream = fs.readFileSync(filePath, "utf8");
  const trimmedFile = fileStream.trim();
  await processPossibleSecrets(filePath, trimmedFile, verify, url);
};

/**
 * Function to process possible secrets and check for context matches
 */
const processPossibleSecrets = async (filePath, trimmedFile, verify, url) => {
  if (trimmedFile === "") return;
  await Promise.all(
    detectors.map(async (detector) => {
      const { scan, keywords } = detector;
      const scanResponse = await scan(verify, trimmedFile);
      if (scanResponse) {
        logPotentialSecret(
          filePath,
          "1",
          scanResponse.detectorType,
          scanResponse.rawValue,
          scanResponse.verified,
          url
        );
      }
    })
  );
};

/**
 * Function to log the detected secrets
 */
const logPotentialSecret = (
  filePath,
  line,
  detector,
  rawValue,
  verified,
  url
) => {
  console.log(
    chalk.greenBright.bold(
      `${
        verified
          ? "\n💯 Found verified secret"
          : `\nPotential secret detected in ${url || filePath}`
      }`
    )
  );
  console.log(`${chalk.bold("Detector:")} ${detector}`);
  console.log(`${chalk.bold("Line:")} ${line}`);
  console.log(
    `${chalk.bold("File Path:")} ${
      url ? getActualGitURLFilePath(filePath) : filePath
    }`
  );
  console.log(`${chalk.bold("Raw Value:")} ${rawValue}\n`);
};

/**
 * Function to scan directories and files, with streamlined file scanning and parallel processing
 */
const scanDirectory = async ({
  startDirectory,
  excludedFolders,
  excludedExtensions,
  verify,
  url,
}) => {
  const files = await fs.promises.readdir(startDirectory, {
    withFileTypes: true,
  });
  const scanPromises = [];

  for (const file of files) {
    const fullPath = path.join(startDirectory, file.name);

    if (shouldExcludeFile(fullPath, excludedFolders, excludedExtensions)) {
      continue;
    }

    if (file.isDirectory()) {
      scanPromises.push(
        scanDirectory({
          startDirectory: fullPath,
          excludedFolders,
          excludedExtensions,
          url,
          verify,
        })
      );
    } else if (file.isFile()) {
      await handleFileScanning({
        file,
        fullPath,
        scanPromises,
        url,
        excludedExtensions,
        verify,
      });
    }
  }

  await Promise.all(scanPromises); // Process all file scanning promises in parallel
};

/**
 * Function to handle the scanning of a file
 */
const handleFileScanning = async ({
  file,
  fullPath,
  scanPromises,
  url,
  excludedExtensions,
  verify,
}) => {
  const fileStats = await fs.promises.stat(fullPath);
  const fileExtension = path.extname(fullPath).toLowerCase();

  if (
    fileStats.size > MAX_FILE_SIZE ||
    isBinaryFile(fullPath) ||
    excludedExtensions.includes(fileExtension)
  ) {
    return; // Skip large, binary & user-excluded files
  }

  if (shouldScanFile(fileExtension)) {
    scanPromises.push(scanFileForSecrets(fullPath, verify, url));
  }
};

/**
 * Function to determine if a file should be excluded from scanning
 */
const shouldExcludeFile = (filePath, excludedFolders, excludedExtensions) => {
  return (
    excludedFolders.some((folder) => filePath.includes(folder)) ||
    excludedExtensions.some((ext) => filePath.endsWith(ext))
  );
};

/**
 * Function to determine if a file should be scanned based on its extension
 */
const shouldScanFile = (fileExtension) => {
  return (
    fileExtension === ".env" ||
    !fileExtension ||
    fileExtension === ".log" ||
    fileExtension === ".txt" ||
    fileExtension.match(
      /\.(js|ts|py|rb|go|php|java|cs|cpp|c|sh|bat|yaml|yml|rs|ini|cfg|dart)$/
    )
  );
};

module.exports = { scanDirectory };
