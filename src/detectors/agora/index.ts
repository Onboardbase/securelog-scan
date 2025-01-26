import { CrossRegex as Re2 } from '../../regex.polyfill';
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["agora"];
const regexGroup: string = surroundWithGroups(keywords);
const keyPattern: Re2 = new Re2(`${regexGroup}\\b([a-z0-9]{32})\\b`, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);

  for (const match of matches) {
    if (match.length !== 2) continue;
    const resMatch: string = match[1].trim();
    return {
      detectorType: "Agora",
      rawValue: resMatch,
      verified: false,
      position: match.index,
    };
  }

  return null;
};

const detectorType = "AGORA_DETECTOR";

export const AgoraDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
