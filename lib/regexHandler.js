const chalk = require("chalk");
const Re2 = require("re2");

const surroundWithGroups = (keywords) => {
  const middle = keywords.join("|");
  const pattern = `(?:${middle})(?:.|[\\n\\r]){0,40}?`;
  return pattern;
};

const whitelistPatterns = [
  /example/,
  /placeholder/,
  /dummy/,
  /test/,
  /sample/,
  /localhost/,
  /127\.0\.0\.1/,
  /password\s*=\s*['"]changeme['"]/i,
];

// todo: enable the use of this method later
const isWhitelisted = (input) => {
  return whitelistPatterns.some((pattern) => pattern.test(input));
};

const buildCustomDetectors = (customDetectors) => {
  const customDetectorsArray = [];

  // @todo: add support for boundary groups

  Object.entries(customDetectors).map((customDetector) => {
    const [company, configs] = customDetector;
    if (!configs) {
      console.log(
        chalk.red(
          `Error while building custom detectors: detectorType, keywords, regex is missing from detector config`
        )
      );
      process.exit(1);
    }

    const regex = configs.regex;
    const keywords = configs.keywords;
    const detectorType = configs.detectorType;
    const groups = configs.group;

    const errorMessages = [];
    if (!company) errorMessages.push("Detector Company/Service is required");
    if (!keywords || !Array.isArray(keywords))
      errorMessages.push(
        "custom detector must have keywords and it must be an array"
      );
    if (!regex)
      errorMessages.push(
        "You need to specify a regex (pattern) for your detector or disable it"
      );
    if (!detectorType) errorMessages.push("detectorType cannot be undefined");

    if (groups && (!Array.isArray(groups) || !groups.length))
      errorMessages.push("group has to be an array with boundary characters");

    if (errorMessages.length) {
      errorMessages.map((error) =>
        console.log(
          chalk.red(`Error while building custom detectors: ${error}`)
        )
      );
      process.exit(1);
    }

    let keyPatterns = {};

    if (typeof regex === "object") {
      for (const [key, value] of Object.entries(regex)) {
        keyPatterns[key] = new Re2(
          groups ? surroundWithGroups(groups) + value : value,
          "gi"
        );
      }
    }

    if (typeof regex === "string") {
      keyPatterns[company] = new Re2(
        groups ? surroundWithGroups(groups) + regex : regex,
        "gi"
      );
    }

    const scan = async (verify, data) => {
      for (const [tokenType, regex] of Object.entries(keyPatterns)) {
        const matches = String(data).matchAll(regex, -1);

        for (const match of matches) {
          if (!match) continue;
          let resMatch;
          resMatch = match.length === 1 ? match[0].trim() : match[1].trim();

          return {
            detectorType,
            rawValue: resMatch,
            verified: false,
            position: match.index,
            ...(typeof regex === "object" && {
              extras: { "Token type": tokenType },
            }),
          };
        }
      }
    };

    const detector = `${detectorType.toUpperCase()}_DETECTOR`;

    const result = { scan, detectorType: detector, keywords };
    customDetectorsArray.push(result);
  });

  return customDetectorsArray;
};

module.exports = { buildCustomDetectors, isWhitelisted, surroundWithGroups };
