import chalk from "chalk";
import Re2 from "re2";
import { DetectorConfig, Detector, ScanResult } from "./types/detector";

/**
 * Surrounds keywords with boundary groups to ensure they are matched within a limited context.
 * @param keywords - An array of keywords to surround.
 * @returns A string pattern for matching keywords with boundaries.
 */
export const surroundWithGroups = (keywords: string[]): string => {
  const middle = keywords.join("|");
  return `(?:${middle})(?:.|[\\n\\r]){0,40}?`;
};

// Whitelist patterns to exclude certain common test data from detection.
const whitelistPatterns: RegExp[] = [
  /example/,
  /placeholder/,
  /dummy/,
  /test/,
  /sample/,
  /localhost/,
  /127\.0\.0\.1/,
  /password\s*=\s*['"]changeme['"]/i,
];

export const isWhitelisted = (input: string): boolean => {
  return whitelistPatterns.some((pattern) => pattern.test(input));
};

/**
 * Validates a custom detector configuration and throws detailed errors if invalid.
 * @param config - The custom detector configuration to validate.
 */
export const validateDetectorConfig = (config: DetectorConfig): void => {
  const { regex, keywords, detectorType, group } = config;
  const errors: string[] = [];

  if (!keywords || !Array.isArray(keywords)) {
    errors.push("Custom detector must have an array of keywords.");
  }
  if (!regex) {
    errors.push("You need to specify a regex pattern for your detector.");
  }
  if (!detectorType) {
    errors.push("Detector type cannot be undefined.");
  }
  if (group && (!Array.isArray(group) || !group.length)) {
    errors.push("Group must be an array with boundary characters.");
  }

  if (errors.length > 0) {
    /**
     * @todo
     * look into properly throwing an error to SDK and other
     * shared utils
     */
    errors.forEach((error) => console.error(chalk.red(`Error: ${error}`)));
    throw new Error("Invalid custom detector configuration.");
  }
};

/**
 * Builds regex patterns for each detector configuration.
 * @param config - The custom detector configuration.
 * @returns A map of regex patterns for each keyword or group.
 */
const buildKeyPatterns = (config: DetectorConfig): Record<string, Re2> => {
  const { regex, keywords, detectorType, group } = config;
  const keyPatterns: Record<string, Re2> = {};

  if (typeof regex === "object") {
    for (const [key, value] of Object.entries(regex)) {
      keyPatterns[key] = new Re2(
        group ? surroundWithGroups(group) + value : value,
        "gi"
      );
    }
  } else if (typeof regex === "string") {
    keyPatterns[detectorType] = new Re2(
      group ? surroundWithGroups(group) + regex : regex,
      "gi"
    );
  }

  return keyPatterns;
};

/**
 * Builds custom detectors from the provided configurations.
 * @param customDetectors - A record of custom detector configurations.
 * @returns An array of detectors.
 */
export const buildCustomDetectors = (
  customDetectors: Record<string, DetectorConfig>
): Detector[] => {
  const customDetectorsArray: Detector[] = [];

  Object.entries(customDetectors).forEach(([company, config]) => {
    // Validate the custom detector config
    validateDetectorConfig(config);

    const keyPatterns = buildKeyPatterns(config);

    // Define the scanning function
    const scan = async (
      verify: boolean | undefined,
      data: string
    ): Promise<ScanResult | null> => {
      for (const [tokenType, regex] of Object.entries(keyPatterns)) {
        const matches = data.matchAll(regex);

        for (const match of matches) {
          if (!match) continue;
          const resMatch = match[match.length - 1].trim();

          return {
            detectorType: config.detectorType,
            rawValue: resMatch,
            verified: false,
            position: match.index,
            ...(typeof regex === "object" && {
              extras: { "Token type": tokenType },
            }),
          };
        }
      }

      return null;
    };

    const detectorType = `${config.detectorType.toUpperCase()}_DETECTOR`;

    customDetectorsArray.push({
      scan,
      detectorType,
      keywords: config.keywords,
    });
  });

  return customDetectorsArray;
};
