interface ClassicTokenScopes {
  [key: string]: string;
}

export const classicGithubScopes: ClassicTokenScopes = {
  // Repo Scopes
  repo: "Full control of private repositories",
  "repo:status": "Access commit status",
  repo_deployment: "Access deployment status",
  public_repo: "Access public repositories",
  "repo:invite": "Access repository invitations",
  security_events: "Read and write security events",

  // workflow scopes
  workflow: "Update GitHub Action workflows",

  // packages scopes
  "write:packages": "Upload packages to GitHub Package Registry",
  "read:packages": "Download packages from GitHub Package Registry",
  "delete:packages": "Delete packages from GitHub Package Registry",

  // admin org scopes
  "admin:org": "Full control of orgs and teams, read and write org projects",
  "write:org":
    "Read and write org and team membership, read and write org projects",
  "read:org": "Read org and team membership, read org projects",
  "manage_runners:org": "Manage org runners and runner groups",
  "admin:public_key": "Full control of user public keys",
  "write:public_key": "Write user public keys",
  "read:public_key": "Read user public keys",
  "admin:repo_hook": "Full control of repository hooks",
  "write:repo_hook": "Write repository hooks",
  "read:repo_hook": "Read repository hooks",
  "admin:org_hook": "Full control of organization hooks",

  gist: "Create gists",
  notifications: "Access notifications",

  user: "Update ALL user data",
  "read:user": "Read ALL user profile data",
  "user:email": "Access user email addresses (read-only)",
  "user:follow": "Follow and unfollow users",

  delete_repo: "Delete repositories",

  "write:discussion": "Read and write team discussions ",
  "read:discussion": "Read team discussions",

  "admin:enterprise": "Full control of enterprises",
  "manage_runners:enterprise": "Manage enterprise runners and runner groups",
  "manage_billing:enterprise": "Read and write enterprise billing data",
  "read:enterprise": "Read enterprise profile data",

  audit_log: "Full control of audit log",
  "read:audit_log": "Read access of audit log",

  codespace: "Full control of codespaces",
  "codespace:secrets":
    "Ability to create, read, update, and delete codespace secrets",

  copilot: "Full control of GitHub Copilot settings and seat assignments",
  "manage_billing:copilot": "View and edit Copilot Business seat assignments",

  project: "Full control of projects",
  "read:project": "Read access of projects",

  "admin:gpg_key": "Full control of public user GPG keys",
  "write:gpg_key": "Write public user GPG keys",
  "read:gpg_key": "Read public user GPG keys",

  "admin:ssh_signing_key": "Full control of public user SSH signing keys",
  "write:ssh_signing_key": "Write public user SSH signing keys",
  "read:ssh_signing_key": "Read public user SSH signing keys",
};
