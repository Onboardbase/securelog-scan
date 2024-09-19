const { githubAnalyzer } = require("./github");
const { gitlabAnalyzer } = require("./gitlab");
const { mongodbAnalyzer } = require("./mongodb");
const { mysqlAnalyzer } = require("./mysql");
const { postgresqlAnalyzer } = require("./postgresql");
const { slackAnalyzer } = require("./slack");

const analyzers = [
  { github: githubAnalyzer },
  { gitlab: gitlabAnalyzer },
  { mongodb: mongodbAnalyzer },
  { mysql: mysqlAnalyzer },
  { postgresql: postgresqlAnalyzer },
  { slack: slackAnalyzer },
];

module.exports = { analyzers };
