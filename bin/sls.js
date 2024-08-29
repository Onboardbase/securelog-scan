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
     * check if user has a cofig file and merge it with the existing configs
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

    // Scan the codebase
    await scanDirectory(
      startDirectory,
      excludedFolders,
      (config && config.exclude && config.exclude.extensions) || [],
      mergedRegexes
    );

    // Scan .git commits if present
    const gitDir = path.join(startDirectory, ".git");
    if (fs.existsSync(gitDir)) {
      await scanGitCommitsForSecrets(
        startDirectory,
        commitLimit,
        mergedRegexes
      );
    }
  } catch (error) {
    console.error(`Error scanning: ${error.message}`);
  }
};

main();
