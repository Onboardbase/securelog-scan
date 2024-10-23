import Re2 from "re2";
import { getTokenMetadata } from "../../../analyzers/github/classicTokens";
import { formatExpiryDate } from "../../../util";
import { Detector, ScanResult } from "../../../types/detector";

const keywords: string[] = [
  "ghp_",
  "gho_",
  "ghu_",
  "ghs_",
  "ghr_",
  "github_pat_",
];
const keyPattern: Re2 = new Re2(
  `\\b((?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = {
    detectorType: "Github Classic Token",
    verified: false,
  };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;
    result.extras = {
      version: 2,
    };

    if (verify) {
      try {
        const metadata = await getTokenMetadata(resMatch, false);
        result.verified = true;
        result.extras = {
          ...result.extras,
          email: metadata?.user.email,
          scopes: metadata?.oauthScopes.toString(),
          expiry: formatExpiryDate(metadata?.expiration as unknown as number),
          username: metadata?.user.login,
        };
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "GITHUB_CLASSIC_TOKEN_DETECTOR";

export const GitHubClassicTokenDetectorV2: Detector = {
  scan,
  keywords,
  detectorType,
};
