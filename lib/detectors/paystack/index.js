const Re2 = require("re2");
const axios = require("axios");

const keywords = ["paystack", "sk_"];
const keyPattern = new Re2(/\bsk\_[a-z]{1,}\_[A-Za-z0-9]{40}\b/, "gi");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "Paystack", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        await axios.get("https://api.paystack.co/customer", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
          },
        });
        result.verified = true;
      } catch (error) {
        console.log("error", error);
      }
    }

    return result;
  }
};

const detectorType = "PAYSTACK_DETECTOR";

module.exports = { scan, keywords, detectorType };
