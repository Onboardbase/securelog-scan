import { CrossRegex as Re2 } from '../../regex.polyfill';
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["telegram", "tgram"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups([
    "telegram",
    "tgram://",
  ])}\\b([0-9]{8,10}:[a-zA-Z0-9_-]{35})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);

  const result: ScanResult = {
    detectorType: "Telegram Bot Token",
    verified: false,
  };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        const { data } = await httpClient.get(
          `https://api.telegram.org/bot${resMatch}/getMe`
        );

        result.verified = true;
        result.extras = {
          username: data.result.username,
        };
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "TELEGRAM_BOT_TOKEN_DETECTOR";

export const TelegramBotTokenDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
