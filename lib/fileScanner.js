const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { getActualGitURLFilePath, isBinaryFile, maskString } = require("./util");
const { AhoCorasickCore } = require("./ahocorasick");

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Function to scan a file for secrets
 */
const scanFileForSecrets = async (filePath, verify, core, mask, url) => {
  const fileStream = fs.readFileSync(filePath, "utf8");
  const trimmedFile = fileStream.trim();
  await processPossibleSecrets(filePath, trimmedFile, verify, core, mask, url);
};

/**
 * Function to process possible secrets and check for context matches
 */
const processPossibleSecrets = async (
  filePath,
  trimmedFile,
  verify,
  core,
  mask,
  url
) => {
  if (trimmedFile === "") return;
  const detectors = core.findMatchingDetectors(trimmedFile);

  await Promise.all(
    detectors.map(async (detector) => {
      const { scan, detectorType } = detector;
      const scanResponse = await scan(verify, trimmedFile);
      if (scanResponse) {
        logPotentialSecret(
          filePath,
          "1",
          scanResponse.detectorType,
          mask ? maskString(scanResponse.rawValue) : scanResponse.rawValue,
          scanResponse.verified,
          url || null,
          scanResponse.extras
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
  url,
  extras
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
  console.log(`${chalk.bold("Raw Value:")} ${rawValue}${extras ? "" : "\n"}`);
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      console.log(`${chalk.bold(`${key}:`)} ${value}`);
    }
  }
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
  customDetectors,
  mask,
}) => {
  const core = new AhoCorasickCore(customDetectors);

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
          customDetectors,
          mask,
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
        core,
        mask,
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
  core,
  mask,
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
    scanPromises.push(scanFileForSecrets(fullPath, verify, core, mask, url));
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
      /\.(js|ts|jsx|tsx|py|pyc|pyo|pyd|rb|rake|ru|gemspec|go|php|php[3457]?|phtml|inc|java|class|jar|cs|csx|cpp|c|cxx|h|hpp|hh|sh|bash|bat|cmd|ps1|yaml|yml|rs|ini|cfg|json|toml|dart|kt|kts|swift|lua|pl|pm|t|cgi|groovy|scala|sc|sbt|r|md|html|htm|xhtml|css|scss|less|xml|xsl|xslt|jsp|asp|aspx|sql|db|sqlite|db3|rdoc|rst|org|adoc|txt|tex|bib|m|mm|ml|mli|ml4|mly|caml|erl|hrl|ex|exs|elm|fs|fsx|fsi|fsscript|vb|vbs|vba|rkt|jl|hs|lisp|clj|cljs|cljc|edn|ps|prc|cl|mat|m|rmd|ipynb|sage|coffee|tsql|plsql|pgsql|hcl|tf|vue|svelte|cucumber|feature|haml|slim|ejs|handlebars|hbs|mustache|twig|erb|jade|pug)$/
    )
  );
};

module.exports = { scanDirectory };
