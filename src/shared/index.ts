/**
 * All methods here are supposed to be used on the SDK
 * and other securelog libraries
 */

import { AhoCorasickCore } from "../ahocorasick";
import { buildCustomDetectors } from "../regexHandler";
import { ScanStringOptions } from "../types";
import { DetectorConfig } from "../types/detector";
import { maskString } from "../util";

const handleCustomDetectors = (customDetectors?: DetectorConfig[]) => {
  const parsedDetectors = customDetectors?.length
    ? buildCustomDetectors(
        customDetectors as unknown as Record<string, DetectorConfig>
      )
    : [];
  return parsedDetectors;
};

export const redactSensitiveData = async (options: ScanStringOptions) => {
  const core = new AhoCorasickCore(
    handleCustomDetectors(options.customDetectors)
  );
  const detectors = core.findMatchingDetectors(options.rawValue as string);
  let modifiedValue = options.rawValue;

  const secrets = await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(false, options.rawValue as string);
      if (scanResponse && scanResponse.rawValue) {
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
  const core = new AhoCorasickCore(
    handleCustomDetectors(options.customDetectors)
  );
  const detectors = core.findMatchingDetectors(options.rawValue as string);
  const response = await Promise.all(
    detectors.map(async (detector) => {
      const { scan } = detector;
      const scanResponse = await scan(false, options.rawValue as string);
      if (scanResponse && scanResponse.rawValue) {
        return scanResponse;
      }
    })
  );

  return response;
};
