const { surroundWithGroups } = require("../../regexPatterns");
const Re2 = require("re2");

const keywords = ["mailgun"];

const regexGroup = surroundWithGroups(["mailgun"]);
const keyPatterns = {
  "Original Mailgun Token": new Re2(
    regexGroup + "\\b([a-zA-Z-0-9]{72})\\b",
    "gi"
  ),
  "Key-Mailgun Token": new Re2("\\b(key-[a-z0-9]{32})\\b", "gi"),
  "Hex Mailgun Token": new Re2(
    "\\b([a-f0-9]{32}-[a-f0-9]{8}-[a-f0-9]{8})\\b",
    "gi"
  ),
};

const scan = async (verify, data) => {
  for (const [tokenType, regex] of Object.entries(keyPatterns)) {
    const matches = String(data).matchAll(regex, -1);
    for (const match of matches) {
      if (!match || match.length !== 2) continue;
      const resMatch = match[1].trim();
      return {
        extras: {
          "Token type": tokenType,
        },
        detectorType: "Mailgun",
        rawValue: resMatch,
        verified: false,
        position: match.index,
      };
    }
  }
};

const detectorType = "MAILGUN_DETECTOR";

module.exports = { scan, keywords, detectorType };
