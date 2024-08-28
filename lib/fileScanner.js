const fs = require("fs");
const path = require("path");
const readline = require("readline");
const regexPatterns = require("./regexPatterns");
const chalk = require("chalk");

const scanFileForSecrets = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;

    // Trim the line and ignore comments or empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // Handle .env key=value pairs or consider the entire line
    const [key, value] = line.includes("=")
      ? line.split("=").map((part) => part.trim())
      : [null, trimmedLine];
    const possibleSecrets = key ? [key, value] : [trimmedLine];

    for (const possibleSecret of possibleSecrets) {
      if (possibleSecret) {
        //console.log("possibleSecret", possibleSecret);
        for (const [company, regex] of Object.entries(regexPatterns)) {
          if (regex.test(possibleSecret)) {
            console.log(
              chalk.greenBright.bold(
                `\nPotential secret detected in ${filePath}`
              )
            );
            console.log(`${chalk.bold("Company:")} ${company}`);
            console.log(`${chalk.bold("Line:")} ${lineNumber} ${trimmedLine}`);
            console.log(`${chalk.bold("Matched Value:")} ${possibleSecret}\n`);
            break;
          }
        }
      }
    }
  }
};

// Utility to determine if a file is binary
const isBinaryFile = (filePath) => {
  const binaryExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".pdf",
    ".exe",
    ".dll",
    ".so",
    ".zip",
    ".tar",
    ".gz",
    ".bin",
  ];
  const fileExtension = path.extname(filePath).toLowerCase();
  return binaryExtensions.includes(fileExtension);
};

// Function to scan directories and files, with streamlined file scanning and parallel processing
const scanDirectory = async (
  dirPath,
  excludedFolders = [],
  maxFileSize = 5 * 1024 * 1024
) => {
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const scanPromises = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);

    if (excludedFolders.some((folder) => fullPath.includes(folder))) {
      continue; // Skip excluded folders
    }

    if (file.isDirectory()) {
      // Recursively scan the directory
      scanPromises.push(scanDirectory(fullPath, excludedFolders, maxFileSize));
    } else if (file.isFile()) {
      const fileStats = await fs.promises.stat(fullPath);

      if (fileStats.size > maxFileSize || isBinaryFile(fullPath)) {
        continue; // Skip large or binary files
      }

      const fileExtension = path.extname(fullPath).toLowerCase();

      // Only scan files that are likely to contain secrets (including .env files)
      if (
        fileExtension === ".env" ||
        !fileExtension ||
        fileExtension === ".log" ||
        fileExtension === ".txt" ||
        fileExtension.match(
          /\.(js|ts|py|rb|go|php|java|cs|cpp|c|sh|bat|yaml|yml|go|rs|ini|cfg)$/
        )
      ) {
        //console.log("fullPath", fullPath);
        scanPromises.push(scanFileForSecrets(fullPath));
      }
    }
  }

  await Promise.all(scanPromises); // Process all file scanning promises in parallel
};

module.exports = { scanDirectory };

/**
 * config should include and exlude, folders, filetypes and secrets
 * Ability to Mask log files (standard log files)
 * Copy secret Detection mechanism to secure log
 * create documentation
 */
