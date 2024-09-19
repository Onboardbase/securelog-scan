const Re2 = require("re2");
const axios = require("axios");

const keywords = ["SG."];
const keyPattern = new Re2(/\bSG\.[\w\-]{20,24}\.[\w\-]{39,50}\b/, "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Sendgrid", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await axios.get("https://api.sendgrid.com/v3/scopes", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "SENDGRID_DETECTOR";

module.exports = { scan, keywords, detectorType };
