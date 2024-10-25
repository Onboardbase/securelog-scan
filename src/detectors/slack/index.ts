import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["xoxb-", "xoxp-", "xoxa-", "xoxr-"];
const keyPatterns: Record<string, Re2> = {
  "Slack Bot Token": new Re2(
    "xoxb-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
  "Slack User Token": new Re2(
    "xoxp-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
  "Slack Workspace Access Token": new Re2(
    "xoxa-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
  "Slack Workspace Refresh Token": new Re2(
    "xoxr-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*",
    "gi"
  ),
};

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  let result: ScanResult = { detectorType: "Slack", verified: false };

  for (const [tokenType, regex] of Object.entries(keyPatterns)) {
    const matches = data.matchAll(regex);
    for (const match of matches) {
      if (!match) continue;

      const resMatch = match[0].trim();
      result.rawValue = resMatch;
      result.position = match.index;
      result.extras = {
        "Token type": tokenType,
      };

      if (verify) {
        try {
          const response = await httpClient.get(
            "https://slack.com/api/auth.test",
            {
              headers: {
                Authorization: `Bearer ${resMatch}`,
              },
            }
          );
          if (response.data.ok === true) result.verified = true;
        } catch (error) {}
      }

      return result;
    }
  }

  return null;
};

const detectorType = "SLACK_DETECTOR";

export const SlackDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
