import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";
import { surroundWithGroups } from "../../regexHandler";

const keywords: string[] = ["docusign"];
const keyPattern: Re2 = new Re2(
  `${surroundWithGroups([
    "integration",
    "id",
  ])}\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b`,
  "gi"
);
const idPattern = new Re2(
  `${surroundWithGroups([
    "secret",
  ])}\\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\b`,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);
  const idPatternMatches = data.matchAll(idPattern);

  const result: ScanResult = {
    detectorType: "Docusign",
    verified: false,
  };

  for (const idMatch of idPatternMatches) {
    if (idMatch.length !== 2) continue;

    for (const secretMatch of keyPatternMatches) {
      if (secretMatch.length !== 2) continue;

      const clientId: string = idMatch[1].trim();
      const secretId = secretMatch[1].trim();

      result.rawValue = clientId;
      result.position = idMatch.index;
      result.extras = {
        "Client Secret": secretId,
        "Secret key Position": `Line ${secretMatch.index}`,
      };

      if (verify) {
        try {
          const base64String = Buffer.from(`${clientId}:${secretId}`).toString(
            "base64"
          );
          await axios.post(
            "https://account.docusign.com/oauth/token",
            {
              grant_type: "client_credentials",
              scope: "signature",
            },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${base64String}`,
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

const detectorType = "DOCUSIGN_DETECTOR";

export const DocusignDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
