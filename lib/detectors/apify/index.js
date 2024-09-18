const Re2 = require("re2");
const axios = require("axios");

const keywords = ["apify"];
const keyPattern = new Re2(/\b(apify\_api\_[a-zA-Z-0-9]{36})\b/, "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Apify", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        await axios.get(
          `https://api.apify.com/v2/acts?token=${resMatch}&my=true&offset=10&limit=99&desc=true`
        );
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "APIFY_DETECTOR";

module.exports = { scan, keywords, detectorType };
