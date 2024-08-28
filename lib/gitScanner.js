const { exec } = require("child_process");
const readline = require("readline");
const regexPatterns = require("./regexPatterns");
const path = require("path");
const chalk = require("chalk");

// Function to scan Git commits for secrets
const scanGitCommitsForSecrets = async (repoPath, limit = 100) => {
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
              for (const [company, regex] of Object.entries(regexPatterns)) {
                if (regex.test(trimmedLine)) {
                  console.log(
                    chalk.greenBright.bold(
                      `\nPotential secret detected in git commit:`
                    )
                  );
                  console.log(`${chalk.bold("Company:")} ${company}`);
                  console.log(
                    `${chalk.bold("File:")} ${currentCommit.filePath}`
                  );
                  console.log(`${chalk.bold("Line:")} ${trimmedLine}`);
                  console.log(`${chalk.bold("Matched Value:")} ${trimmedLine}`);
                  console.log(
                    `${chalk.bold("Commit Hash:")} ${currentCommit.hash}`
                  );
                  console.log(
                    `${chalk.bold("Author:")} ${currentCommit.authorName} <${
                      currentCommit.authorEmail
                    }>`
                  );
                  console.log(
                    `${chalk.bold("Commit Title:")} ${currentCommit.title}\n`
                  );
                  break;
                }
              }
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
