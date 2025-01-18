#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import pkg from "../package.json";
import { scan } from "./scan";
import { analyzers } from "./analyzers";
import { removeSecretsFromGitHistory } from "./gitRewrite";
import { scanString } from "./scanString";
import { DecayOptions, ScanOptions, ScanStringOptions } from "./types";
import { decay } from "./decay";
import { readInputFile } from "./shared/file-input";

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
  .option("-f, --fail", "Should exist with status code of 1", false)
  .action(async (options: ScanOptions) => await scan(options));

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

program
  .command("scan-string")
  .option("--rawValue <string>", "a text string to scan for secrets")
  .option("--file <string>", "A file path to update and remove secret string")
  .option("--updateFile", "Should update file with masked secrets", false)
  .description("Scan secrets in a string")
  .action((options: ScanStringOptions) => scanString(options));

  program
  .command("decay")
  .argument("[data]", "Data to decay (optional if using --file)")
  .option("--config <string>", "Path to configuration file")
  .option("--file <string>", "Path to input file containing data to decay")
  .description("Decay sensitive data from input or file")
  .action(async (data: string | undefined, options: DecayOptions) => {
    try {

      const decayer = decay(options.config);

      let inputData: any;
      if (options.file) {
        inputData = readInputFile(options.file);
      } else if (data) {
          inputData = data;
      } else {
        throw new Error("No input provided. Use --file or provide data directly.");
      }

      const redactedData = decayer.redact(inputData);
      
      console.log(typeof redactedData === 'object' 
        ? JSON.stringify(redactedData, null, 2)
        : redactedData
      );
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });
program.parse(process.argv);
