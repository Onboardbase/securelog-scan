import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["flickr"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([0-9a-z]{32})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Flickr", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get(
          `https://flickr.com/services/rest/?method=flickr.tags.getHotList&api_key=${resMatch}`
        );

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "FLICKR_DETECTOR";

export const FlickrDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
