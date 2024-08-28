#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { scanDirectory } = require("../lib/fileScanner");
const { scanGitCommitsForSecrets } = require("../lib/gitScanner");
const { program } = require("commander");

program
  .option(
    "-e, --exclude <folders>",
    "Comma-separated list of folders to exclude from scanning",
    ""
  )
  .option("-c, --commits <number>", "Number of recent commits to scan", 100)
  .parse(process.argv);

const options = program.opts();
const startDirectory = process.argv[2] || process.cwd();
const excludedFolders = options.exclude
  .split(",")
  .map((folder) => folder.trim())
  .filter((folder) => folder);
const commitLimit = parseInt(options.commits, 10);

const main = async () => {
  try {
    // Scan the codebase
    await scanDirectory(startDirectory, excludedFolders);

    // Scan .git commits if present
    const gitDir = path.join(startDirectory, ".git");
    if (fs.existsSync(gitDir)) {
      await scanGitCommitsForSecrets(startDirectory, commitLimit);
    }
  } catch (error) {
    console.error(`Error scanning: ${error.message}`);
  }
};

main();
