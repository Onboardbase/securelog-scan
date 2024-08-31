#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { scanDirectory } = require("../lib/fileScanner");
const { scanGitCommitsForSecrets } = require("../lib/gitScanner");
const { program } = require("commander");
const { configHandler } = require("../lib/configHandler");
const { regexHandler } = require("../lib/regexPatterns");

program
  .option(
    "-e, --exclude <folders>",
    "Comma-separated list of folders to exclude from scanning",
    ""
  )
  .option("-c, --commits <number>", "Number of recent commits to scan", 100)
  .option("-d, --dir <string>", "Path to directory to scan")
  .option(", --config <string>", "A path to secure log scan config file", "")
  .option("-d, --changed", "Only scan changed files and lines", false)
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
    const userConfigRexes = (config && config.regexes) || {};
    const mergedRegexes = regexHandler(userConfigRexes);

    /**
     * only scan all directories if user did not specify to scan only changed file
     */
    if (!options.changed) {
      // Scan the codebase
      await scanDirectory(
        startDirectory,
        excludedFolders,
        (config && config.exclude && config.exclude.extensions) || [],
        mergedRegexes
      );
    }

    // Scan .git commits if present
    const gitDir = path.join(startDirectory, ".git");
    if (fs.existsSync(gitDir)) {
      await scanGitCommitsForSecrets(
        startDirectory,
        commitLimit,
        mergedRegexes,
        options.changed
      );
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
