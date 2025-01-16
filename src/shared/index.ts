/**
 * All methods here are supposed to be used on the SDK
 * and other securelog libraries
 */

import { AhoCorasickCore } from "../ahocorasick";
import { buildCustomDetectors } from "../regexHandler";
import { DataFormat, ScanStringOptions } from "../types";
import { DetectorConfig } from "../types/detector";
import { maskString } from "../util";
import yaml from 'yaml';

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

export class DataFormatHandlers {
  private formats: Map<string, DataFormat> = new Map();

  constructor() {
    this.registerDefaultFormats();
  }

  private registerDefaultFormats() {
    // JSON handler
    this.formats.set('json', {
      detect: (data: string) => {
        try {
          JSON.parse(data);
          return true;
        } catch {
          return false;
        }
      },
      parse: JSON.parse,
      stringify: (data: any) => JSON.stringify(data, null, 2)
    });

    // YAML handler
    this.formats.set('yaml', {
      detect: (data: string) => {
        try {
          yaml.parse(data);
          return true;
        } catch {
          return false;
        }
      },
      parse: yaml.parse,
      stringify: yaml.stringify
    });

    // XML handler
    this.formats.set('xml', {
      detect: (data: string) => /^\s*<[^>]+>/.test(data),
      parse: (data: string) => {
        const parser = new DOMParser();
        return parser.parseFromString(data, 'text/xml');
      },
      stringify: (data: any) => {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(data);
      }
    });
  }

  public detectFormat(data: string): string {
    for (const [format, handler] of this.formats.entries()) {
      if (handler.detect(data)) {
        return format;
      }
    }
    return 'string';
  }

  public getHandler(format: string): DataFormat | undefined {
    return this.formats.get(format);
  }

  public registerFormat(name: string, handler: DataFormat) {
    this.formats.set(name, handler);
  }
}
