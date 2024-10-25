import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["confluent"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-zA-Z0-9]{16})\\b`,
  "gi"
);
const secretPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-zA-Z0-9\+\/]{64})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);
  const secretPatternMatches = data.matchAll(secretPattern);

  const result: ScanResult = { detectorType: "Confluent", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    for (const secret of secretPatternMatches) {
      if (secret.length !== 2) continue;

      const secretMatch = secret[1].trim();
      result.extras = {
        "Secret Key": secretMatch,
      };

      if (verify) {
        try {
          await httpClient.get(
            `https://api.confluent.cloud/iam/v2/api-keys/${resMatch}`,
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${resMatch}:${secretMatch}`
                ).toString("base64")}`,
              },
            }
          );

          result.verified = true;
        } catch (error) {}
      }

      return result;
    }
  }

  return null;
};

const detectorType = "CONFLUENT_DETECTOR";

export const ConfluentDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
