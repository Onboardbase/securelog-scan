const fs = require("fs");
const path = require("path");
const readline = require("readline");
const chalk = require("chalk");
const {
  detectSecretsInLine,
  getActualGitURLFilePath,
  isBinaryFile,
} = require("./util");

// Constants
const CONTEXT_WINDOW = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Function to scan a file for secrets
 */
const scanFileForSecrets = async (filePath, regexPatterns, url) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;
  const contextAbove = [];
  const futureLines = [];

  for await (const line of rl) {
    lineNumber++;
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    updateContextAbove(trimmedLine, contextAbove);
    const possibleSecrets = detectSecretsInLine(line);

    await processPossibleSecrets(
      filePath,
      lineNumber,
      trimmedLine,
      possibleSecrets,
      contextAbove,
      futureLines,
      regexPatterns,
      url
    );

    maintainFutureLinesBuffer(trimmedLine, futureLines);
  }
};

/**
 * Function to update the context above buffer
 */
const updateContextAbove = (line, contextAbove) => {
  if (contextAbove.length >= CONTEXT_WINDOW) contextAbove.shift();
  contextAbove.push(line);
};

/**
 * Function to maintain the buffer for future lines
 */
const maintainFutureLinesBuffer = (line, futureLines) => {
  futureLines.push(line);
  if (futureLines.length > CONTEXT_WINDOW) futureLines.shift();
};

/**
 * Function to process possible secrets and check for context matches
 */
const processPossibleSecrets = async (
  filePath,
  lineNumber,
  trimmedLine,
  possibleSecrets,
  contextAbove,
  futureLines,
  regexPatterns,
  url
) => {
  let shouldContinueScan = true;

  for (const possibleSecret of possibleSecrets) {
    const contextBelow = getContextBelow(futureLines);

    // Priority-based matching with prefixRegex first
    for (const [company, { regex, prefixRegex }] of Object.entries(
      regexPatterns
    )) {
      const regexMatches = regex.test(possibleSecret);
      const contextMatchAbove = contextAbove.some((ctxLine) =>
        prefixRegex ? prefixRegex.test(ctxLine) : false
      );
      const contextMatchBelow = contextBelow.some((ctxLine) =>
        prefixRegex ? prefixRegex.test(ctxLine) : false
      );

      // Give priority to patterns with prefixRegex
      if (
        prefixRegex &&
        regexMatches &&
        (contextMatchAbove || contextMatchBelow)
      ) {
        logPotentialSecret(
          filePath,
          lineNumber,
          trimmedLine,
          company,
          possibleSecret,
          regex,
          url
        );
        return; // Exit once a prioritized match is found
      }
    }

    // Match regex patterns without prefixRegex as fallback
    for (const [company, { regex, prefixRegex }] of Object.entries(
      regexPatterns
    )) {
      const regexMatches = regex.test(possibleSecret);
      if (!prefixRegex && regexMatches) {
        logPotentialSecret(
          filePath,
          lineNumber,
          trimmedLine,
          company,
          possibleSecret,
          regex,
          url
        );
        return;
      }
    }
  }
};

/**
 * Function to extract the context below the current line
 */
const getContextBelow = (futureLines) => {
  const contextBelow = [];
  for (let i = 0; i < CONTEXT_WINDOW && futureLines[i]; i++) {
    contextBelow.push(futureLines[i].trim());
  }
  return contextBelow;
};

/**
 * Function to log the detected secrets
 */
const logPotentialSecret = (
  filePath,
  lineNumber,
  line,
  company,
  possibleSecret,
  regex,
  url
) => {
  const matchedValue =
    possibleSecret.split(" ").length > 1
      ? possibleSecret.match(regex)[0]
      : possibleSecret;

  console.log(
    chalk.greenBright.bold(`\nPotential secret detected in ${url || filePath}`)
  );
  console.log(`${chalk.bold("Detector:")} ${company}`);
  console.log(`${chalk.bold("Line:")} ${lineNumber} ${line}`);

  if (url) {
    console.log(
      `${chalk.bold("File Path:")} ${getActualGitURLFilePath(filePath)}`
    );
  }
  console.log(`${chalk.bold("Raw Value:")} ${matchedValue}\n`);
};

/**
 * Function to scan directories and files, with streamlined file scanning and parallel processing
 */
const scanDirectory = async (
  dirPath,
  excludedFolders = [],
  excludedExtensions,
  regexPatterns,
  url = null
) => {
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const scanPromises = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);

    if (shouldExcludeFile(fullPath, excludedFolders, excludedExtensions)) {
      continue;
    }

    if (file.isDirectory()) {
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
      await handleFileScanning(
        file,
        fullPath,
        regexPatterns,
        scanPromises,
        url,
        excludedExtensions
      );
    }
  }

  await Promise.all(scanPromises); // Process all file scanning promises in parallel
};

/**
 * Function to handle the scanning of a file
 */
const handleFileScanning = async (
  file,
  fullPath,
  regexPatterns,
  scanPromises,
  url,
  excludedExtensions
) => {
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
    scanPromises.push(scanFileForSecrets(fullPath, regexPatterns, url));
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
