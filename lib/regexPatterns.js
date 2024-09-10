const Re2 = require("re2");

const prefixRegex = (keywords) => {
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

// const parseRegexString = (regexString) => {
//   // Check if the regex string starts and ends with a slash, and may include flags
//   const regexWithFlags = /^\/(.+)\/([a-z]*)$/;
//   const match = regexString.match(regexWithFlags);
//   let pattern, flags;
//   if (match) {
//     // Extract the pattern and flags
//     pattern = match[1];
//     flags = match[2];
//   } else {
//     // If no surrounding slashes, assume it's just the pattern
//     pattern = regexString;
//     flags = "";
//   }
//   pattern = pattern.replace(/\\\\/g, "\\").replace(/\\\//g, "/");
//   return new RegExp(pattern, flags);
// };

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
            if (regex.test(match[0].trim())) resMatch = match[0].trim();
            else resMatch = match[1].trim();

            return {
              detectorType,
              rawValue: resMatch,
              verified: false,
            };
          }
        }
      };

      const dete = `${detectorType.toUpperCase()}_DETECTOR`;

      const result = { scan, detectorType: dete, keywords };
      customDetectorsArray.push(result);
    }
  );
  // for (const [company, { regex, keywords, detectorType }] of Object.entries(
  //   customDetectors
  // )) {
  // }

  return customDetectorsArray;
};

module.exports = { buildCustomDetectors, isWhitelisted, prefixRegex };
