const prefixRegex = (keywords) => {
  const middle = keywords.join("|");
  const pattern = `(?:${middle})(?:.|[\\n\\r]){0,40}?`;
  return pattern;
};

const whitelistPatterns = [
  /example/,
  /placeholder/,
  /dummy/,
  /test/,
  /sample/,
  /localhost/,
  /127\.0\.0\.1/,
  /password\s*=\s*['"]changeme['"]/i,
];

// todo: enable the use of this method later
const isWhitelisted = (input) => {
  return whitelistPatterns.some((pattern) => pattern.test(input));
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

// todo: update this to new regex format
const regexHandler = (userCustomRegexes) => {
  let parsedRegex = {};
  Object.keys(userCustomRegexes).map((company) => {
    parsedRegex[company] = parseRegexString(userCustomRegexes[company]);
  });
  const mergedRegexes = Object.assign({}, regexPatterns, parsedRegex);
  return mergedRegexes;
};

// Define regex patterns for different secrets, including prefix patterns
const regexPatterns = {
  // "AWS Secret Access Key": {
  //   regex: new RegExp(/^[A-Za-z0-9]{43}$/, "g"),
  //   prefixRegex: new RegExp(prefixRegex(["AWS", "Amazon", "IAM"]), "gi"),
  // },
  // "AWS Access Key Id": {
  //   regex: new RegExp(/^[A-Z0-9]{20}$/, "g"),
  //   prefixRegex: new RegExp(prefixRegex(["AWS", "Amazon", "IAM"]), "gi"),
  // },
  // stripeSecretKey: {
  //   regex: new RegExp(/sk_live_[0-9a-zA-Z]{24}/, "g"),
  //   prefixRegex: new RegExp(prefixRegex(["Stripe", "Payment"]), "gi"),
  // },
  // paypalClientId: {
  //   regex: new RegExp(/AY[0-9a-zA-Z]{13}/, "g"),
  //   prefixRegex: new RegExp(prefixRegex(["PayPal"]), "gi"),
  // },
  // googleCloudApiKey: {
  //   regex: new RegExp(/AIza[0-9A-Za-z-_]{35}/, "g"),
  //   prefixRegex: new RegExp(prefixRegex(["Google", "GCP", "Cloud"]), "gi"),
  // },
  // Paystack: {
  //   regex: new RegExp(/\bsk\_[a-z]{1,}\_[A-Za-z0-9]{40}\b/, "g"),
  // },
  // MongoDB: {
  //   regex: new RegExp(
  //     /mongodb(?:\+srv)?:\/\/(?:[a-zA-Z0-9._-]+(?::[a-zA-Z0-9._-]+)?@)?[a-zA-Z0-9._-]+(?::\d+)?(?:\/[a-zA-Z0-9._-]+)?(?:\?[a-zA-Z0-9=&_]+)?/,
  //     "g"
  //   ),
  //   prefixRegex: new RegExp(prefixRegex(["MongoDB", "Database"]), "gi"),
  // },
  // "Facebook Access Token": {
  //   regex: new RegExp(/EAACEdEose0cBA[0-9A-Za-z]+/, "g"),
  //   prefixRegex: new RegExp(prefixRegex(["Facebook", "Meta"]), "gi"),
  // },
  // "Sendgrid API Key": {
  //   regex: new RegExp(/\bSG\.[\w\-]{20,24}\.[\w\-]{39,50}\b/, "g"),
  // },
  // Redis: {
  //   regex: new RegExp(
  //     /\bredi[s]{1,2}:\/\/[\S]{3,50}:([\S]{3,50})@[-.%\w\/:]+\b/,
  //     "g"
  //   ),
  // },
  // "Adafruit Io": {
  //   regex: new RegExp(/\b(aio\_[a-zA-Z0-9]{28})\b/, "g"),
  //   //prefixRegex: new RegExp(prefixRegex(["Adafruit", "IO"]), "gi"),
  // },
  // Anthropic: {
  //   regex: new RegExp(/\b(sk-ant-api03-[\w\-]{93}AA)\b/, "g"),
  // },
  // Apify: {
  //   regex: new RegExp(/\b(apify\_api\_[a-zA-Z0-9]{36})\b/, "g"),
  // },
  // Mailgun: {
  //   regex: new RegExp(
  //     /\b([a-fA-F0-9]{32}-[a-fA-F0-9]{8}-[a-fA-F0-9]{8})\b/,
  //     "g"
  //   ),
  //   prefixRegex: new RegExp(prefixRegex(["mailgun"]), "gi"),
  //   keywords: ["mailgun"],
  // },
  // Mux: {
  //   regex: new RegExp(
  //     /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i
  //   ),
  //   prefixRegex: new RegExp(prefixRegex(["mux"]), "gi"),
  //   keywords: ["mux"],
  // },
  // Braintree: {
  //   regex: new RegExp(/\b([0-9a-f]{32})\b/),
  //   prefixRegex: new RegExp(prefixRegex(["braintree"]), "gi"),
  //   keywords: ["braintree"],
  // },
  // Agora: {
  //   regex: new RegExp(/\b([a-z0-9]{32})\b/, "g"),
  //   prefixRegex: new RegExp(prefixRegex(["agora"]), "gi"),
  //   keywords: ["agora"],
  // },
  // Add more regex patterns as needed
};

module.exports = { regexHandler, isWhitelisted, prefixRegex };
