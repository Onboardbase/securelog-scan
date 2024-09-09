const braintreeDetector = require("./braintree");
const paystackDetector = require("./paystack");
const muxDetector = require("./mux");
const mongoDbDetector = require("./mongodb");
const mailgunDetector = require("./mailgun");

const detectors = [
  braintreeDetector,
  paystackDetector,
  muxDetector,
  mongoDbDetector,
  mailgunDetector,
];

module.exports = { detectors };
