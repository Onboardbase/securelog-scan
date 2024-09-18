const Re2 = require("re2");
const axios = require("axios");

const keywords = ["postman", "PMAK-"];
const keyPattern = new Re2(/\b(PMAK-[a-zA-Z-0-9]{59})\b/, "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Postman", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;
    const resMatch = match[1].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        await axios.get("https://api.getpostman.com/collections", {
          headers: {
            "x-api-key": resMatch,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "POSTMAN_DETECTOR";

module.exports = { scan, keywords, detectorType };
