const Re2 = require("re2");
const axios = require("axios");
const { surroundWithGroups } = require("../../regexPatterns");

const keywords = ["mailjet"];
const regexGroup = surroundWithGroups(["mailjet"]);

const keyPattern = new Re2(regexGroup + /\b([A-Za-z0-9]{32})\b/, "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Mailjet SMS", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        await axios.get("https://api.mailjet.com/v4/sms", {
          headers: {
            Accept: "application/vnd.mailjetsms+json; version=3",
            Authorization: `Bearer ${resMatch}`,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "MAILJET_SMS_DETECTOR";

module.exports = { scan, keywords, detectorType };
