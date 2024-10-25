import Re2 from "re2";
import { surroundWithGroups } from "../../regexHandler";
import { Detector, ScanResult } from "../../types/detector";
import { httpClient } from "../../util";

const keywords: string[] = ["datadog"];
const regexGroup: string = surroundWithGroups(["datadog", "dd"]);
const appPattern: Re2 = new Re2(`${regexGroup}\\b([a-zA-Z-0-9]{40})\\b`, "gi");
const apiPattern: Re2 = new Re2(`${regexGroup}\\b([a-zA-Z-0-9]{32})\\b`, "gi");

const DATADOG_BASEURL = "https://api.datadoghq.com";

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const appMatches = data.matchAll(appPattern);
  const apiMatches = data.matchAll(apiPattern);
  let result: ScanResult = { detectorType: "Datadog", verified: false };

  for (const match of apiMatches) {
    if (match.length !== 2) continue;

    const apiMatch = match[1].trim();
    result.rawValue = apiMatch;
    result.position = match.index;

    for (const secretMatch of appMatches) {
      if (secretMatch.length !== 2) continue;

      const appMatch = secretMatch[1].trim();

      if (verify) {
        try {
          await httpClient.get(`${DATADOG_BASEURL}/api/v2/users`, {
            headers: {
              "DD-API-KEY": apiMatch,
              "DD-APPLICATION-KEY": appMatch,
            },
          });

          result.verified = true;
          result.extras = {
            Type: "Application+APIKey",
          };
        } catch (error) {}
      }
      return result;
    }

    if (verify && !result.verified) {
      try {
        await httpClient.get(`${DATADOG_BASEURL}/api/v1/validate`, {
          headers: {
            "DD-API-KEY": apiMatch,
          },
        });

        result.verified = true;
        result.extras = {
          Type: "APIKeyOnly",
        };
      } catch (error) {}
    }
  }

  return null;
};

const detectorType = "DATADOG_TOKEN_DETECTOR";

export const DatadogTokenDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
