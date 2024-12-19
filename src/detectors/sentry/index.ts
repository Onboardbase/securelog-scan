import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["sentry"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-f0-9]{64})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Sentry", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://sentry.io/api/0/projects/", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
          },
        });

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "SENTRY_DETECTOR";

export const SentryDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
