const { spawn } = require("child_process");
const readline = require("readline");
const path = require("path");
const chalk = require("chalk");
const fs = require("fs");
const { getActualGitURLFilePath } = require("./util");
const { detectors } = require("./detectors/detectors");

// Helper function to run a Git command and process output line by line
const runGitCommand = (repoPath, gitArgs, lineHandler, excludedFolders) => {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn("git", gitArgs, { cwd: repoPath });
    const rl = readline.createInterface({
      input: gitProcess.stdout,
      terminal: false,
    });

    rl.on("line", (line) => {
      const isExcluded = excludedFolders.some((folder) =>
        line.includes(folder.trim())
      );
      if (!isExcluded) {
        lineHandler(line);
      }
    });

    rl.on("close", resolve);

    gitProcess.on("error", (err) => {
      reject(`Error executing git log: ${err.message}`);
    });

    gitProcess.stderr.on("data", (data) => {
      reject(`Error executing git log: ${data.toString()}`);
    });
  });
};

// Function to scan a specific line for secrets
const scanLineForSecrets = async (
  line,
  commitInfo,
  filePath,
  isUrl,
  verify
) => {
  await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(verify, line);

      if (scanResponse) {
        logPotentialSecret(scanResponse, commitInfo, filePath, isUrl);
      }
    })
  );
};

// Helper function to print scan results
const logPotentialSecret = (scanResponse, commitInfo, filePath, isUrl) => {
  console.log(
    chalk.greenBright.bold(
      `${
        scanResponse.verified
          ? "\n💯 Found verified secret in git commit:"
          : `\nPotential secret detected in git commit:`
      }`
    )
  );
  console.log(`${chalk.bold("Detector:")} ${scanResponse.detectorType}`);
  console.log(
    `${chalk.bold("File:")} ${
      isUrl ? getActualGitURLFilePath(filePath) : filePath
    }`
  );
  console.log(`${chalk.bold("Line:")} ${commitInfo.lineNumber}`);
  console.log(`${chalk.bold("Raw Value:")} ${scanResponse.rawValue}`);
  console.log(`${chalk.bold("Hash:")} ${commitInfo.hash}`);
  console.log(
    `${chalk.bold("Author:")} ${commitInfo.authorName} <${
      commitInfo.authorEmail
    }>`
  );
  console.log(`${chalk.bold("Commit:")} ${commitInfo.title}\n`);
};

// Extracts changed lines with details from Git log output
const getChangedLinesWithDetails = async (repoPath, excludedFolders) => {
  const changedLines = {};
  const gitArgs = [
    "log",
    "-p",
    "--first-parent",
    '--format="%H|%an|%ae|%s"',
    "origin/main..HEAD",
  ];

  let currentFile = null;
  let commitInfo = null;
  let lineOffset = 0;

  const lineHandler = (line) => {
    if (line.includes("|")) {
      const [commitHash, authorName, authorEmail, commitTitle] =
        line.split("|");
      commitInfo = {
        hash: commitHash,
        authorName,
        authorEmail,
        title: commitTitle,
        lineNumber: 0,
      };
    } else if (line.startsWith("diff --git")) {
      const fileMatch = /^diff --git a\/(.+?) b\/(.+)$/.exec(line);
      if (fileMatch) {
        currentFile = fileMatch[2]; // Get the path after 'b/'
      }
    } else if (line.startsWith("@@")) {
      const lineMatch = /^@@ -\d+,\d+ \+(\d+),\d+ @@/.exec(line);
      if (lineMatch && currentFile && commitInfo) {
        const startLine = parseInt(lineMatch[1], 10);
        lineOffset = startLine;
        if (!changedLines[currentFile]) {
          changedLines[currentFile] = [];
        }
      }
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      if (currentFile && commitInfo) {
        const addedLine = line.slice(1); // Remove leading '+' character
        commitInfo.lineNumber = lineOffset; // Set the line number for the current commit info
        changedLines[currentFile].push({
          line: addedLine,
          lineNumber: lineOffset,
          hash: commitInfo.hash,
          title: commitInfo.title,
          authorName: commitInfo.authorName,
          authorEmail: commitInfo.authorEmail,
        });

        lineOffset++;
      }
    }
  };

  await runGitCommand(repoPath, gitArgs, lineHandler, excludedFolders);
  return changedLines;
};

// Scans changed lines in files for secrets
const scanChangedLinesInFiles = (changedFiles, repoPath, verify) => {
  Object.entries(changedFiles).forEach(([filePath, lines]) => {
    if (fs.existsSync(repoPath)) {
      lines.forEach(
        ({ line, lineNumber, hash, authorName, authorEmail, title }) => {
          scanLineForSecrets(
            line,
            { lineNumber, hash, authorName, authorEmail, title },
            filePath,
            false,
            verify
          );
        }
      );
    }
  });
};

// Main function to scan Git commits for secrets
const scanGitCommitsForSecrets = async ({
  startDirectory,
  commitLimit = 100,
  changed,
  excludedFolders,
  verify,
  url,
}) => {
  if (changed) {
    const changedFiles = await getChangedLinesWithDetails(
      startDirectory,
      excludedFolders
    );
    scanChangedLinesInFiles(changedFiles, startDirectory, verify);
    return;
  }

  const gitArgs = [
    "log",
    "-p",
    `--max-count=${commitLimit}`,
    "--pretty=format:commit %H|%an|%ae|%s",
  ];

  let currentCommit = null;

  const lineHandler = (line) => {
    if (line.startsWith("commit")) {
      const commitInfo = line.substring(7).split("|");
      currentCommit = {
        hash: commitInfo[0],
        authorName: commitInfo[1],
        authorEmail: commitInfo[2],
        title: commitInfo[3],
        filePath: null,
        lineNumber: 0, // Initialize line number
      };
    } else if (line.startsWith("diff --git")) {
      if (currentCommit) {
        const filePath = line.split(" ")[2].substring(2); // Remove 'a/' prefix
        currentCommit.filePath = path.join(startDirectory, filePath);
      }
    } else if (line.startsWith("@@")) {
      const lineMatch = /^@@ -\d+,\d+ \+(\d+),\d+ @@/.exec(line);
      if (lineMatch && currentCommit) {
        currentCommit.lineNumber = parseInt(lineMatch[1], 10); // Update line number
      }
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      if (currentCommit) {
        const trimmedLine = line.slice(1).trim(); // Remove the leading '+' and trim
        if (currentCommit.filePath) {
          scanLineForSecrets(
            trimmedLine,
            currentCommit,
            currentCommit.filePath,
            url,
            verify
          );
          currentCommit.lineNumber++; // Increment line number for each new added line
        }
      }
    }
  };

  await runGitCommand(
    startDirectory,
    gitArgs,
    lineHandler,
    excludedFolders,
    verify
  );
};

module.exports = { scanGitCommitsForSecrets };
