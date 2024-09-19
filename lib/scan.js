const path = require("path");
const fs = require("fs");
const { scanDirectory } = require("./fileScanner");
const { scanGitCommitsForSecrets } = require("./gitScanner");
const { configHandler } = require("./configHandler");
const { buildCustomDetectors } = require("./regexPatterns");
const { analyzeRepository } = require("./urlScanner");

const scan = async (options) => {
  const startDirectory = options.dir || process.cwd();
  let excludedFolders = options.exclude
    .split(",")
    .map((folder) => folder.trim())
    .filter((folder) => folder);
  const commitLimit = parseInt(options.commits, 10);
  const configFile = options.config;

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
        mask: options.mask,
        customDetectors,
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
        mask: options.mask,
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
        mask: options.mask,
        customDetectors,
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

module.exports = { scan };
