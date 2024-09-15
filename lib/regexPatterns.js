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

  Object.entries(customDetectors).map(
    ([company, { regex, keywords, detectorType }]) => {
      let keyPatterns = {};

      if (typeof regex === "object") {
        for (const [key, value] of Object.entries(regex)) {
          keyPatterns[key] = new Re2(value, "gi");
        }
      }

      if (typeof regex === "string") {
        keyPatterns[company] = new Re2(regex, "gi");
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
            };
          }
        }
      };

      const detector = `${detectorType.toUpperCase()}_DETECTOR`;

      const result = { scan, detectorType: detector, keywords };
      customDetectorsArray.push(result);
    }
  );

  return customDetectorsArray;
};

module.exports = { buildCustomDetectors, isWhitelisted, surroundWithGroups };
