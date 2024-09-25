import Re2 from "re2";
import { makeGitLabRequest } from "../../analyzers/gitlab";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["glpat-"];
const keyPattern: Re2 = new Re2(`\\b(glpat-[a-zA-Z0-9\\-=_]{20,22})\\b`, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "Gitlab V2", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

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

const detectorType = "GITLAB_V2_DETECTOR";

export const GitLabDetectorV2: Detector = {
  scan,
  keywords,
  detectorType,
};
