import Re2 from "re2";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = [
  "card",
  "credit",
  "visa",
  "mastercard",
  "amex",
  "discover",
  "cc",
  "creditcard",
  "payment",
  "verve",
];

const cardPattern = new Re2(
  /\b(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:506[0-9]{3}|5067[0-9]{2}|6500[0-9]{2})[0-9]{10})\b/,
  "gi"
);

const getCardType = (cardNumber: string): string => {
  const num = cardNumber.replace(/[\s-]/g, "");

  if (/^(506[0-9]{3}|5067[0-9]{2}|6500[0-9]{2})/.test(num)) {
    return "Verve";
  }
  if (/^4/.test(num)) {
    return "Visa";
  }
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6][0-9]{2}|27[01]|2720)/.test(num)) {
    return "Mastercard";
  }
  if (/^3[47]/.test(num)) {
    return "American Express";
  }
  if (/^(6011|65|64[4-9])/.test(num)) {
    return "Discover";
  }
  if (/^(2131|1800|35)/.test(num)) {
    return "JCB";
  }
  if (/^(30[0-5]|36|38)/.test(num)) {
    return "Diners Club";
  }

  return "Unknown";
};

const isValidLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, "");
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(cardPattern);
  const result: ScanResult = { detectorType: "Credit Card", verified: false };

  for (const match of matches) {
    if (!match) continue;
    const resMatch = match[0].trim();

    if (!isValidLuhn(resMatch)) continue;

    result.rawValue = resMatch;
    result.position = match.index;
    result.extras = { type: getCardType(resMatch) };

    return result;
  }

  return null;
};

const detectorType = "CREDIT_CARD_DETECTOR";

export const CreditCardDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
