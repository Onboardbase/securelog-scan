const Re2 = require("re2");
const { getTokenMetadata } = require("../../analyzers/github/classicTokens");
const { formatExpiryDate } = require("../../util");

const keywords = ["github", "gh", "pat", "token"];
const keyPattern = new Re2(
  `\\b(?:github|gh|pat|token)[^\.].{0,40}[ =:'"]+([a-f0-9]{40})\\b`,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);

  const result = { detectorType: "Github Classic Token", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;

    if (verify) {
      try {
        const metadata = await getTokenMetadata(resMatch, false);
        result.extras = {
          email: metadata.user.email,
          scopes: metadata.oauthScopes.toString(),
          expiry: formatExpiryDate(metadata.expiration),
          username: metadata.user.login,
          version: 1,
        };
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "GITHUB_CLASSIC_TOKEN_V1_DETECTOR";

module.exports = { scan, keywords, detectorType };
