const braintreeDetector = require("./braintree");
const paystackDetector = require("./paystack");
const muxDetector = require("./mux");
const mongoDbDetector = require("./mongodb");
const mailgunDetector = require("./mailgun");
const agoraDetector = require("./agora");
const githubClassicTokenDetector = require("./github/classicV1"); // old github classic tokens
const githubClassicTokenDetectorV2 = require("./github/classicV2"); // new github classic tokens
const gitlabOldTokenDetector = require("./gitlab/gitlabV1"); // old gitlab tokens
const gitlabNewTokenDetector = require("./gitlab/gitlabV2"); // new gitlab tokens
const algoliaDetector = require("./algolia");
const anthropicDetector = require("./anthropic");
const apifyDetector = require("./apify");

const detectors = [
  braintreeDetector,
  paystackDetector,
  muxDetector,
  mongoDbDetector,
  mailgunDetector,
  agoraDetector,
  githubClassicTokenDetector,
  githubClassicTokenDetectorV2,
  gitlabOldTokenDetector,
  gitlabNewTokenDetector,
  algoliaDetector,
  anthropicDetector,
  apifyDetector,
];

module.exports = { detectors };
