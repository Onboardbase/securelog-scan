import Re2 from "re2";
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["facebook", "meta"];
const regexGroup: string = surroundWithGroups(keywords);
const secretPattern: Re2 = new Re2(
  `${regexGroup}\\b([A-Za-z0-9]{32})\\b`,
  "gi"
);
const idPattern: Re2 = new Re2(`${regexGroup}\\b([0-9]{15,18})\\b`, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const secretPatternMatches = data.matchAll(secretPattern);
  const idPatternMatches = data.matchAll(idPattern);
  let result: ScanResult = { detectorType: "Facebook OAuth", verified: false };

  for (const match of idPatternMatches) {
    if (match.length !== 2) continue;
    const idMatch = match[1].trim();

    result.rawValue = idMatch;
    result.position = match.index;

    for (const secretMatch of secretPatternMatches) {
      if (secretMatch.length !== 2) continue;

      const secretMatchValue = secretMatch[1].trim();
      if (verify) {
        try {
          await httpClient.get(
            `https://graph.facebook.com/me?access_token=${idMatch}|${secretMatchValue}`
          );

          result.verified = true;
        } catch (error) {}
      }
      return result;
    }
  }

  return null;
};

const detectorType = "FACEBOOK_OAUTH_DETECTOR";

export const FacebookOAuthDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
