/**
 * All methods here are supposed to be used on the SDK
 * and other securelog libraries
 */

import axios from "axios";
import { AhoCorasickCore } from "../ahocorasick";
import { decay } from "../decay";
import { buildCustomDetectors, validateDetectorConfig } from "../regexHandler";
import { DataFormat, ScanStringOptions } from "../types";
import { DetectorConfig } from "../types/detector";
import { maskString } from "../util";
import yaml from "yaml";

const API_BASE_URL = "https://api.securelog.com";

const validateRequestApiKey = async (apikey: string) => {
  try {
    await axios.get(`${API_BASE_URL}/auth`, {
      headers: {
        "x-api-key": apikey,
      },
    });
  } catch (error) {
    throw new Error("Invalid API Key");
  }
};

const handleCustomDetectors = (customDetectors?: DetectorConfig[]) => {
  const parsedDetectors = customDetectors?.length
    ? buildCustomDetectors(
        customDetectors as unknown as Record<string, DetectorConfig>
      )
    : [];
  return parsedDetectors;
};

/**
 * This particular method is exposed and free to use without
 * API key but secret details wont be logged
 */
export const maskAndRedactSensitiveData = async (
  options: ScanStringOptions
) => {
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
        /***
         * this replaces the secrets in the string to a masked one should incase there
         * are multiple secrets in the string, it replaces them one by one based on how
         * many secrets was detected
         */
        modifiedValue = modifiedValue?.replaceAll(
          scanResponse.rawValue as string,
          maskString(scanResponse.rawValue as string, {
            maskValue: options.maskedValue,
            visibleChars: options.visibleChars,
          })
        );

        /**
         * this masks the rawValue thats inside the scanResult based on the user option
         */
        if (options.maskSecretRawValue) {
          scanResponse.rawValue = maskString(scanResponse.rawValue as string, {
            maskValue: options.maskedValue,
            visibleChars: options.visibleChars,
          });
        }

        return scanResponse;
      }
    })
  );

  const maskedValues = modifiedValue;
  const decayer = decay();
  const redactedValues = decayer.redact(maskedValues);

  return { rawValue: redactedValues, maskedValues, redactedValues, secrets };
};

export const redactSensitiveData = async (
  apiKey: string,
  options: ScanStringOptions
) => {
  if (!apiKey) throw new Error("Please attach an API key");
  await validateRequestApiKey(apiKey);

  const { rawValue, maskedValues, redactedValues, secrets } =
    await maskAndRedactSensitiveData(options);

  try {
    await axios.post(
      `${API_BASE_URL}/log-redacted-secret`,
      {
        rawValue: redactedValues,
        secrets,
      },
      {
        headers: {
          "x-api-key": apiKey,
        },
      }
    );
  } catch (error) {
    console.log("Error occured logging secrets");
  }

  return { rawValue, maskedValues, redactedValues, secrets };
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

export class DataFormatHandlers {
  private formats: Map<string, DataFormat> = new Map();

  constructor() {
    this.registerDefaultFormats();
  }

  private registerDefaultFormats() {
    // JSON handler
    this.formats.set("json", {
      detect: (data: string) => {
        try {
          JSON.parse(data);
          return true;
        } catch {
          return false;
        }
      },
      parse: JSON.parse,
      stringify: (data: any) => JSON.stringify(data, null, 2),
    });

    // YAML handler
    this.formats.set("yaml", {
      detect: (data: string) => {
        try {
          yaml.parse(data);
          return true;
        } catch {
          return false;
        }
      },
      parse: yaml.parse,
      stringify: yaml.stringify,
    });

    // XML handler
    this.formats.set("xml", {
      detect: (data: string) => /^\s*<[^>]+>/.test(data),
      parse: (data: string) => {
        const parser = new DOMParser();
        return parser.parseFromString(data, "text/xml");
      },
      stringify: (data: any) => {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(data);
      },
    });
  }

  public detectFormat(data: string): string {
    for (const [format, handler] of this.formats.entries()) {
      if (handler.detect(data)) {
        return format;
      }
    }
    return "string";
  }

  public getHandler(format: string): DataFormat | undefined {
    return this.formats.get(format);
  }

  public registerFormat(name: string, handler: DataFormat) {
    this.formats.set(name, handler);
  }
}

export const validateCustomDetectorConfig = validateDetectorConfig;
