const axios = require("axios");
const chalk = require("chalk");
const { analyzeClassicToken } = require("./classicTokens");

const GITHUB_API_BASE_URL = "https://api.github.com";

const analyzeGitHubPermissions = async (apiToken) => {
  try {
    const [userInfo, rateLimit] = await Promise.all([
      getUserInfo(apiToken),
      getRateLimit(apiToken),
    ]);

    displayUserInfo(userInfo);
    displayRateLimit(rateLimit);

    const tokenType = apiToken.startsWith("ghp_") ? "classic" : "finegrained";
    if (tokenType === "classic") await analyzeClassicToken(apiToken);
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
  }
};

const getUserInfo = async (apiToken) => {
  const url = `${GITHUB_API_BASE_URL}/user`;
  const response = await makeGitHubRequest(url, apiToken);
  return response.data;
};

const getRateLimit = async (apiToken) => {
  const url = `${GITHUB_API_BASE_URL}/rate_limit`;
  const response = await makeGitHubRequest(url, apiToken);
  return response.data;
};

const makeGitHubRequest = async (url, apiToken) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${apiToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return response;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || "An error occurred");
    }
    throw error;
  }
};

const displayUserInfo = (user) => {
  console.log(chalk.greenBright.bold("[!] GitHub User Info:"));
  console.log(chalk.green("Login:"), user.login);
  console.log(chalk.green("Name:"), user.name);
  console.log(chalk.green("Created At:"), user.created_at);
  console.log(chalk.green("Public Repos:"), user.public_repos);
  console.log(chalk.green("Followers:"), user.followers);
  console.log(chalk.green("Following:"), user.following);
};

const displayRateLimit = (rateLimit) => {
  console.log(chalk.greenBright.bold("\n[i] GitHub Rate Limit:"));
  console.log(chalk.green("Rate Limit:"), rateLimit.rate.limit);
  console.log(chalk.green("Remaining:"), rateLimit.rate.remaining);
  console.log(
    chalk.green("Reset At:"),
    new Date(rateLimit.rate.reset * 1000).toLocaleString(),
    "\n"
  );
};

const analyzeFineGrainedToken = async (apiToken, tokenId) => {
  console.log(chalk.cyanBright.bold("\n[+] Analyzing Fine-Grained Token:"));
  console.log(chalk.cyan("Fine-grained token not supported yet"), tokenId);
};

const githubAnalyzer = (githubPersonalAccessToken) => {
  if (!githubPersonalAccessToken) {
    console.error(
      chalk.red("[x] Error: Please provide a valid GitHub API token.")
    );
    process.exit(1);
  }
  analyzeGitHubPermissions(githubPersonalAccessToken);
};

module.exports = { githubAnalyzer };
