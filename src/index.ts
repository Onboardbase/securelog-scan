#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import pkg from "../package.json";
import { scan } from "./scan";
import { analyzers } from "./analyzers";
import { removeSecretsFromGitHistory } from "./gitRewrite";

const program = new Command();

program.name(pkg.name).description(pkg.description).version(pkg.version);

program
  .command("scan")
  .description("Scan an entire codebase for secrets")
  .option(
    "-e, --exclude <folders>",
    "Comma-separated list of folders to exclude from scanning",
    ""
  )
  .option("-c, --commits <number>", "Number of recent commits to scan", "100")
  .option("-d, --dir <string>", "Path to directory to scan")
  .option("--config <string>", "A path to secure log scan config file", "")
  .option("--changed", "Only scan changed files and lines", false)
  .option("--url <url>", "A link to a Github, Gitlab or BitBucket URL", "")
  .option(
    "-v, --verify",
    "Should be specified if secrets should be verified",
    false
  )
  .option("-m, --mask", "Should mask secret values", false)
  .option("--rawValue <string>", "a text string to scan for secrets")
  .action(async (options) => await scan(options));

program
  .command("analyze")
  .option("-s, --secret <string>", "Secret to analyze")
  .argument("<service>", "service to analyze")
  .description("Analyze secrets")
  .requiredOption(
    "-s, --secret <string>",
    "secret to analyze must be specified"
  )
  .action(async (service, options) => {
    const serviceExist = analyzers.find(
      (analyzer) => service.toLowerCase() === Object.keys(analyzer)[0]
    );
    if (!serviceExist) {
      console.error(
        chalk.red(
          `[x] Error: ${chalk.greenBright(
            "github, gitlab, mongodb, mysql, postgresql, slack"
          )} are the only supported analyzers for now`
        )
      );
      process.exit(1);
    }
    serviceExist[service.toLowerCase()](options.secret);
  });

program
  .command("git-rewrite")
  .option(
    "-p, --secrets <string>",
    "Secrets/Patterns to remove, supports regex"
  )
  .description("Remove secrets from git history")
  .action((options) => removeSecretsFromGitHistory(options.secrets));

program.parse(process.argv);
