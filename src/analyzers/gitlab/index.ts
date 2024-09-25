import axios from "axios";
import chalk from "chalk";
import Table from "cli-table3";
import { gitlabScopes } from "./scopes";

const GITLAB_API_BASE_URL = "https://gitlab.com/api/v4";

interface AccessTokenInfo {
  name: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  revoked: boolean;
  scopes: string[];
}

interface Metadata {
  version: string;
  enterprise: boolean;
}

interface Project {
  name_with_namespace: string;
  permissions: {
    project_access: {
      access_level: number;
    };
  };
}

const analyzeGitLabPermissions = async (apiToken: string) => {
  try {
    const [accessTokenInfo, metadata, accessibleProjects] = await Promise.all([
      getPersonalAccessToken(apiToken),
      getMetadata(apiToken),
      getAccessibleProjects(apiToken),
    ]);

    displayAccessTokenInfo(accessTokenInfo);
    displayMetadata(metadata);
    displayProjects(accessibleProjects);
    displayTokenPermissions(accessTokenInfo.scopes);
  } catch (error: any) {
    console.error(chalk.red("[x] Error: "), error.message);
  }
};

const getPersonalAccessToken = async (
  apiToken: string
): Promise<AccessTokenInfo> => {
  const url = `${GITLAB_API_BASE_URL}/personal_access_tokens/self`;
  const response = await makeGitLabRequest(url, apiToken);
  return response.data;
};

const getMetadata = async (apiToken: string): Promise<Metadata> => {
  const url = `${GITLAB_API_BASE_URL}/metadata`;
  const response = await makeGitLabRequest(url, apiToken);
  return response.data;
};

const getAccessibleProjects = async (apiToken: string): Promise<Project[]> => {
  const url = `${GITLAB_API_BASE_URL}/projects?min_access_level=10`;
  const response = await makeGitLabRequest(url, apiToken);
  return response.data;
};

const makeGitLabRequest = async (url: string, apiToken: string) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "Private-Token": apiToken,
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

const displayAccessTokenInfo = (token: AccessTokenInfo) => {
  console.log(chalk.greenBright.bold("[!] Valid GitLab Access Token:"));
  console.log(chalk.green("Token Name:"), token.name);
  console.log(chalk.green("Created At:"), token.created_at);
  console.log(chalk.green("Last Used At:"), token.last_used_at);
  console.log(
    chalk.green("Expires At:"),
    token.expires_at,
    getRemainingTimeToExpiration(token.expires_at)
  );
  if (token.revoked) {
    console.log(chalk.red("Token Revoked:"), token.revoked);
  }
};

const displayMetadata = (metadata: Metadata) => {
  console.log(chalk.greenBright.bold("\n[i] GitLab Instance Metadata:"));
  console.log(chalk.green("Version:"), metadata.version);
  console.log(chalk.green("Enterprise:"), metadata.enterprise, "\n");
};

const displayProjects = (projects: Project[]) => {
  console.log(chalk.greenBright.bold("[i] Accessible Projects:"));
  const table = new Table({
    head: ["Project", "Access Level"],
    colWidths: [70, 20],
    wordWrap: true,
  });

  projects.forEach((project) => {
    const accessLevel = getAccessLevelLabel(
      project.permissions.project_access.access_level
    );

    table.push([chalk.green(project.name_with_namespace), accessLevel]);
  });

  console.log(table.toString());
};

const getAccessLevelLabel = (level: number) => {
  switch (level) {
    case 0:
      return chalk.red("No access");
    case 5:
      return chalk.red("Minimal access");
    case 10:
      return chalk.red("Guest");
    case 20:
      return chalk.yellow("Reporter");
    case 30:
      return chalk.yellow("Developer");
    case 40:
      return chalk.green("Maintainer");
    case 50:
      return chalk.green("Owner");
    default:
      return chalk.red("Unknown access level");
  }
};

const getRemainingTimeToExpiration = (expiryDate: string) => {
  const targetTime = new Date(expiryDate);
  const currentTime = new Date();
  const durationUntilTarget = Math.max(
    targetTime.getTime() - currentTime.getTime(),
    0
  );
  const remainingTime = Math.floor(durationUntilTarget / (1000 * 60 * 60 * 24));
  return remainingTime > 0 ? `${remainingTime} days remaining` : "Expired";
};

const displayTokenPermissions = (scopes: string[]) => {
  console.log(chalk.greenBright.bold("\n[i] Token Permissions:"));
  const table = new Table({
    head: ["Scope", "Description"],
    colWidths: [20, 100],
    wordWrap: true,
  });

  scopes.forEach((scope) => {
    const description = gitlabScopes[scope] || "No description available";
    table.push([chalk.green(scope), description]);
  });

  console.log(table.toString());
};

const gitlabAnalyzer = (gitLabPersonalAccessToken: string) => {
  if (!gitLabPersonalAccessToken) {
    console.error(
      chalk.red("[x] Error: Please provide a valid GitLab API token.")
    );
    process.exit(1);
  }
  analyzeGitLabPermissions(gitLabPersonalAccessToken);
};

export { makeGitLabRequest, gitlabAnalyzer };
