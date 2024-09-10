const os = require("os");
const path = require("path");

// Handle key=value pairs or consider the entire line
const detectSecretsInLine = (line) => {
  const trimmedLine = line.trim();
  let key = null;
  let value = null;

  if (trimmedLine.includes("=")) {
    // Split on the first "=" to avoid issues with URLs or values containing "="
    const [firstPart, ...remainingParts] = trimmedLine.split("=");
    key = firstPart.trim();
    value = remainingParts.join("=").trim();

    const quoteMatch = value.match(/^["'](.+?)["'];?$/);
    if (quoteMatch) {
      value = quoteMatch[1].trim(); // Extract content within quotes and trim any trailing whitespace
    }
  } else {
    value = trimmedLine;
  }

  const possibleSecrets = key ? [key, value] : [value];
  return possibleSecrets;
};

const getActualGitURLFilePath = (filePath) => {
  if (filePath) {
    // get actual file path to the file where the secret was found
    const actualGitFilePath = filePath.split(os.tmpdir()).join("").split("/");
    actualGitFilePath.splice(0, 2);
    return actualGitFilePath.join("/");
  }
};

/**
 * Utility to determine if a file is binary
 */
const isBinaryFile = (filePath) => {
  const binaryExtensions = new Set([
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
    ".class",
    ".djo",
    ".jks",
    ".ser",
    ".idx",
    ".hprof",
    ".bin",
    ".so",
    ".o",
    ".a",
    ".dylib",
    ".lib",
    ".obj",
  ]);
  const fileExtension = path.extname(filePath).toLowerCase();
  return binaryExtensions.has(fileExtension);
};

module.exports = { detectSecretsInLine, getActualGitURLFilePath, isBinaryFile };
