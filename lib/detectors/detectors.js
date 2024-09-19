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
const geminiDetector = require("./gemini");
const mailjetSmsDetector = require("./mailjet/sms");
const mailjetBasicAuthDetector = require("./mailjet/basicauth");
const mixpanelDetector = require("./mixpanel");
const mysqlDetector = require("./mysql");
const oktaDetector = require("./okta");
const postmanDetector = require("./postman");
const redisDetector = require("./redis");
const sendgridDetector = require("./sendgrid");
const slackDetector = require("./slack");
const openAiDetector = require("./openai");
const postgresqlDetector = require("./postgres");

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
  geminiDetector,
  mailjetSmsDetector,
  mailjetBasicAuthDetector,
  mixpanelDetector,
  mysqlDetector,
  oktaDetector,
  postmanDetector,
  redisDetector,
  sendgridDetector,
  slackDetector,
  openAiDetector,
  postgresqlDetector,
];

module.exports = { detectors };
