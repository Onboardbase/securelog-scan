const { exec, execSync } = require("child_process");
const readline = require("readline");
const path = require("path");
const chalk = require("chalk");
const fs = require("fs");

// Function to scan a specific line for secrets
const scanLineForSecrets = (
  line,
  lineNumber,
  filePath,
  commitHash,
  authorName,
  authorEmail,
  commitTitle,
  regexPatterns
) => {
  for (const [company, regex] of Object.entries(regexPatterns)) {
    if (regex.test(line)) {
      /**
       * get which of keyword in a string is actually a secret
       */
      const matchedValue =
        possibleSecret.split(" ").length > 1
          ? possibleSecret.match(regex)[0]
          : possibleSecret;

      console.log(
        chalk.greenBright.bold(`\nPotential secret detected in git commit:`)
      );
      console.log(`${chalk.bold("Detector:")} ${company}`);
      console.log(`${chalk.bold("File:")} ${filePath}`);
      console.log(`${chalk.bold("Line:")} ${lineNumber}`);
      console.log(`${chalk.bold("Raw Value:")} ${matchedValue || line.trim()}`);
      console.log(`${chalk.bold("Commit Hash:")} ${commitHash}`);
      console.log(`${chalk.bold("Author:")} ${authorName} <${authorEmail}>`);
      console.log(`${chalk.bold("Commit Title:")} ${commitTitle}\n`);
      break;
    }
  }
};

// Function to get changed lines from the latest commits
const getChangedLinesWithDetails = (repoPath) => {
  const changedLines = {};

  try {
    // Get all changes in the branch since the last commit that is shared with the main branch
    const gitCommand = `git log -p --first-parent --format="%H|%an|%ae|%s" origin/main..HEAD`;
    const result = execSync(gitCommand, { cwd: repoPath });
    const logOutput = result.toString().split("\n");

    let currentFile = null;
    let commitInfo = null;
    let lineOffset = 0;

    logOutput.forEach((line) => {
      if (line.includes("|")) {
        // Extract commit info
        const [commitHash, authorName, authorEmail, commitTitle] =
          line.split("|");
        commitInfo = { commitHash, authorName, authorEmail, commitTitle };
      } else if (line.startsWith("diff --git")) {
        // Extract file path
        const fileMatch = /^diff --git a\/(.+?) b\/(.+)$/.exec(line);
        if (fileMatch) {
          currentFile = fileMatch[2]; // Get the path after 'b/'
        }
      } else if (line.startsWith("@@")) {
        // Extract line number from the hunk header
        const lineMatch = /^@@ -\d+,\d+ \+(\d+),\d+ @@/.exec(line);
        if (lineMatch && currentFile && commitInfo) {
          const startLine = parseInt(lineMatch[1], 10);
          lineOffset = startLine;
          if (!changedLines[currentFile]) {
            changedLines[currentFile] = [];
          }
        }
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        // Detect added lines only
        if (currentFile && commitInfo) {
          const addedLine = line.slice(1); // Remove leading '+' character
          changedLines[currentFile].push({
            line: addedLine,
            lineNumber: lineOffset,
            ...commitInfo,
          });
          lineOffset++;
        }
      }
    });
  } catch (error) {
    console.error("Error getting changed lines:", error.message);
  }

  return changedLines;
};

// Scan only the changed lines in each file
const scanChangedLinesInFiles = (changedFiles, repoPath, regexPatterns) => {
  Object.entries(changedFiles).forEach(([filePath, lines]) => {
    const fullPath = path.join(repoPath, filePath);
    if (fs.existsSync(fullPath)) {
      lines.forEach(
        ({
          line,
          lineNumber,
          commitHash,
          authorName,
          authorEmail,
          commitTitle,
        }) => {
          scanLineForSecrets(
            line,
            lineNumber,
            filePath,
            commitHash,
            authorName,
            authorEmail,
            commitTitle,
            regexPatterns
          );
        }
      );
    }
  });
};

// Function to scan Git commits for secrets
const scanGitCommitsForSecrets = async (
  repoPath,
  limit = 100,
  regexPatterns,
  onlyChangedFiles
) => {
  if (onlyChangedFiles) {
    const changedFiles = getChangedLinesWithDetails(repoPath);
    scanChangedLinesInFiles(changedFiles, repoPath, regexPatterns);
    return;
  }

  return new Promise((resolve, reject) => {
    // Git command to get commit details, including author, diff, and title
    const gitCommand = `git log -p --max-count=${limit} --pretty=format:"commit %H|%an|%ae|%s"`;

    exec(gitCommand, { cwd: repoPath }, (err, stdout, stderr) => {
      if (err || stderr) {
        return reject(`Error executing git log: ${err || stderr}`);
      }

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });

      let currentCommit = null;

      rl.on("line", (line) => {
        if (line.startsWith("commit")) {
          // Start of a new commit block
          const commitInfo = line.substring(7).split("|");
          currentCommit = {
            hash: commitInfo[0],
            authorName: commitInfo[1],
            authorEmail: commitInfo[2],
            title: commitInfo[3],
            filePath: null, // Initialize filePath
          };
        } else if (line.startsWith("diff --git")) {
          // Start of a new file diff
          if (currentCommit) {
            const filePath = line.split(" ")[2].substring(2); // Remove 'a/' prefix
            currentCommit.filePath = path.join(repoPath, filePath);
          }
        } else if (line.startsWith("+") && !line.startsWith("+++")) {
          // Lines added in the diff
          if (currentCommit) {
            const trimmedLine = line.slice(1).trim(); // Remove the leading '+' and trim

            if (currentCommit.filePath) {
              scanLineForSecrets(
                trimmedLine,
                trimmedLine,
                currentCommit.filePath,
                currentCommit.hash,
                currentCommit.authorName,
                currentCommit.authorEmail,
                currentCommit.title,
                regexPatterns
              );
            }
          }
        }
      });

      rl.on("close", () => {
        resolve();
      });

      // Write the Git command output to the readline interface
      rl.write(stdout);
      rl.close();
    });
  });
};

module.exports = { scanGitCommitsForSecrets };
