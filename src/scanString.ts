import { processPossibleSecretsInString } from "./fileScanner";
import chalk from "chalk";
import { ScanStringOptions } from "./types";
import { AhoCorasickCore } from "./ahocorasick";
import {
  buildCustomDetectorsFromConfig,
  mergeConfigWithUserOptions,
} from "./scan";

/**
 * Scan for secrets in a repository or directory based on the provided options.
 * @param options - The scanning options provided by the user.
 */
export const scanString = async (options: ScanStringOptions): Promise<void> => {
  const configFile = options.config;

  try {
    const config = mergeConfigWithUserOptions(configFile, []);
    const customDetectors = buildCustomDetectorsFromConfig(config);

    const core = new AhoCorasickCore(customDetectors);

    /**
     * do not display this if options.rawValue is being passed
     *
     * that is because the user might be passing the direct response
     */
    await processPossibleSecretsInString(options, core);
  } catch (error: any) {
    console.error(chalk.red(`Error scanning string: ${error.message}`));
    process.exit(1);
  }
};
