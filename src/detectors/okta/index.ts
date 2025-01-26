import { CrossRegex as Re2 } from '../../regex.polyfill';
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["okta"];
const domainPattern = new Re2(
  /\b[a-z0-9-]{1,40}\.okta(?:preview|-emea)?\.com\b/,
  "gi"
);
const tokenPattern = new Re2(/\b00[a-zA-Z0-9_-]{40}\b/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const domainMatches = data.matchAll(domainPattern);
  const tokenMatches = data.matchAll(tokenPattern);

  let result: ScanResult = { detectorType: "Okta", verified: false };

  for (const tokenMatch of tokenMatches) {
    const token = tokenMatch[0].trim();

    for (const domainMatch of domainMatches) {
      const domain = domainMatch[0];

      result.rawValue = token;
      result.position = tokenMatch.index;

      if (verify) {
        const url = `https://${domain}/api/v1/users/me`;
        try {
          const response = await httpClient.get(url, {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `SSWS ${token}`,
            },
          });

          if (response.data.includes("activated")) {
            result.verified = true;
          }
        } catch (error) {}
      }

      return result;
    }
  }
  return null;
};

const detectorType = "OKTA_DETECTOR";

export const OktaDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
