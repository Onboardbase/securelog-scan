const { surroundWithGroups } = require("../../regexHandler");
const Re2 = require("re2");

const keywords = ["braintree"];

const regexGroup = surroundWithGroups(["braintree"]);
const keyPattern = new Re2(regexGroup + "\\b([0-9a-f]{32})\\b", "gi");
const idPattern = new Re2(regexGroup + "\\b([0-9a-z]{16})\\b", "gi");

const scan = async (verify, data) => {
  const matches = String(data).matchAll(keyPattern, -1);
  for (const match of matches) {
    if (!match || match.length !== 2) continue;
    const resMatch = match[1].trim();
    return {
      detectorType: "Braintree",
      rawValue: resMatch,
      verified: false,
      position: match.index,
    };
  }
};

const detectorType = "BRAINTREE_DETECTOR";

module.exports = { scan, keywords, detectorType };
