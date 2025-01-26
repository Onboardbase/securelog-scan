import { CrossRegex as Re2 } from '../../regex.polyfill';
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["mux"];
const regexGroup: string = surroundWithGroups(keywords);

const keyPattern: Re2 = new Re2(
  `${regexGroup}\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b`,
  "gi"
);
const secretPattern: Re2 = new Re2(
  `${regexGroup}([ \r\n]{0,1}[0-9A-Za-z/+]{75}[ \r\n]{1})`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = String(data).matchAll(keyPattern);
  const secretMatches = String(data).matchAll(secretPattern);
  let result: ScanResult = { detectorType: "Mux", verified: false };

  for (const match of matches) {
    if (!match || match.length !== 2) continue;
    const resMatch = match[1].trim();

    result.rawValue = resMatch;
    result.position = match.index;

    for (const secretMatch of secretMatches) {
      if (secretMatch.length !== 2) continue;

      const secretMatchValue = secretMatch[1].trim();
      if (verify) {
        try {
          await httpClient.get("https://api.mux.com/video/v1/assets", {
            auth: {
              username: resMatch,
              password: secretMatchValue,
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

const detectorType = "MUX_DETECTOR";

export const MuxDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
