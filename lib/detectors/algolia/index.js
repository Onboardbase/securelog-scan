const Re2 = require("re2");
const axios = require("axios");
const { surroundWithGroups } = require("../../regexPatterns");

const keywords = ["algolia"];
const regexGroup = surroundWithGroups(["algolia"]);

const keyPattern = new Re2(regexGroup + "\\b([a-zA-Z0-9]{32})\\b", "gi");
const idPattern = new Re2(regexGroup + "\\b([A-Z0-9]{10})\\b", "gi");

const scan = async (verify, data) => {
  const matches = String(data).matchAll(keyPattern, -1);
  const secretMatches = String(data).matchAll(idPattern, -1);
  let result = { detectorType: "Algolia", verified: false };

  for (const match of matches) {
    if (!match || match.length !== 2) continue;
    const resMatch = match[1].trim();

    result.rawValue = resMatch;
    result.position = match.index;

    for (const secretMatch of secretMatches) {
      if (secretMatch.length !== 2) continue;

      const secretMatchValue = secretMatch[1].trim();
      if (verify) {
        try {
          await axios.get(
            `https://${secretMatchValue}-dsn.algolia.net/1/keys`,
            {
              headers: {
                "X-Algolia-Application-Id": secretMatchValue,
                "X-Algolia-API-Key": resMatch,
              },
            }
          );

          result.verified = true;
        } catch (error) {}
      }
      return result;
    }
  }
};

const detectorType = "ALGOLIA_DETECTOR";

module.exports = { scan, keywords, detectorType };
