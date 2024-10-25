import Re2 from "re2";
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["algolia"];
const regexGroup: string = surroundWithGroups(keywords);
const keyPattern: Re2 = new Re2(`${regexGroup}\\b([a-zA-Z0-9]{32})\\b`, "gi");
const idPattern: Re2 = new Re2(`${regexGroup}\\b([A-Z0-9]{10})\\b`, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const secretMatches = data.matchAll(idPattern);
  let result: ScanResult = { detectorType: "Algolia", verified: false };

  for (const match of matches) {
    if (match.length !== 2) continue;
    const resMatch = match[1].trim();

    result.rawValue = resMatch;
    result.position = match.index;

    for (const secretMatch of secretMatches) {
      if (secretMatch.length !== 2) continue;

      const secretMatchValue = secretMatch[1].trim();
      if (verify) {
        try {
          await httpClient.get(
            `https://${secretMatchValue}-dsn.algolia.net/1/keys`,
            {
              headers: {
                "X-Algolia-Application-Id": secretMatchValue,
                "X-Algolia-API-Key": resMatch,
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

const detectorType = "ALGOLIA_DETECTOR";

export const AlgoliaDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
