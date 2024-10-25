import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["disqus"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-zA-Z0-9]{64})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = {
    detectorType: "Disqus",
    verified: false,
  };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get(
          `https://disqus.com/api/3.0/trends/listThreads.json?api_key=${resMatch}`
        );
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "DISQUS_DETECTOR";

export const DisqusDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
