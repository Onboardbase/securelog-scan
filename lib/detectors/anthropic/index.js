const Re2 = require("re2");
const axios = require("axios");

const keywords = ["sk-ant-api03", "anthropic"];
const keyPattern = new Re2(/\b(sk-ant-api03-[\w\-]{93}AA)\b/, "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Anthropic", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        await axios.post(
          "https://api.anthropic.com/v1/messages",
          {
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1024,
            messages: [{ role: "user", content: "Hello, world" }],
          },
          {
            headers: {
              "x-api-key": resMatch,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
          }
        );
        result.verified = true;
      } catch (error) {
        /**
         * this is because the token could be valid but the token should not be able to
         * create record cos of billing e.g of such error below
         *
         * Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits
         */
        if (error.response && error.response.status === 400)
          result.verified = true;
      }
    }

    return result;
  }
};

const detectorType = "ANTHROPIC_DETECTOR";

module.exports = { scan, keywords, detectorType };
