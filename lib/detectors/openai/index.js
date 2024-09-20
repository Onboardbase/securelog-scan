const Re2 = require("re2");
const axios = require("axios");

const keywords = ["T3BlbkFJ"];
const keyPattern = new Re2(
  /\b(sk-[[:alnum:]_-]+T3BlbkFJ[[:alnum:]_-]+)\b/,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "OpenAI", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        const { data } = await axios.get("https://api.openai.com/v1/me", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
          },
        });
        result.verified = true;

        result.extras = {
          id: data.id,
          mfa_enabled: data.mfa_flag_enabled,
          created_at: new Date(data.created).toLocaleDateString(),
          total_orgs: data.orgs.data.length,
          ...(data.orgs.data.length && {
            description: data.orgs.data[0].description,
            is_personal: data.orgs.data[0].personal,
            is_default: data.orgs.data[0].is_default,
          }),
        };
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "OPENAI_DETECTOR";

module.exports = { scan, keywords, detectorType };
