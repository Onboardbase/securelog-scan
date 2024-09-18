const Re2 = require("re2");
const axios = require("axios");

const keywords = ["okta"];

const domainPattern = new Re2(
  /\b[a-z0-9-]{1,40}\.okta(?:preview|-emea){0,1}\.com\b/,
  "gi"
);
const tokenPattern = new Re2(/\b00[a-zA-Z0-9_-]{40}\b/, "gi");

const scan = async (verify, data) => {
  const domainMatches = String(data).matchAll(domainPattern, -1);
  const tokenMatches = String(data).matchAll(tokenPattern, -1);

  const results = [];

  for (const tokenMatch of tokenMatches) {
    const token = tokenMatch[0];

    for (const domainMatch of domainMatches) {
      const domain = domainMatch[0];

      let result = { detectorType: "Okta", verified: false, rawValue: token };
      if (verify) {
        const url = `https://${domain}/api/v1/users/me`;
        try {
          const response = await axios.get(url, {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `SSWS ${token}`,
            },
          });

          if (response.data.includes("activated")) {
            result.verified = true;
          }
        } catch (error) {
          continue; // Continue to the next iteration if an error occurs
        }
      }

      results.push(result);
    }
  }
};

const detectorType = "OKTA_DETECTOR";

module.exports = { scan, keywords, detectorType };
