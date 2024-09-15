const { surroundWithGroups } = require("../../regexPatterns");
const Re2 = require("re2");

const keywords = ["agora"];

const regexGroup = surroundWithGroups(["agora"]);
const keyPattern = new Re2(regexGroup + "\\b([a-z0-9]{32})\\b", "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const results = Array.from(matches)
    .filter((match) => match.length === 2)
    .map((match) => {
      return {
        detectorType: "Agora",
        rawValue: match[1].trim(),
        verified: false,
      };
    });

  return results;
};

const detectorType = "AGORA_DETECTOR";

module.exports = { scan, keywords, detectorType };
