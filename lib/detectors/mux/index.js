const { surroundWithGroups } = require("../../regexPatterns");
const Re2 = require("re2");
const axios = require("axios");

const keywords = ["mux"];
const regexGroup = surroundWithGroups(["mux"]);

const keyPattern = new Re2(
  regexGroup +
    "\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b",
  "gi"
);
const secretPattern = new Re2(
  regexGroup + "([ \r\n]{0,1}[0-9A-Za-z/+]{75}[ \r\n]{1})",
  "gi"
);

const scan = async (verify, data) => {
  const matches = String(data).matchAll(keyPattern, -1);
  const secretMatches = String(data).matchAll(secretPattern, -1);
  let result = { detectorType: "Mux", verified: false };

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
          await axios.get("https://api.mux.com/video/v1/assets", {
            auth: {
              username: resMatch,
              password: secretMatchValue,
            },
          });
          result.verified = true;
        } catch (error) {}
      }
      return result;
    }
  }
};

const detectorType = "MUX_DETECTOR";

module.exports = { scan, keywords, detectorType };
