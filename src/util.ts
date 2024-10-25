import os from "os";
import path from "path";
import axios, { AxiosInstance } from "axios";
import { HTTP_REQUEST_TIMEOUT } from "./constants";

export const getActualGitURLFilePath = (
  filePath: string
): string | undefined => {
  if (filePath) {
    const actualGitFilePath = filePath.split(os.tmpdir()).join("").split("/");
    actualGitFilePath.splice(0, 2); // Remove first two elements (tmp dir structure)
    return actualGitFilePath.join("/");
  }
  return undefined;
};

export const isBinaryFile = (filePath: string): boolean => {
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

export const formatExpiryDate = (durationMs: number): string => {
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

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const maskString = (str: string, visibleChars: number = 5): string => {
  if (typeof str !== "string" || str.length === 0) {
    throw new Error("Invalid input: Input must be a non-empty string.");
  }
  if (visibleChars < 0) {
    throw new Error(
      "Invalid parameter: visibleChars must be a non-negative number."
    );
  }
  if (visibleChars >= str.length) {
    return str; // Return the full string if visibleChars is larger than the string length
  }

  // make the masked chars only 10 characters
  const maskedPart = "*".repeat(
    str.length < 10 ? str.length : 10 - visibleChars
  );
  const visiblePart = str.slice(0, visibleChars);
  return visiblePart + maskedPart;
};

export const getLineNumber = (data: string, position: number): number => {
  const lines = data.substring(0, position).split("\n");
  return lines.length;
};

export const isFalsePositive = (
  value: string,
  falsePositives: string[]
): { isFalsePositive: boolean; reason?: string } => {
  if (!value) throw new Error("value cannot be undefined");

  const lower = value.toLowerCase();

  for (const fp of falsePositives) {
    if (lower.includes(fp)) {
      return { isFalsePositive: true, reason: `match found: ${fp}` };
    }
  }

  return { isFalsePositive: false };
};

export const httpClient: AxiosInstance = axios.create({
  timeout: HTTP_REQUEST_TIMEOUT,
});
