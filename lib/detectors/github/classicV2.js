const Re2 = require("re2");
const { getTokenMetadata } = require("../../analyzers/github/classicTokens");
const { formatExpiryDate } = require("../../util");

const keywords = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_", "github_pat_"];
const keyPattern = new Re2(
  `\\b((?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255})\\b`,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);

  const result = { detectorType: "Github Classic Token", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        const metadata = await getTokenMetadata(resMatch);
        result.extras = {
          email: metadata.user.email,
          scopes: metadata.oauthScopes.toString(),
          expiry: formatExpiryDate(metadata.expiration),
          username: metadata.user.login,
          version: 2,
        };
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "GITHUB_CLASSIC_TOKEN_DETECTOR";

module.exports = { scan, keywords, detectorType };
