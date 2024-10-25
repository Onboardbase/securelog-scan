import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";
import { httpClient } from "../../util";

const keywords: string[] = ["discord"];
const keyPattern: Re2 = new Re2(
  surroundWithGroups(keywords) +
    /\b([A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27})\b/,
  "gi"
);
const idPattern: Re2 = new Re2(
  `${surroundWithGroups(keywords)}\\b([0-9]{17})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);
  const idPatternMatches = data.matchAll(idPattern);

  const result: ScanResult = {
    detectorType: "Discord Bot Token",
    verified: false,
  };

  for (const match of keyPatternMatches) {
    if (match.length !== 2) continue;

    const resMatch: string = match[1].trim();

    for (const idMatch of idPatternMatches) {
      if (idMatch.length !== 2) continue;

      const botTokenUserId = idMatch[1].trim();

      result.rawValue = resMatch;
      result.position = match.index;
      result.extras = {
        "Bot Token UserId": botTokenUserId,
      };

      if (verify) {
        try {
          await httpClient.get(
            `https://discord.com/api/v8/users/${botTokenUserId}`,
            {
              headers: {
                Authorization: `Bot ${resMatch}`,
              },
            }
          );

          result.verified = true;
        } catch (error) {}
      }

      return result;
    }
  }

  return null;
};

const detectorType = "DISCORD_BOT_TOKEN_DETECTOR";

export const DiscordBotTokenDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
