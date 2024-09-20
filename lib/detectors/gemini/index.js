const Re2 = require("re2");

const keywords = ["gemini", "master-", "account-"];

const keyPattern = new Re2(/\b((?:master-|account-)[0-9A-Za-z]{20})\b/, "gi");
const secretPattern = new Re2("[A-Za-z0-9]{27,28}", "gi");

const scan = async (verify, data) => {
  const matches = String(data).matchAll(keyPattern, -1);
  const secretMatches = String(data).matchAll(secretPattern, -1);
  let result = { detectorType: "Gemini", verified: false };

  for (const match of matches) {
    if (!match || match.length !== 2) continue;
    const resMatch = match[1].trim();

    result.rawValue = resMatch;
    result.position = match.index;

    for (const secretMatch of secretMatches) {
      const secretMatchValue = secretMatch[0].trim();
      result.rawValue = resMatch + " " + secretMatchValue;
      if (verify) {
        // no verification for now
      }
      return result;
    }
  }
};

const detectorType = "GEMINI_DETECTOR";

module.exports = { scan, keywords, detectorType };
