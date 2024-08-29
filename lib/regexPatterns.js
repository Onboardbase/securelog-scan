const regexPatterns = {
  "AWS Secret Access Key": /^[A-Za-z0-9]{43}$/,
  "AWS Access Key Id": /^[A-Z0-9]{20}$/,
  stripeSecretKey: /sk_live_[0-9a-zA-Z]{24}/,
  paypalClientId: /AY[0-9a-zA-Z]{13}/,
  googleCloudApiKey: /AIza[0-9A-Za-z-_]{35}/,
  Paystack: /\bsk\_[a-z]{1,}\_[A-Za-z0-9]{40}\b/,
  MongoDB:
    /mongodb(?:\+srv)?:\/\/(?:[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?@)?[a-zA-Z0-9._-]+(?::\d+)?(?:\/[a-zA-Z0-9._-]+)?(?:\?[a-zA-Z0-9=&_]+)?/,
  "Facebook Access Token": /EAACEdEose0cBA[0-9A-Za-z]+/,
  "Sendgrid API Key": /SG\.[0-9A-Za-z-_]{22}\.[0-9A-Za-z-_]{43}/,
  // Add more regex patterns as needed
};

const parseRegexString = (regexString) => {
  // Check if the regex string starts and ends with a slash, and may include flags
  const regexWithFlags = /^\/(.+)\/([a-z]*)$/;
  const match = regexString.match(regexWithFlags);
  let pattern, flags;
  if (match) {
    // Extract the pattern and flags
    pattern = match[1];
    flags = match[2];
  } else {
    // If no surrounding slashes, assume it's just the pattern
    pattern = regexString;
    flags = "";
  }
  pattern = pattern.replace(/\\\\/g, "\\").replace(/\\\//g, "/");
  return new RegExp(pattern, flags);
};

const regexHandler = (userCustomRegexes) => {
  let parsedRegex = {};
  Object.keys(userCustomRegexes).map((company) => {
    parsedRegex[company] = parseRegexString(userCustomRegexes[company]);
  });
  const mergedRegexes = Object.assign({}, regexPatterns, parsedRegex);
  return mergedRegexes;
};

module.exports = { regexHandler };
