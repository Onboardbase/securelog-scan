const Re2 = require("re2");
const { GoogleAuth } = require("google-auth-library");

const keywords = ["provider_x509"];
const keyPattern = new Re2(/\{[^{]+auth_provider_x509_cert_url[^}]+\}/, "g");

const trimAngleBrackets = (s) => s.replace(/^</, "").replace(/>$/, "");

const scan = async (verify, data) => {
  const matches = data.matchAll(keyPattern, -1);
  const result = { detectorType: "GCP", verified: false };

  for (const match of matches) {
    let key = match[0];

    key = key
      .replace(/,\\n/g, "\n")
      .replace(/\\"\\n/g, "\n")
      .replace(/\\"/g, '"');

    // Attempt to parse the JSON key
    let creds;
    try {
      creds = JSON.parse(key);
    } catch (error) {
      continue;
    }

    if (creds.client_email.includes("<mailto:")) {
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

    result.rawValue = creds.client_email;
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
      } catch (error) {}
    }

    return result;
  }
};

const detectorType = "GCP_DETECTOR";

module.exports = { scan, keywords, detectorType };
