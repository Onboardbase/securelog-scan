import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["https://discord.com/api/webhooks/"];
const keyPattern = new Re2(
  /(https:\/\/discord\.com\/api\/webhooks\/[0-9]{18}\/[0-9a-zA-Z-]{68})/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = {
    detectorType: "Discord Webhooks",
    verified: false,
  };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await axios.get(resMatch);
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "DISCORD_WEBHOOK_DETECTOR";

export const DiscordWebhookDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
