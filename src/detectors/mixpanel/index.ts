import Re2 from "re2";
import axios from "axios";
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["mixpanel"];
const regexGroup: string = surroundWithGroups(keywords);

const keyPattern: Re2 = new Re2(`${regexGroup}\\b([a-zA-Z0-9-]{32})\\b`, "gi");
const idPattern: Re2 = new Re2(
  `${regexGroup}\\b([a-zA-Z0-9.-]{30,40})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const secretMatches = data.matchAll(idPattern);
  let result: ScanResult = { detectorType: "Mixpanel", verified: false };

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
          await axios.get("https://mixpanel.com/api/app/me", {
            auth: {
              username: secretMatchValue,
              password: resMatch,
            },
          });

          result.verified = true;
        } catch (error) {}
      }
      return result;
    }
  }
  return null;
};

const detectorType = "MIXPANEL_DETECTOR";

export const MixpanelDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
