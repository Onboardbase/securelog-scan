import { CrossRegex as Re2 } from '../../regex.polyfill';
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["shppa_", "shpat_"];
const keyPattern: Re2 = new Re2("\\b(shppa_|shpat_)([0-9A-Fa-f]{32})\\b", "gi");
const domainPattern = new Re2(/^[a-zA-Z0-9-]+\.myshopify\.com$/, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const keyPatternMatches = data.matchAll(keyPattern);
  const domainPatternMatches = data.matchAll(domainPattern);
  let result: ScanResult = { detectorType: "Shopify", verified: false };

  for (const match of keyPatternMatches) {
    const shopifyKey = match?.[0]?.trim();

    result.rawValue = shopifyKey;
    result.position = match.index;

    for (const domainMatch of domainPatternMatches) {
      const domainMatchValue = domainMatch?.[0]?.trim();

      if (verify) {
        try {
          await httpClient.get(
            `https://${domainMatchValue}/admin/oauth/access_scopes.json`,
            {
              headers: {
                "X-Shopify-Access-Token": shopifyKey,
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

const detectorType = "SHOPIFY_DETECTOR";

export const ShopifyDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
