import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";

const keywords: string[] = ["coinbase"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([a-zA-Z-0-9]{64})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = { detectorType: "Coinbase", verified: false };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await axios.get("https://api.coinbase.com/v2/user", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
          },
        });

        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "COINBASE_DETECTOR";

export const CoinbaseDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
