import { CrossRegex as Re2 } from '../../regex.polyfill';
import { GoogleAuth } from "google-auth-library";
import { Detector, ScanResult } from "../../types/detector";

const keywords: string[] = ["provider_x509"];
const keyPattern = new Re2(/\{[^{]+auth_provider_x509_cert_url[^}]+\}/, "gi");

const trimAngleBrackets = (s: string): string =>
  s?.replace(/^</, "")?.replace(/>$/, "");

const scan = async (
  verify: boolean | undefined,
  data: string
): Promise<ScanResult | null> => {
  const matches = data.matchAll(keyPattern);
  const result: ScanResult = { detectorType: "GCP", verified: false };

  for (const match of matches) {
    let key = match[0];

    key = key
      .replace(/,\\n/g, "\n")
      .replace(/\\"\\n/g, "\n")
      .replace(/\\"/g, '"');

    // Attempt to parse the JSON key
    let creds: any;
    try {
      creds = JSON.parse(key);
    } catch (error) {
      continue;
    }

    if (creds.client_email && creds.client_email.includes("<mailto:")) {
      creds.client_email = creds.client_email
        .split("<mailto:")[1]
        .split("|")[0];
    }
    creds.auth_provider_x509_cert_url = trimAngleBrackets(
      creds.auth_provider_x509_cert_url
    );
    creds.auth_uri = trimAngleBrackets(creds.auth_uri);
    creds.client_x509_cert_url = trimAngleBrackets(creds.client_x509_cert_url);
    creds.token_uri = trimAngleBrackets(creds.token_uri);

    if (
      creds.client_email ===
      "image-pulling@authenticated-image-pulling.iam.gserviceaccount.com"
    ) {
      continue;
    }

    result.rawValue = creds.client_email || JSON.stringify(creds, null, 2);
    result.position = match.index;
    result.extras = {
      Project: creds.project_id,
    };

    if (verify) {
      try {
        // Initialize GoogleAuth with the provided credentials
        const auth = new GoogleAuth({
          credentials: creds,
          scopes: "https://www.googleapis.com/auth/cloud-platform",
        });

        // Create an authenticated client
        const client = await auth.getClient();

        // Get an access token
        const accessToken = await client.getAccessToken();

        // Verify the token
        const tokenInfo = await auth.request({
          url: "https://www.googleapis.com/oauth2/v3/tokeninfo",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (tokenInfo.status === 200) result.verified = true;
      } catch (error) {
        console.log(error);
      }
    }

    return result;
  }

  return null;
};

const detectorType = "GCP_DETECTOR";

export const GCPDetector: Detector = {
  scan,
  keywords,
  detectorType,
};
