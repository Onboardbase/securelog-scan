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

const formatExpiryDate = (durationMs) => {
  const duration = Math.max(durationMs, 0);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((duration % (1000 * 60)) / 1000);

  if (days > 0) return `${days} days`;
  if (hours > 0) return `${hours} hours`;
  if (minutes > 0) return `${minutes} minutes`;
  return `${seconds} seconds`;
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Byte";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const maskString = (str, visibleChars = 5) => {
  if (typeof str !== "string" || str.length === 0) {
    throw new Error("Invalid input: Input must be a non-empty string.");
  }
  if (visibleChars < 0) {
    throw new Error(
      "Invalid parameter: visibleChars must be a non-negative number."
    );
  }
  if (visibleChars >= str.length) {
    return str;
  }

  const maskedPart = "*".repeat(str.length - visibleChars);
  const visiblePart = str.slice(0, visibleChars);
  return visiblePart + maskedPart;
};

const getLineNumber = (data, position) => {
  // Split data into lines
  const lines = data.substring(0, position).split("\n");
  return lines.length; // Line numbers are 1-based
};

const isFalsePositive = (value, falsePositives) => {
  if (!value) throw new Error("value cannot be undefined");
  const lower = value.toLowerCase();

  // Check if the value contains any false positive term
  for (const fp of falsePositives) {
    if (lower.includes(fp))
      return { isFalsePositive: true, reason: `match found: ${fp}` };
    else return { isFalsePositive: false };
  }
};

module.exports = {
  detectSecretsInLine,
  getActualGitURLFilePath,
  isBinaryFile,
  formatExpiryDate,
  formatBytes,
  maskString,
  getLineNumber,
  isFalsePositive,
};
