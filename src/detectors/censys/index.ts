import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";

const keywords: string[] = ["censys"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-zA-Z0-9]{32})\\b`,
  "gi"
);
const idPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-z0-9-]{36})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);
  const idPattenMatches = data.matchAll(idPattern);

  const result: ScanResult = { detectorType: "Censys", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    for (const idPattenMatch of idPattenMatches) {
      if (idPattenMatch.length !== 2) continue;

      const id = idPattenMatch[1].trim();
      result.extras = {
        censysId: id,
      };

      if (verify) {
        try {
          await axios.get("https://search.censys.io/api/v1/account", {
            auth: {
              username: id,
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

const detectorType = "CENSYS_DETECTOR";

export const CensysDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
