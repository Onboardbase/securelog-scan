const Re2 = require("re2");
const axios = require("axios");

const keywords = ["xoxb-", "xoxp-", "xoxa-", "xoxr-"];
const keyPatterns = {
  "Slack Bot Token": new Re2(
    "xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
  "Slack User Token": new Re2(
    "xoxp-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
  "Slack Workspace Access Token": new Re2(
    "xoxa-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
  "Slack Workspace Refresh Token": new Re2(
    "xoxr-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
};

const scan = async (verify, data) => {
  const result = { detectorType: "Slack", verified: false };

  for (const [tokenType, regex] of Object.entries(keyPatterns)) {
    const matches = String(data).matchAll(regex, -1);
    for (const match of matches) {
      if (!match) continue;

      const resMatch = match[0].trim();
      result.rawValue = resMatch;
      result.position = match.index;
      result.extras = {
        "Token type": tokenType,
      };

      if (verify) {
        try {
          const response = await axios.get("https://slack.com/api/auth.test", {
            headers: {
              Authorization: `Bearer ${resMatch}`,
            },
          });
          if (response.data.ok === true) result.verified = true;
        } catch (error) {}
      }

      return result;
    }
  }
};

const detectorType = "SLACK_DETECTOR";

module.exports = { scan, keywords, detectorType };
