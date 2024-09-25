import axios from "axios";
import chalk from "chalk";
import Table from "cli-table3";
import { classicGithubScopes } from "./scopes";

const GITHUB_API_BASE_URL = "https://api.github.com";

interface TokenMetadata {
  type: string;
  expiration: Date;
  oauthScopes: string[];
  user: {
    login: string;
    email: string;
  };
}

interface Repo {
  name: string;
  owner: {
    login: string;
  };
  html_url: string;
  private: boolean;
}

const getTokenMetadata = async (
  apiToken: string,
  shouldExit = true
): Promise<TokenMetadata | null> => {
  try {
    const response = await axios.get(`${GITHUB_API_BASE_URL}/user`, {
      headers: {
        Authorization: `token ${apiToken}`,
      },
    });

    const token = response.data;
    const expiration = new Date(
      response.headers["github-authentication-token-expiration"] || 0
    );
    const oauthScopes = response.headers["x-oauth-scopes"]
      ? response.headers["x-oauth-scopes"].split(", ")
      : [];

    return {
      type: "Classic GitHub Personal Access Token",
      expiration,
      oauthScopes,
      user: token,
    };
  } catch (error: any) {
    if (shouldExit) {
      console.log(chalk.red(`Error fetching token metadata: ${error.message}`));
      process.exit(1);
    }
  }

  return null; // only returning this cos of TS compiler "Function lacks returning statement error"
};

const getAllReposForUser = async (apiToken: string): Promise<Repo[]> => {
  let repos: Repo[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get(`${GITHUB_API_BASE_URL}/user/repos`, {
        headers: {
          Authorization: `token ${apiToken}`,
        },
        params: {
          per_page: 100,
          page,
        },
      });

      repos = repos.concat(response.data);

      if (
        response.headers.link &&
        response.headers.link.includes('rel="next"')
      ) {
        page++;
      } else {
        break;
      }
    } catch (error: any) {
      console.log(chalk.red(`Error fetching repositories: ${error.message}`));
      process.exit(1);
    }
  }

  return repos;
};

const displayGitHubRepos = (repos: Repo[]) => {
  const table = new Table({
    head: ["Repository", "Owner", "URL", "Private"],
    colWidths: [30, 40, 60, 10],
    wordWrap: true,
  });

  repos.forEach((repo) => {
    table.push([
      repo.private ? chalk.green(repo.name) : repo.name,
      repo.private ? chalk.green(repo.owner.login) : repo.owner.login,
      repo.private ? chalk.green(repo.html_url) : repo.html_url,
      repo.private ? chalk.green("true") : "false",
    ]);
  });

  console.log(table.toString());
};

const displayTokenPermissions = (permissions: string[]) => {
  const table = new Table({
    head: ["Scope", "Description"],
    colWidths: [30, 70],
    wordWrap: true,
  });

  permissions.forEach((perm) => {
    table.push([chalk.yellow(perm), classicGithubScopes[perm]]);
  });

  console.log(table.toString());
};

const analyzeClassicToken = async (apiToken: string) => {
  const metadata = await getTokenMetadata(apiToken);
  const repos = await getAllReposForUser(apiToken);

  console.log(chalk.greenBright.bold("[i] Token Information:"));

  console.log(chalk.yellow(`Token User: ${metadata?.user.login}`));

  if (metadata?.expiration) {
    const expirationDate = new Date(metadata?.expiration);
    const now = new Date();
    const daysRemaining = Math.floor(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(
      chalk.yellow(
        `Token Expiration: ${expirationDate.toDateString()} (${daysRemaining} days remaining)`
      )
    );
  } else {
    console.log(chalk.red(`Token Expiration: does not expire`));
  }

  console.log(chalk.yellow(`Token Type: ${metadata?.type}`));
  console.log(chalk.greenBright.bold(`\n[i] Token Permissions:`));

  displayTokenPermissions(metadata?.oauthScopes as string[]);

  displayGitHubRepos(repos);
};

export { analyzeClassicToken, getTokenMetadata };
