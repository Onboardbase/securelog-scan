import chalk from "chalk";
import { execSync } from "child_process";
import fs from "fs";

const checkGitFilterRepoInstalled = (): void => {
  try {
    execSync("git-filter-repo --version", { stdio: "ignore" });
  } catch (error) {
    console.log(chalk.red("git-filter-repo is not installed."));
    checkPipOrManualInstall();
  }
};

const checkPipOrManualInstall = (): void => {
  try {
    execSync("pip --version", { stdio: "ignore" });
    console.log(chalk.blue("Installing git-filter-repo via pip..."));
    runCommand("pip install git-filter-repo");
  } catch (error) {
    console.log(
      chalk.red("pip is not installed and couldn't find Python on this system.")
    );
    console.log(chalk.blue("Please install `git-filter-repo` manually from:"));
    console.log(
      chalk.greenBright("https://github.com/newren/git-filter-repo/releases")
    );
    process.exit(1);
  }
};

const runCommand = (command: string): string => {
  try {
    return execSync(command, { stdio: "pipe" }).toString().trim();
  } catch (error) {
    console.error(chalk.red(`Error running command: ${command}`));
    process.exit(1);
  }
};

/**
 * Note: this method removes secrets from git history from all branches
 * under the current working directory
 */
export const removeSecretsFromGitHistory = (secrets: string) => {
  if (!secrets) {
    console.error(chalk.red("Secrets/Patterns to remove must be specified"));
    process.exit(1);
  }

  checkGitFilterRepoInstalled();

  if (!fs.existsSync(".git")) {
    console.error(chalk.red("No git repository found in project"));
    process.exit(1);
  }

  const branches = runCommand("git branch -a")
    .split("\n")
    .map((branch) => branch.replace("*", "").trim())
    .filter((branch) => branch.length > 0);

  const filterFileName = "replace-pattern.txt";
  fs.writeFileSync(filterFileName, `${secrets}==>REMOVED`);
  console.log(chalk.blue("Temporary replacement filter created."));

  branches.forEach((branch) => {
    if (branch.startsWith("remotes/")) {
      return; // Skip remote branches
    }

    console.log(chalk.blue(`Switching to branch: ${branch}`));
    runCommand(`git checkout ${branch}`);

    console.log(chalk.blue(`Running git-filter-repo on branch '${branch}'...`));
    runCommand(`git filter-repo --replace-text ${filterFileName} --force`);
  });

  fs.unlinkSync(filterFileName);
  console.log(chalk.greenBright("Cleaning up and repacking the repository..."));
  runCommand("git reflog expire --expire=now --all");
  runCommand("git gc --prune=now --aggressive");

  console.log(
    chalk.greenBright(
      "All secrets matching the specified secret/pattern has been removed from the Git history"
    )
  );
  console.log(
    "This script modifies the Git history, so you should force-push the cleaned branches to the remote repository after running this:"
  );
  console.log(chalk.yellow.bold("git push --force --all"));
};
