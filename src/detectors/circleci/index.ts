import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";

const keywords: string[] = ["circle"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}([a-fA-F0-9]{40})`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Circle CI", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await axios.get("https://circleci.com/api/v2/me", {
          headers: {
            "Circle-Token": resMatch,
          },
        });

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "CIRCLECI_DETECTOR";

export const CircleCiDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
