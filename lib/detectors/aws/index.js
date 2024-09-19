const Re2 = require("re2");
const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts");

const keywords = ["aws", "AKIA", "ABIA", "ACCA", "DO"];

const accessKeyIdPattern = new Re2(/\b((AKIA|ABIA|ACCA)[0-9A-Z]{16})\b/, "gi");
const secretAccessKeyPattern = new Re2(
  "[^A-Za-z0-9+/]{0,1}([A-Za-z0-9+/]{40})[^A-Za-z0-9+/]{0,1}",
  "gi"
);
const regionPattern = new Re2(/region\s*=\s*([^\r\n]+)/);

const scan = async (verify, data) => {
  const accessKeyMatches = data.matchAll(accessKeyIdPattern, -1);
  const secretKeyMatches = data.matchAll(secretAccessKeyPattern, -1);

  const result = { detectorType: "AWS", verified: false };

  for (const match of accessKeyMatches) {
    if (match.length !== 3) continue;
    const accessKeyId = match[1].trim();

    result.rawValue = accessKeyId;
    result.position = match.index;
    result.extras = {
      "Token type": "Access Key",
    };

    for (const secretMatch of secretKeyMatches) {
      if (secretMatch.length !== 2) continue;

      const secretKeyMatch = secretMatch[1].trim();
      result.extras["Secret Access Key"] = secretKeyMatch;

      if (verify) {
        const region = secretMatch.input.match(regionPattern); // extract the access key region
        try {
          const client = new STSClient({
            region: region[1].trim(),
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
            ...(data.Arn.includes("canarytokens") && { Is_Canary: true }),
          };
        } catch (error) {}
      }
    }

    return result;
  }
};

const detectorType = "AWS_DETECTOR";

module.exports = { scan, keywords, detectorType };
