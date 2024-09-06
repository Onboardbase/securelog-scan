const fs = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk");
const { detectSecretsInLine, getActualGitURLFilePath } = require("./util");

const scanFileForSecrets = async (filePath, regexPatterns, url) => {
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

    const possibleSecrets = detectSecretsInLine(line);

    for (const possibleSecret of possibleSecrets) {
      if (possibleSecret) {
        for (const [company, regex] of Object.entries(regexPatterns)) {
          /**
           * if key that is its scanning a file that has something like "const AWS_KEY = 'my aws key'"
           *
           * if key is null, it means its scanning a string and not a key value pair
           *
           * so I need to add extra checks for strings by splitting the value, checking each
           * value to see if they match the patterns, if they do, backtrack the value to get the possible owner (if secret is a general one that can match multiple companies)
           */
          if (regex.test(possibleSecret)) {
            /**
             * if string has whitespaces, test every string in the array with the regex to know which one exactly is the secret
             *
             * This is useful for cases where a secret exist in the midst of a string and the regex passed but we need to get the
             * actual secret in that list of keywords in the string
             */
            const matchedValue =
              possibleSecret.split(" ").length > 1
                ? possibleSecret.match(regex)[0]
                : possibleSecret;

            console.log(
              chalk.greenBright.bold(
                `\nPotential secret detected in ${url || filePath}`
              )
            );
            console.log(`${chalk.bold("Detector:")} ${company}`);
            console.log(`${chalk.bold("Line:")} ${lineNumber} ${trimmedLine}`);
            /**
             * if url is passed, it means user is scanning a url hence the reason
             * for specifying filePath seperately
             */
            if (url) {
              console.log(
                `${chalk.bold("File Path:")} ${getActualGitURLFilePath(
                  filePath
                )}`
              );
            }
            console.log(`${chalk.bold("Raw Value:")} ${matchedValue}\n`);
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
  regexPatterns,
  url = null // that is if a url is being scanned, pass the url downn to the scanDirectory method
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
          regexPatterns,
          url
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

      // Only scan files they are likely to contain secrets (including .env files)
      if (
        fileExtension === ".env" ||
        !fileExtension ||
        fileExtension === ".log" ||
        fileExtension === ".txt" ||
        fileExtension.match(
          /\.(js|ts|py|rb|go|php|java|cs|cpp|c|sh|bat|yaml|yml|rs|ini|cfg|dart)$/
        )
      ) {
        scanPromises.push(scanFileForSecrets(fullPath, regexPatterns, url));
      }
    }
  }

  await Promise.all(scanPromises); // Process all file scanning promises in parallel
};

module.exports = { scanDirectory };
