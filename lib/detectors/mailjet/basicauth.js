const Re2 = require("re2");
const axios = require("axios");
const { surroundWithGroups } = require("../../regexPatterns");

const keywords = ["mailjet"];
const regexGroup = surroundWithGroups(["mailjet"]);

const keyPattern = new Re2(regexGroup + /\b([A-Za-z0-9]{87}\=)/, "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Mailjet Basic Auth", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        await axios.get("https://api.mailjet.com/v3/REST/message", {
          headers: {
            Authorization: `Basic ${resMatch}`,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "MAILJET_BASIC_AUTH_DETECTOR";

module.exports = { scan, keywords, detectorType };
