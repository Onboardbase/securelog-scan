const fs = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk");

const scanFileForSecrets = async (filePath, regexPatterns) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  let lines = [];

  for await (const line of rl) {
    lineNumber++;
    lines.push(line);

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
        for (const [company, regex] of Object.entries(regexPatterns)) {
          if (regex.test(possibleSecret)) {
            console.log(
              chalk.greenBright.bold(
                `\nPotential secret detected in ${filePath}`
              )
            );
            console.log(`${chalk.bold("Detector:")} ${company}`);
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
  excludedExtensions,
  regexPatterns
) => {
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const scanPromises = [];
  const maxFileSize = 5 * 1024 * 1024;

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);

    if (excludedFolders.some((folder) => fullPath.includes(folder))) {
      continue; // Skip excluded folders
    }

    if (file.isDirectory()) {
      // Recursively scan the directory
      scanPromises.push(
        scanDirectory(
          fullPath,
          excludedFolders,
          excludedExtensions,
          regexPatterns
        )
      );
    } else if (file.isFile()) {
      const fileStats = await fs.promises.stat(fullPath);
      const fileExtension = path.extname(fullPath).toLowerCase();

      if (
        fileStats.size > maxFileSize ||
        isBinaryFile(fullPath) ||
        excludedExtensions.includes(fileExtension)
      ) {
        continue; // Skip large, binary & user excluded files
      }

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
        scanPromises.push(scanFileForSecrets(fullPath, regexPatterns));
      }
    }
  }

  await Promise.all(scanPromises); // Process all file scanning promises in parallel
};

module.exports = { scanDirectory };
