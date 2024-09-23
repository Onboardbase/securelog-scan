const Re2 = require("re2");
const { surroundWithGroups } = require("../../regexHandler");
const { makeGitLabRequest } = require("../../analyzers/gitlab");

const keywords = ["gitlab"];
const keyPattern = new Re2(
  surroundWithGroups(["gitlab"]) + /\b([a-zA-Z0-9\-=_]{20,22})\b/,
  "gi"
);

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);

  const result = { detectorType: "Gitlab V1", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    if (match[0].includes("glpat-")) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await makeGitLabRequest("https://gitlab.com/api/v4/user", resMatch);
        result.verified = true;
      } catch (error) {
        if (error.response && error.response.status === 403) {
          result.verified = true;
        }
      }
    }

    return result;
  }
};

const detectorType = "GITLAB_V1_DETECTOR";

module.exports = { scan, keywords, detectorType };
