import { EventEmitter } from "events";
import { SecretCache, SLSCache } from "./secretCache";
import { EScannerTypes, UnifiedScanResult } from "./types/detector";
import chalk from "chalk";
import {
  getActualGitURLFilePath,
  maskString,
  prefixPathWithBaseUrl,
} from "./util";

/**
 * the idea behind this is to have a single channel where all detected secrets
 * are being tracked, it used the SLSCache as a temporary datastore for secrets
 * found
 *
 */

class SLSEventsManager extends EventEmitter {
  constructor(private secretCache: SLSCache) {
    super();
    this.on("ON_NEW_SECRET", (secret: UnifiedScanResult) => {
      this.handleNewSecret(secret);
    });
  }

  public emitNewSecret(secret: UnifiedScanResult): void {
    this.emit("ON_NEW_SECRET", secret);
  }

  /**
   * @todo refactor the logger
   * @param secret
   */
  private handleNewSecret(secret: UnifiedScanResult): void {
    this.secretCache.addSecret(secret);

    if (secret.scannerType === EScannerTypes.FILE_SCANNER) {
      console.log(
        chalk.greenBright.bold(
          `${
            secret.verified
              ? "\n💯 Found verified secret"
              : `\nPotential secret detected in ${
                  secret.url
                    ? secret.url
                    : secret.filePath === ""
                    ? "RawValue"
                    : secret.filePath
                }`
          }`
        )
      );
      console.log(`${chalk.bold("Detector:")} ${secret.detectorType}`);
      console.log(`${chalk.bold("Line:")} ${secret.position}`);
      if (secret.filePath !== "") {
        console.log(
          `${chalk.bold("File Path:")} ${
            secret.url
              ? prefixPathWithBaseUrl(
                  secret.url,
                  getActualGitURLFilePath(secret.filePath) as string
                )
              : secret.filePath
          }`
        );
      }

      console.log(
        `${chalk.bold("Raw Value:")} ${
          secret.mask
            ? maskString(secret.rawValue as string)
            : (secret.rawValue as String)
        }`
      );

      if (secret.extras) {
        for (const [key, value] of Object.entries(secret.extras)) {
          console.log(`${chalk.bold(`${key}:`)} ${value || ""}`);
        }
      }
    }

    if (secret.scannerType === EScannerTypes.GIT_SCANNER) {
      console.log(
        chalk.greenBright.bold(
          `${
            secret.verified
              ? "\n💯 Found verified secret in git commit:"
              : `\nPotential secret detected in git commit:`
          }`
        )
      );
      console.log(`${chalk.bold("Detector:")} ${secret.detectorType}`);
      console.log(
        `${chalk.bold("File:")} ${
          secret.isUrl
            ? getActualGitURLFilePath(secret.filePath)
            : secret.filePath
        }`
      );
      console.log(`${chalk.bold("Line:")} ${secret?.commitInfo?.lineNumber}`);
      console.log(
        `${chalk.bold("Raw Value:")} ${
          secret.mask
            ? maskString(secret.rawValue as string)
            : (secret.rawValue as String)
        }`
      );
      console.log(`${chalk.bold("Hash:")} ${secret.commitInfo?.hash}`);
      console.log(
        `${chalk.bold("Author:")} ${secret.commitInfo?.authorName} <${
          secret.commitInfo?.authorEmail
        }>`
      );
      console.log(`${chalk.bold("Commit:")} ${secret.commitInfo?.title}`);
      console.log(
        `${chalk.bold(
          "help:"
        )} run sls git-rewrite --secret "secrets to remove from git history`
      );
      if (secret.extras) {
        for (const [key, value] of Object.entries(secret.extras)) {
          console.log(`${chalk.bold(`${key}:`)} ${value || ""}`);
        }
      }
    }
  }
}

export const EventManager = new SLSEventsManager(SecretCache);
