import Re2 from "re2";
import { surroundWithGroups } from "../../regexHandler";
import { makeGitLabRequest } from "../../analyzers/gitlab";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["gitlab"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-z0-9]{20,22})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "Gitlab V1", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;
    if (match[0].includes("glpat-")) continue;

    const resMatch = match[1].trim();

    /**
     * exclude false positives, a gilab v1 token is suppose to start with go and a
     * 20/22 length character
     */
    if (!resMatch.startsWith("go")) continue;

    result.rawValue = resMatch;
    result.position = match.index;
    result.extras = {
      version: 1,
    };

    if (verify) {
      try {
        await makeGitLabRequest("https://gitlab.com/api/v4/user", resMatch);
        result.verified = true;
      } catch (error: any) {
        if (error.response && error.response.status === 403) {
          result.verified = true;
        }
      }
    }

    return result;
  }

  return null;
};

const detectorType = "GITLAB_V1_DETECTOR";

export const GitLabDetectorV1: Detector = {
  scan,
  keywords,
  detectorType,
};
