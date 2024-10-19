import Re2 from "re2";
import axios from "axios";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["k_live", "k_test"];

/**
 * we only support scanning stripe restricted keys at the moment to reduce false
 * positives that comes with scanning stripe keys that begins with Sk_
 * as this same pattern matches for paystack secret keys
 */
const keyPattern = new Re2(`[r]k_(live|test)_[a-zA-Z0-9]{20,247}`, "gi");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  let result: ScanResult = { detectorType: "Stripe", verified: false };

  for (const match of matches) {
    if (!match) continue;

    const resMatch = match[0].trim();
    result.rawValue = resMatch;
    result.position = match.index;

    if (verify) {
      try {
        await axios.get("https://api.stripe.com/v1/charges", {
          headers: {
            Authorization: `Bearer ${resMatch}`,
          },
        });
        result.verified = true;
      } catch (error) {}
    }

    return result;
  }

  return null;
};

const detectorType = "STRIPE_DETECTOR";

export const StripeDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
