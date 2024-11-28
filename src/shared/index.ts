/**
 * All methods here are supposed to be used on the SDK
 * and other securelog libraries
 */

import { AhoCorasickCore } from "../ahocorasick";
import { ScanStringOptions } from "../types";
import { maskString } from "../util";

export const redactSensitiveData = async (options: ScanStringOptions) => {
  const core = new AhoCorasickCore();
  const detectors = core.findMatchingDetectors(options.rawValue as string);
  let modifiedValue = options.rawValue;

  const secrets = await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(false, options.rawValue as string);
      if (scanResponse) {
        modifiedValue = modifiedValue?.replaceAll(
          scanResponse.rawValue as string,
          maskString(scanResponse.rawValue as string, {
            maskValue: options.maskedValue,
            visibleChars: options.visibleChars,
          })
        );

        return scanResponse;
      }
    })
  );

  return { rawValue: modifiedValue, secrets };
};

export const scanStringAndReturnJson = async (options: ScanStringOptions) => {
  const core = new AhoCorasickCore();
  const detectors = core.findMatchingDetectors(options.rawValue as string);
  const response = await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(false, options.rawValue as string);
      if (scanResponse) {
        return scanResponse;
      }
    })
  );

  return response;
};
