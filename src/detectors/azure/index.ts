import Re2 from "re2";
import axios from "axios";
import { URLSearchParams } from "url";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["azure"];

const clientIDPat = new Re2(
  /(client_id|clientid).{0,20}([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
  "gi"
);
const tenantIDPat = new Re2(
  /(tenant_id|tenantid).{0,20}([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
  "gi"
);
const clientSecretPat = new Re2(
  /(clientsecret|client_secret).{0,20}([a-z0-9_.\-~]{40})/,
  "gi"
);

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const azureClientSecretMatches = data.matchAll(clientSecretPat);
  const azureTenantIdMatches = data.matchAll(tenantIDPat);
  const azureClientIdMatches = data.matchAll(clientIDPat);
  const result: ScanResult = { detectorType: "Azure", verified: false };

  for (const azureClientSecretMatch of azureClientSecretMatches) {
    if (azureClientSecretMatch.length !== 3) continue;
    const azureSecretAccessKey: string = azureClientSecretMatch[2].trim();

    result.rawValue = azureSecretAccessKey;
    result.position = azureClientSecretMatch.index;

    for (const tenantId of azureTenantIdMatches) {
      if (tenantId.length !== 3) continue;
      const azureTenantId: string = tenantId[2].trim();

      result.extras = {
        "Tenant ID": azureTenantId,
      };

      for (const clientId of azureClientIdMatches) {
        if (clientId.length !== 3) continue;
        const azureClientId: string = clientId[2].trim();

        result.extras = {
          ...result.extras,
          "Client Id": azureClientId,
        };

        if (verify) {
          const tokenEndpoint = `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`;
          const params = new URLSearchParams();
          params.append("grant_type", "client_credentials");
          params.append("client_id", azureClientId);
          params.append("client_secret", azureSecretAccessKey);
          params.append("scope", "https://graph.microsoft.com/.default");

          try {
            await axios.post(tokenEndpoint, params);
            result.verified = true;
          } catch (error) {}
        }
      }
    }

    return result;
  }

  return null;
};

const detectorType = "AZURE_DETECTOR";

export const AzureDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
