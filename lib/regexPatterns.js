const regexPatterns = {
  "AWS Secret Access Key": /^[A-Za-z0-9]{43}$/,
  "AWS Access Key Id": /^[A-Z0-9]{20}$/,
  stripeSecretKey: /sk_live_[0-9a-zA-Z]{24}/,
  paypalClientId: /AY[0-9a-zA-Z]{13}/,
  // azureStorage: /[a-zA-Z0-9+\/=]{88}/,
  googleCloudApiKey: /AIza[0-9A-Za-z-_]{35}/,
  Paystack: /\bsk\_[a-z]{1,}\_[A-Za-z0-9]{40}\b/,
  MongoDB:
    /mongodb(?:\+srv)?:\/\/(?:[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?@)?[a-zA-Z0-9._-]+(?::\d+)?(?:\/[a-zA-Z0-9._-]+)?(?:\?[a-zA-Z0-9=&_]+)?/,
  "Facebook Access Token": /EAACEdEose0cBA[0-9A-Za-z]+/,
  "Sendgrid API Key": /SG\.[0-9A-Za-z-_]{22}\.[0-9A-Za-z-_]{43}/,
  // Add more regex patterns as needed
};

module.exports = regexPatterns;
