import Re2 from "re2";
import { getTokenMetadata } from "../../../analyzers/github/classicTokens";
import { formatExpiryDate, isFalsePositive } from "../../../util";
import { Detector, ScanResult } from "../../../types/detector";

const keywords: string[] = ["github", "gh", "pat", "token"];
const keyPattern: Re2 = new Re2(
  `\\b(?:github|gh|pat|token)[^\\.].{0,40}[ =:'"]+([a-f0-9]{40})\\b`,
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
    if (match.length !== 2) continue;
    if (
      isFalsePositive(match.input, ["commit", "github commit"]).isFalsePositive
    )
      continue;

    const resMatch = match[1].trim();
    result.rawValue = resMatch;
    result.position = match.index;
    result.extras = { version: 1 };

    if (verify) {
      try {
        const metadata = await getTokenMetadata(resMatch, false);
        result.extras = {
          ...result.extras,
          email: metadata?.user?.email,
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

const detectorType = "GITHUB_CLASSIC_TOKEN_V1_DETECTOR";

export const GitHubClassicTokenDetectorV1: Detector = {
  scan,
  keywords,
  detectorType,
};
