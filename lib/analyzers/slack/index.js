const axios = require("axios");
const chalk = require("chalk");
const Table = require("cli-table3");
const figlet = require("figlet");
const { slackScopes } = require("./scopes");

const SLACK_API_BASE_URL = "https://slack.com/api";
const analyzeSlackPermissions = async (apiToken) => {
  try {
    const [userData, scopes] = await Promise.all([
      getSlackUserData(apiToken),
      getSlackScopes(apiToken),
    ]);

    displayUserData(userData);
    displayScopes(scopes);
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
  }
};

const getSlackUserData = async (apiToken) => {
  const url = `${SLACK_API_BASE_URL}/auth.test`;
  const response = await makeSlackRequest(url, apiToken);
  if (!response.data.ok) {
    throw new Error("Invalid Slack token");
  }
  return response.data;
};

const getSlackScopes = async (apiToken) => {
  const url = `${SLACK_API_BASE_URL}/auth.test`;
  const response = await makeSlackRequest(url, apiToken);
  return response.headers["x-oauth-scopes"].split(",");
};

const makeSlackRequest = async (url, apiToken) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
    return response;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || "An error occurred");
    }
    throw error;
  }
};

const displayUserData = (userData) => {
  console.log(chalk.greenBright.bold("[!] Valid Slack API Key:"));
  console.log(chalk.green("User:"), userData.user);
  console.log(chalk.green("Team:"), userData.team);
  console.log(chalk.green("Team ID:"), userData.team_id);
  console.log(chalk.green("User ID:"), userData.user_id);
  if (userData.is_enterprise) {
    console.log(chalk.green("[!] Slack is Enterprise\n"));
  } else {
    console.log(chalk.yellow("[-] Slack is not Enterprise\n"));
  }
};

const displayScopes = (scopes) => {
  console.log(chalk.greenBright.bold("[i] Slack API Token Scopes:"));
  const table = new Table({
    head: ["Scope", "Description"],
    colWidths: [30, 70],
    wordWrap: true,
  });

  scopes.forEach((scope) => {
    const description =
      slackScopes[scope] ||
      "Visit https://api.slack.com/scopes for description of scope.";
    table.push([chalk.green(scope), description]);
  });

  console.log(table.toString());
};

const main = () => {
  figlet.text("Slack Analyzer", {}, (err, data) => {
    if (!err) console.log(chalk.cyan(data));

    const slackApiToken = "";
    if (!slackApiToken) {
      console.error(
        chalk.red("[x] Error: Please provide a valid Slack API token.")
      );
      process.exit(1);
    }

    analyzeSlackPermissions(slackApiToken);
  });
};

main();
