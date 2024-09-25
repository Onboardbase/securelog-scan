import axios from "axios";
import chalk from "chalk";
import Table from "cli-table3";
import { slackScopes } from "./scopes";

const SLACK_API_BASE_URL = "https://slack.com/api";

interface UserData {
  ok: boolean;
  user: string;
  team: string;
  team_id: string;
  user_id: string;
  is_enterprise: boolean;
}

const analyzeSlackPermissions = async (apiToken: string) => {
  try {
    const [userData, scopes] = await Promise.all([
      getSlackUserData(apiToken),
      getSlackScopes(apiToken),
    ]);

    displayUserData(userData);
    displayScopes(scopes);
  } catch (error: any) {
    console.error(chalk.red("[x] Error: "), error.message);
  }
};

const getSlackUserData = async (apiToken: string): Promise<UserData> => {
  const url = `${SLACK_API_BASE_URL}/auth.test`;
  const response = await makeSlackRequest(url, apiToken);
  if (!response.data.ok) {
    throw new Error("Invalid Slack token");
  }
  return response.data;
};

const getSlackScopes = async (apiToken: string): Promise<string[]> => {
  const url = `${SLACK_API_BASE_URL}/auth.test`;
  const response = await makeSlackRequest(url, apiToken);
  return response.headers["x-oauth-scopes"].split(",");
};

const makeSlackRequest = async (url: string, apiToken: string) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });
    return response;
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || "An error occurred");
    }
    throw error;
  }
};

const displayUserData = (userData: UserData) => {
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

const displayScopes = (scopes: string[]) => {
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

const slackAnalyzer = (slackApiToken: string) => {
  if (!slackApiToken) {
    console.error(
      chalk.red("[x] Error: Please provide a valid Slack API token.")
    );
    process.exit(1);
  }

  analyzeSlackPermissions(slackApiToken);
};

export { slackAnalyzer };
