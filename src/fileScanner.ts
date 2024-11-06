import fs from "fs";
import path from "path";
import { isBinaryFile, maskString, getLineNumber } from "./util";
import { AhoCorasickCore } from "./ahocorasick";
import { MAX_FILE_SIZE } from "./constants";
import { ScanDirectoryOptions, ScanOptions, ScanStringOptions } from "./types";
import { EventManager } from "./events";
import { Detector, EScannerTypes } from "./types/detector";

const scanFileForSecrets = async (
  filePath: string,
  verify: boolean | undefined,
  core: AhoCorasickCore,
  mask: boolean | undefined,
  url?: string
): Promise<void> => {
  const fileStream = fs.readFileSync(filePath, "utf8");
  const trimmedFile = fileStream.trim();
  await processPossibleSecrets(filePath, trimmedFile, verify, core, mask, url);
};

/**
 *
 * @todo
 * make core optional and rebuild core if its not passed,
 * this should cater for the securelog SDK that might need this function exposed
 *
 * also have an argument to choose to log (on the cli) or return raw string on the SDK
 */
export const processPossibleSecretsInString = async (
  options: ScanStringOptions,
  core?: AhoCorasickCore
) => {
  const { rawValue, file, updateFile, outputFile } = options;

  if (!rawValue || (rawValue === "" && !file)) {
    console.error("A rawValue or file has to be passed");
    process.exit(1);
  }

  let modifiedValue = rawValue;
  if (file && fs.existsSync(file)) {
    modifiedValue = fs.readFileSync(file, "utf8").trim();
  }

  let detectors: Detector[] = core?.findMatchingDetectors(rawValue) || [];
  if (!core) {
    const customAhocorasickCore = new AhoCorasickCore();
    detectors = customAhocorasickCore.findMatchingDetectors(rawValue);
  }

  await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(false, rawValue);
      if (scanResponse) {
        modifiedValue = modifiedValue.replaceAll(
          scanResponse.rawValue as string,
          maskString(scanResponse.rawValue as string)
        );
      }
    })
  );

  if (file && updateFile) {
    fs.writeFileSync(file, modifiedValue, "utf8");
    console.log("File content updated successfully");
  } else if (!file && !updateFile && core) console.log(modifiedValue);

  if (outputFile) {
    fs.writeFileSync(outputFile, modifiedValue, "utf8");
  }

  if (!core) return modifiedValue;
};

/**
 * Processes possible secrets and checks for matches.
 */
const processPossibleSecrets = async (
  filePath: string,
  trimmedFile: string,
  verify: boolean | undefined,
  core: AhoCorasickCore,
  mask: boolean | undefined,
  url?: string
): Promise<void> => {
  if (trimmedFile === "") return;
  const detectors = core.findMatchingDetectors(trimmedFile);

  await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(verify, trimmedFile);
      if (scanResponse) {
        const line = scanResponse.position
          ? getLineNumber(trimmedFile, scanResponse.position)
          : 1;
        EventManager.emitNewSecret({
          ...scanResponse,
          position: line,
          filePath,
          mask,
          url,
          scannerType: EScannerTypes.FILE_SCANNER,
        });
      }
    })
  );
};

/**
 * Scans directories and files, with parallel processing of files for secrets.
 */
export const scanDirectory = async (
  options: ScanDirectoryOptions
): Promise<void> => {
  const {
    startDirectory,
    excludedFolders,
    excludedExtensions,
    verify,
    url,
    mask,
    core,
  } = options;

  const files = await fs.promises.readdir(startDirectory, {
    withFileTypes: true,
  });
  const scanPromises: Promise<void>[] = [];

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
          mask,
          core,
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

const handleFileScanning = async ({
  file,
  fullPath,
  scanPromises,
  url,
  excludedExtensions,
  verify,
  core,
  mask,
}: {
  file: fs.Dirent;
  fullPath: string;
  scanPromises: Promise<void>[];
  url?: string;
  excludedExtensions: string[];
  verify?: boolean;
  core: AhoCorasickCore;
  mask?: boolean;
}): Promise<void> => {
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
 * Determines if a file should be excluded from scanning based on folder or extension exclusion rules.
 */
const shouldExcludeFile = (
  filePath: string,
  excludedFolders: string[],
  excludedExtensions: string[]
): boolean => {
  return (
    excludedFolders.some((folder) => filePath.includes(folder)) ||
    excludedExtensions.some((ext) => filePath.endsWith(ext))
  );
};

/**
 * Determines if a file should be scanned based on its extension.
 */
const shouldScanFile = (fileExtension: string): boolean => {
  return Boolean(
    fileExtension === ".env" ||
      !fileExtension ||
      fileExtension === ".log" ||
      fileExtension === ".txt" ||
      fileExtension.match(
        /\.(js|ts|jsx|tsx|py|rb|go|php|java|cpp|sh|yaml|json|xml|html|css|md|sql|vue|dart|swift|kotlin|scala|rs|pl|hs|jl|r|ipynb)$/
      )
  );
};
