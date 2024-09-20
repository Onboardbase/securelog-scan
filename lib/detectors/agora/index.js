const { surroundWithGroups } = require("../../regexPatterns");
const Re2 = require("re2");

const keywords = ["agora"];

const regexGroup = surroundWithGroups(["agora"]);
const keyPattern = new Re2(regexGroup + "\\b([a-z0-9]{32})\\b", "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);

  for (const match of matches) {
    if (match.length !== 2) continue;
    const resMatch = match[1].trim();
    return {
      detectorType: "Agora",
      rawValue: resMatch,
      verified: false,
      position: match.index,
    };
  }
};

const detectorType = "AGORA_DETECTOR";

module.exports = { scan, keywords, detectorType };
