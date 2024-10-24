import path from "path";
import fs from "fs";
import { processPossibleSecretsInString, scanDirectory } from "./fileScanner";
import { scanGitCommitsForSecrets } from "./gitScanner";
import { configHandler } from "./configHandler";
import { buildCustomDetectors } from "./regexHandler";
import { analyzeRepository } from "./repositoryScanner";
import chalk from "chalk";
import { ScanOptions, Config } from "./types";
import { Detector, DetectorConfig } from "./types/detector";
import { AhoCorasickCore } from "./ahocorasick";

/**
 * Scan for secrets in a repository or directory based on the provided options.
 * @param options - The scanning options provided by the user.
 */
export const scan = async (options: ScanOptions): Promise<void> => {
  const startDirectory = options.dir || process.cwd();
  const excludedFolders = extractExcludedFolders(options.exclude);
  const commitLimit = parseInt(options.commits || "0", 10);
  const configFile = options.config;

  try {
    const config = mergeConfigWithUserOptions(configFile, excludedFolders);
    const customDetectors = buildCustomDetectorsFromConfig(config);
    const excludedExtensions = config?.exclude?.extensions || [];

    const core = new AhoCorasickCore(customDetectors);

    console.log(chalk.bold.greenBright("Securelog scanning, please wait..."));

    const scanPromises: Promise<void>[] = [];

    if (options.rawValue && options.dir) {
      console.log(
        chalk.yellow(
          "info: --rawValue & --dir was specified, defaulting to --dir"
        )
      );
    }

    if (options.rawValue && !options.dir && !options.url) {
      scanPromises.push(processPossibleSecretsInString(options.rawValue, core));
    }

    /**
     * Remote git scanning
     */
    if (options.url) {
      scanPromises.push(
        scanUrl(options, excludedFolders, excludedExtensions, core)
      );
    }

    /**
     * Scans specified directory or current working directory
     * only runs if --url is not specified that is user is not trying
     * to scan a git repo
     */
    if (options.dir && !options.url) {
      scanPromises.push(
        scanCodebase(
          startDirectory,
          excludedFolders,
          excludedExtensions,
          options,
          core
        )
      );
    }

    if (isGitDirectoryPresent(startDirectory) && !options.url) {
      scanPromises.push(
        scanGitCommits(
          startDirectory,
          commitLimit,
          options,
          excludedFolders,
          core
        )
      );
    } else if (options.changed) {
      console.log("Repository doesn't have a .git directory");
    }

    await Promise.all(scanPromises);
  } catch (error: any) {
    console.error(chalk.red(`Error scanning: ${error.message}`));
    process.exit(1);
  }
};

/**
 * Extracts and processes excluded folders from the provided exclude string.
 */
const extractExcludedFolders = (exclude?: string): string[] => {
  return exclude
    ? exclude
        .split(",")
        .map((folder) => folder.trim())
        .filter((folder) => folder)
    : [];
};

/**
 * Merges user configuration with defaults, including excluded folders.
 */
const mergeConfigWithUserOptions = (
  configFile: string | undefined,
  excludedFolders: string[]
): Config | undefined => {
  if (configFile) {
    const config = configHandler(configFile) || {};
    if (config?.exclude?.paths) {
      excludedFolders.push(...config.exclude.paths);
    }
    return config;
  }
};

/**
 * Builds custom regex detectors from user configuration.
 */
const buildCustomDetectorsFromConfig = (
  config: Config | undefined
): Detector[] | undefined => {
  if (config && config.detectors) {
    const userConfigRexes = config?.detectors;
    return buildCustomDetectors(
      userConfigRexes as unknown as Record<string, DetectorConfig>
    );
  }
};

/**
 * Scans the URL repository if the URL option is provided.
 */
const scanUrl = (
  options: ScanOptions,
  excludedFolders: string[],
  excludedExtensions: string[],
  core: AhoCorasickCore
): Promise<void> => {
  return analyzeRepository({
    url: options.url!,
    excludedFolders,
    excludedExtensions,
    verify: options.verify,
    mask: options.mask,
    core,
  });
};

/**
 * Scans the codebase in the given start directory.
 */
const scanCodebase = (
  startDirectory: string,
  excludedFolders: string[],
  excludedExtensions: string[],
  options: ScanOptions,
  core: AhoCorasickCore
): Promise<void> => {
  return scanDirectory({
    startDirectory,
    excludedFolders,
    excludedExtensions,
    verify: options.verify,
    mask: options.mask,
    core,
  });
};

/**
 * Checks if a .git directory exists in the provided start directory.
 */
const isGitDirectoryPresent = (startDirectory: string): boolean => {
  const gitDir = path.join(startDirectory, ".git");
  return fs.existsSync(gitDir);
};

/**
 * Scans Git commits for secrets in the given start directory.
 */
const scanGitCommits = (
  startDirectory: string,
  commitLimit: number,
  options: ScanOptions,
  excludedFolders: string[],
  core: AhoCorasickCore
): Promise<void> => {
  return scanGitCommitsForSecrets({
    startDirectory,
    commitLimit,
    changed: options.changed,
    excludedFolders,
    verify: options.verify,
    mask: options.mask,
    core,
  });
};
