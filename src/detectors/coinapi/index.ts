import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["coinapi"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([A-Z0-9-]{36})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "CoinAPI", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await httpClient.get("https://rest.coinapi.io/v1/exchanges", {
          headers: {
            "X-CoinAPI-Key": resMatch,
          },
        });

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "COINAPI_DETECTOR";

export const CoinApiDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
