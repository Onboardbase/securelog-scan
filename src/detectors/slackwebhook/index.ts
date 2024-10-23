import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["hooks.slack.com"];
const keyPatterns: Record<string, Re2> = {
  "Slack Service Webhook": new Re2(
    `(https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[A-Za-z0-9]{23,25})`,
    "gi"
  ),
  "Slack Workflow Webhook": new Re2(
    `(https://hooks\.slack\.com/workflows/T[A-Z0-9]+/A[A-Z0-9]+/[0-9]{17,19}/[A-Za-z0-9]{23,25})`,
    "gi"
  ),
};

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  let result: ScanResult = { detectorType: "Slack Webhooks", verified: false };

  for (const [tokenType, regex] of Object.entries(keyPatterns)) {
    const matches = data.matchAll(regex);
    for (const match of matches) {
      if (match.length !== 2) continue;

      const resMatch = match[1].trim();
      result.rawValue = resMatch;
      result.position = match.index;
      result.extras = {
        "Webhook Type": tokenType,
      };

      if (verify) {
        try {
          /**
           * Note: This sends a real message to the webhook detected, meaning a slack channel
           * somewhere is receiving a test message anytime this is verified
           */
          await axios.post(resMatch, {
            text: "Secret Detection Test message from Securelog Scan CLI",
          });
          result.verified = true;
        } catch (error) {}
      }

      return result;
    }
  }

  return null;
};

const detectorType = "SLACK_WEBHOOKS_DETECTOR";

export const SlackWebhooksDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
