#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const pkg = require("../package.json");
const { scanDirectory } = require("../lib/fileScanner");
const { scanGitCommitsForSecrets } = require("../lib/gitScanner");
const { program } = require("commander");
const { configHandler } = require("../lib/configHandler");
const { buildCustomDetectors } = require("../lib/regexPatterns");
const { analyzeRepository } = require("../lib/urlScanner");

program
  .name(pkg.name)
  .description(pkg.description)
  .version(pkg.version)
  .option(
    "-e, --exclude <folders>",
    "Comma-separated list of folders to exclude from scanning",
    ""
  )
  .option("-c, --commits <number>", "Number of recent commits to scan", 100)
  .option("-d, --dir <string>", "Path to directory to scan")
  .option(", --config <string>", "A path to secure log scan config file", "")
  .option("-d, --changed", "Only scan changed files and lines", false)
  .option(", --url <url>", "A link to a Github, Gitlab or BitBucket URL", "")
  .option(
    "-v, --verify <boolean>",
    "Should be specified if secrets should be verified",
    false
  )
  .parse(process.argv);

const options = program.opts();
const startDirectory = options.dir || process.cwd();
let excludedFolders = options.exclude
  .split(",")
  .map((folder) => folder.trim())
  .filter((folder) => folder);
const commitLimit = parseInt(options.commits, 10);
const configFile = options.config;

const main = async () => {
  try {
    /**
     * check if user has a config file and merge it with the existing configs
     */
    const config = configHandler(configFile);
    if (config && config.exclude && config.exclude.paths)
      excludedFolders = [
        ...new Set([excludedFolders || [], config.exclude.paths].flat()),
      ];

    /**
     * merge default regex alongside users custom regex
     */
    const userConfigRexes = (config && config.detectors) || {};
    const customDetectors = buildCustomDetectors(userConfigRexes);

    const excludedExtensions =
      (config && config.exclude && config.exclude.extensions) || [];

    /**
     * if user is trying to scan URL, --changed flag is not respected anymore
     */
    if (options.url) {
      return await analyzeRepository({
        url: options.url,
        excludedFolders,
        excludedExtensions,
        verify: options.verify,
      });
    }

    /**
     * only scan all directories if user did not specify to scan only changed file
     */
    if (!options.changed) {
      // Scan the codebase
      await scanDirectory({
        startDirectory,
        excludedFolders,
        excludedExtensions,
        verify: options.verify,
        customDetectors,
      });
    }

    // Scan .git commits if present
    const gitDir = path.join(startDirectory, ".git");
    if (fs.existsSync(gitDir)) {
      await scanGitCommitsForSecrets({
        startDirectory,
        commitLimit,
        changed: options.changed,
        excludedFolders,
        verify: options.verify,
      });
    } else {
      /**
       * I assume its normal for users not to have git repo in their project so
       * I only log a message if user specified `--changed` flag which is strict on
       * only git scanning
       */
      if (options.changed) {
        console.log("Repository doesnt have a .git directory");
      }
    }
  } catch (error) {
    console.error(`Error scanning: ${error.message}`);
  }
};

main();
