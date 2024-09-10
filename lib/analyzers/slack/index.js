const axios = require("axios");
const chalk = require("chalk");
const Table = require("cli-table3");
const figlet = require("figlet");

const SLACK_API_BASE_URL = "https://slack.com/api";
const slackScopes = {
  // Administrative scopes
  "admin.apps:read": "View all apps and app requests in the workspace.",
  "admin.apps:write":
    "Approve and restrict apps for installation in the workspace.",
  "admin.barriers:read": "View workspace information barriers.",
  "admin.barriers:write": "Manage workspace information barriers.",
  "admin.conversations:read": "View managed channels in the workspace.",
  "admin.conversations:write": "Manage and archive channels in the workspace.",
  "admin.invites:read": "View all workspace invite requests.",
  "admin.invites:write": "Approve and deny workspace invite requests.",
  "admin.teams:read": "View the workspace’s settings and configurations.",
  "admin.teams:write": "Manage the workspace’s settings and configurations.",
  "admin.usergroups:read": "View the workspace’s user groups.",
  "admin.usergroups:write": "Manage the workspace’s user groups.",
  "admin.users:read": "View users' account information in the workspace.",
  "admin.users:write": "Manage users' account information in the workspace.",
  "admin.workspaces:read": "View workspace settings and information.",
  "admin.workspaces:write": "Manage workspace settings and information.",
  "auditlogs:read": "View the workspace’s audit logs.",

  // User scopes
  "channels:history": "Access messages and other content in public channels.",
  "channels:join": "Join public channels in the workspace.",
  "channels:manage": "Manage public channels that the user is a member of.",
  "channels:write":
    "Manage a user’s public channels and create new ones on a user’s behalf",
  "channels:read":
    "View basic information about public channels in a workspace.",
  "chat:write": "Send messages as the authenticated user.",
  "chat:write.customize":
    "Send messages as the authenticated user with customized information.",
  "chat:write.public":
    "Send messages to public channels as the authenticated user.",
  commands: "Add commands to Slack.",
  "dnd:read": "View Do Not Disturb settings for users.",
  "dnd:write": "Set Do Not Disturb settings for users.",
  "emoji:read": "View the list of emojis in the workspace.",
  "files:read":
    "View files shared in channels and conversations the user is a part of.",
  "files:write":
    "Upload, edit, and delete files in channels and conversations.",
  "groups:history": "Access messages and other content in private channels.",
  "groups:read":
    "View basic information about private channels in a workspace.",
  "groups:write": "Manage private channels the user is a member of.",
  "im:history": "Access messages and other content in direct messages.",
  "im:read":
    "View basic information about direct messages the user is a part of.",
  "im:write": "Manage direct messages the user is a part of.",
  "incoming-webhook": "Post messages to specific channels in a workspace.",
  "links.embed:write": "Provide an unfurling of URL links posted in messages.",
  "links:read": "Read URL previews for links posted in messages.",
  "mpim:history": "Access messages and other content in group direct messages.",
  "mpim:read":
    "View basic information about group direct messages the user is a part of.",
  "mpim:write": "Manage group direct messages the user is a part of.",
  "pins:read": "View pinned messages and files in channels and conversations.",
  "pins:write":
    "Pin and unpin messages and files in channels and conversations.",
  "reactions:read":
    "View reactions added to messages and files in channels and conversations.",
  "reactions:write":
    "Add and remove reactions to messages and files in channels and conversations.",
  identify: "View information about a user’s identity",

  // Scopes for Reminders
  "reminders:read": "View the list of reminders the user has set.",
  "reminders:write": "Create and delete reminders for the user.",

  // Scopes for Triggers
  "triggers:read": "Read triggers that the user or app can act upon.",
  "triggers:write": "Create and modify triggers that can initiate workflows.",

  "remote_files:read":
    "View remote files shared in channels and conversations.",
  "remote_files:share": "Share remote files in channels and conversations.",
  "remote_files:write":
    "Upload, edit, and delete remote files in channels and conversations.",
  "search:read": "Search for messages, files, and more in a workspace.",
  "stars:read": "View starred items in channels and conversations.",
  "stars:write":
    "Add or remove stars from items in channels and conversations.",
  "team.billing:read": "View billing information for the workspace.",
  "team.integration_logs:read":
    "View logs of integrations added to the workspace.",
  "team:read": "View basic information about the workspace.",
  "usergroups:read": "View the list of user groups in the workspace.",
  "usergroups:write":
    "Create, manage, and delete user groups in the workspace.",
  "users:read": "View basic information about users in the workspace.",
  "users:read.email": "View email addresses of users in the workspace.",
  "users.profile:read": "View users' profile information in the workspace.",
  "users.profile:write": "Edit users' profile information in the workspace.",
  "users:write":
    "Invite new members to the workspace and modify existing users.",
  "workflow.steps:execute": "Execute steps in a workflow.",
};

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
