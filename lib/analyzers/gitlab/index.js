const axios = require("axios");
const chalk = require("chalk");
const Table = require("cli-table3");
const figlet = require("figlet");

const GITLAB_API_BASE_URL = "https://gitlab.com/api/v4";

const gitlabScopes = {
  api: "Grants complete read/write access to the API, including all groups and projects, the container registry, the dependency proxy, and the package registry.",
  read_api:
    "Grants read access to the API, including all groups and projects, the container registry, and the package registry.",
  read_user:
    "Grants read-only access to your profile through the /user API endpoint, which includes username, public email, and full name. Also grants access to read-only API endpoints under /users.",
  create_runner: "Grants create access to the runners.",
  manage_runner: "Grants access to manage the runners.",
  k8s_proxy:
    "Grants permission to perform Kubernetes API calls using the agent for Kubernetes.",
  read_repository:
    "Grants read-only access to repositories on private projects using Git-over-HTTP or the Repository Files API.",
  write_repository:
    "Grants read-write access to repositories on private projects using Git-over-HTTP (not using the API).",
  read_registry:
    "Grants read-only access to container registry images on private projects.",
  write_registry:
    "Grants write access to container registry images on private projects. You need both read and write access to push images.",
  ai_features: "Grants access to GitLab Duo related API endpoints.",
};

const analyzeGitLabPermissions = async (apiToken) => {
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
  } catch (error) {
    console.error(chalk.red("[x] Error: "), error.message);
  }
};

const getPersonalAccessToken = async (apiToken) => {
  const url = `${GITLAB_API_BASE_URL}/personal_access_tokens/self`;
  const response = await makeGitLabRequest(url, apiToken);
  return response.data;
};

const getMetadata = async (apiToken) => {
  const url = `${GITLAB_API_BASE_URL}/metadata`;
  const response = await makeGitLabRequest(url, apiToken);
  return response.data;
};

const getAccessibleProjects = async (apiToken) => {
  const url = `${GITLAB_API_BASE_URL}/projects?min_access_level=10`;
  const response = await makeGitLabRequest(url, apiToken);
  return response.data;
};

const makeGitLabRequest = async (url, apiToken) => {
  try {
    const response = await axios.get(url, {
      headers: {
        "Private-Token": apiToken,
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

const displayAccessTokenInfo = (token) => {
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

const displayMetadata = (metadata) => {
  console.log(chalk.greenBright.bold("\n[i] GitLab Instance Metadata:"));
  console.log(chalk.green("Version:"), metadata.version);
  console.log(chalk.green("Enterprise:"), metadata.enterprise, "\n");
};

const displayProjects = (projects) => {
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

const getAccessLevelLabel = (level) => {
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

const getRemainingTimeToExpiration = (expiryDate) => {
  const targetTime = new Date(expiryDate);
  const currentTime = new Date();
  const durationUntilTarget = Math.max(targetTime - currentTime, 0);
  const remainingTime = Math.floor(durationUntilTarget / (1000 * 60 * 60 * 24));
  return remainingTime > 0 ? `${remainingTime} days remaining` : "Expired";
};

const displayTokenPermissions = (scopes) => {
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

const main = () => {
  figlet.text("Gitlab Analyzer", {}, (err, data) => {
    if (!err) console.log(chalk.cyan(data));
  });

  const gitLabPersonalAccessToken = "";
  if (!gitLabPersonalAccessToken) {
    console.error(
      chalk.red("[x] Error: Please provide a valid GitLab API token.")
    );
    process.exit(1);
  }
  analyzeGitLabPermissions(gitLabPersonalAccessToken);
};

main();
