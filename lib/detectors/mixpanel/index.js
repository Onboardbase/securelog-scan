const Re2 = require("re2");
const axios = require("axios");
const { surroundWithGroups } = require("../../regexPatterns");

const keywords = ["mixpanel"];
const regexGroup = surroundWithGroups(["mixpanel"]);

const keyPattern = new Re2(regexGroup + "\\b([a-zA-Z0-9-]{32})\\b", "gi");
const idPattern = new Re2(regexGroup + "\\b([a-zA-Z0-9.-]{30,40})\\b", "gi");

const scan = async (verify, data) => {
  const matches = String(data).matchAll(keyPattern, -1);
  const secretMatches = String(data).matchAll(idPattern, -1);
  let result = { detectorType: "Mixpanel", verified: false };

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
          await axios.get("https://mixpanel.com/api/app/me", {
            auth: {
              username: secretMatchValue,
              password: resMatch,
            },
          });

          result.verified = true;
        } catch (error) {}
      }
      return result;
    }
  }
};

const detectorType = "MIXPANEL_DETECTOR";

module.exports = { scan, keywords, detectorType };
