import { CrossRegex as Re2 } from '../../regex.polyfill';
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["braintree"];

const regexGroup: string = surroundWithGroups(keywords);
const keyPattern: Re2 = new Re2(`${regexGroup}\\b([0-9a-f]{32})\\b`, "gi");
const idPattern: Re2 = new Re2(`${regexGroup}\\b([0-9a-z]{16})\\b`, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = String(data).matchAll(keyPattern);

  for (const match of matches) {
    if (!match || match.length !== 2) continue;
    const resMatch: string = match[1].trim();
    return {
      detectorType: "Braintree",
      rawValue: resMatch,
      verified: false,
      position: match.index,
    };
  }

  return null;
};

const detectorType = "BRAINTREE_DETECTOR";

export const BraintreeDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
