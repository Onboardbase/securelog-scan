import { CrossRegex as Re2 } from '../../regex.polyfill';
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["AKIA", "ABIA", "ACCA"];
const accessKeyIdPattern = new Re2(/\b((AKIA|ABIA|ACCA)[0-9A-Z]{16})\b/, "gi");
const secretAccessKeyPattern: Re2 = new Re2(
  "[^A-Za-z0-9+/]{0,1}([A-Za-z0-9+/]{40})[^A-Za-z0-9+/]{0,1}",
  "gi"
);
const regionPattern = new Re2(/region\s*=\s*([^\r\n]+)/, "gi");
const falsePositive: Re2 = new Re2("[a-f0-9]{40}");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const accessKeyMatches = data.matchAll(accessKeyIdPattern);
  const secretKeyMatches = data.matchAll(secretAccessKeyPattern);

  const result: ScanResult = { detectorType: "AWS", verified: false };

  for (const match of accessKeyMatches) {
    if (match.length !== 3) continue;
    const accessKeyId: string = match[1].trim();

    result.rawValue = accessKeyId;
    result.position = match.index;
    result.extras = {
      "Token type": "Access Key",
    };

    for (const secretMatch of secretKeyMatches) {
      if (secretMatch.length !== 2) continue;

      const secretKeyMatch: string = secretMatch[1].trim();
      result.extras["Secret Access Key"] = secretKeyMatch;

      if (verify) {
        const regionMatch = Array.from(data.matchAll(regionPattern))[0]?.[1]; // extract the access key region
        if (regionMatch) {
          try {
            const client = new STSClient({
              region: regionMatch,
              credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretKeyMatch,
              },
            });

            const command = new GetCallerIdentityCommand({});
            const data = await client.send(command);

            result.verified = true;
            result.extras = {
              ...result.extras,
              Account: data.Account,
              Arn: data.Arn,
              ...(data.Arn?.includes("canarytokens") && { Is_Canary: true }),
            };
          } catch (error) {}
        }
      }

      if (!result.verified && falsePositive.match(secretKeyMatch)) continue;
    }

    return result;
  }

  return null;
};

const detectorType = "AWS_DETECTOR";

export const AWSDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
