# Securelog Scan

**Securelog Scan** is a tool designed to scan your codebase for potential secrets like API keys, tokens, and other sensitive information. It supports scanning `.env` files, parsing `.git` commit history, and analyzing all files line by line.

It takes 2min. Install, add, deploy.

Need Secret scanning in other places?

- [Securelog for your build and runtime logs](https://github.com/Onboardbase/securelog)
- [Securelog for your react server components](https://github.com/Onboardbase/securelog-rsc)

# Features

- **Codebase Scanning**: Scans all files your codebase for secrets.
- **Git History Scanning**: Scans your repo's commit across branches for secrets in tthe commit message and `.git` commit history.
- **Customizable Rules**: Supports regex patterns for popular companies and services like AWS, Azure, Stripe, PayPal, and many more.
- **Exclusion Options**: Users can to exclude specific folders and file extensions from scanning.
- **Parallel Processing**: Efficiently scans large repositories using parallel processing to streamline file scanning.
- **Selective Scanning**: Scan only files that have changed in recent commits, optimizing CI/CD pipeline usage.
- **Verify Secrets**: Verify secrets against their service provider to know if secret is still valid

## Install

To use `sls`,

---

```bash
yarn global add securelog-scan # npm i -g securelog-scan
```

---

### Show Version

```bash
sls --version
```

## Usage

### Basic command

To scan your codebase, simply run:

---

```bash
sls scan --dir <directory>
```

---

You can also scan your codebase just by specifying the public URL (only github, gitlab & bitbucket URLs for now)

---

```bash
sls scan --url https://github.com/username/my-public-repository
```

---

> Note: Securelog scan automatically defaults to `$cwd` if `--dir` flag is not provided

### Excluding folders, specifying maximum git commits, masking and verifying secrets

You can exclude specific folders or file extensions using the `--exclude` option:

---

```bash
sls scan --dir <directory> --exclude <folders> --commits <100> --verify <false> -- mask <true>
```

---

- **`--exclude <folders>`**: Comma-separated list of folders to exclude from scanning.
- **`--commits <number>`**: Number of most recent commits to scan (defaults to 100 most recent commits).
- **`--mask <boolean>`**: Whether secret should be masked or not (default is false)
- **`--verify <boolean>`**: Specify this if you want secrets to be verified against their service provider

---

### Scan only changed files

To scan only files and lines that have been changed in recent commits (useful in CI pipelines to only scan code changes):

---

```bash
sls scan --changed
```

---

### Config file

You can specify a path to a configuration file using the `--config` option. This file allows you to customize regex patterns and exclusion lists:

---

```bash
sls scan --config <path_to_config_file>
```

---

- **`--config <path_to_config_file>`**: Path to the config file.

### Example config.yml

Here is an example of what your config file might look like:

> Note: Adding custom regex patterns, paths or extensions to exclude is optional and should be used for your specific need only. By default, these have already been added to the library.

---

```yaml
detectors:
  # paystack:
  #   regex: "\\bsk\\_[a-z]{1,}\\_[A-Za-z0-9]{40}\\b"
  #   keywords: ["paystack"]
  #   detectorType: "Paystack"
  # mailgun:
  #   regex:
  #     "Original Token": "\\b([a-zA-Z-0-9]{72})\\b"
  #     "Key-Mailgun Token": "\\b(key-[a-z0-9]{32})\\b"
  #     "Hex Mailgun Token": "\\b([a-f0-9]{32}-[a-f0-9]{8}-[a-f0-9]{8})\\b"
  #   keywords: ["mailgun"]
  #   detectorType: "Mailgun"
  # Agora:
  #   regex: "\\b([a-z0-9]{32})\\b"
  #   keywords: ["agora"]
  #   detectorType: "Agora"
  #   group: ["agora"] // sorrounding groups to reduce false positives (mostly for generic secret types)
exclude:
  paths:
    # - "node_modules"
    # - "dist"
    # - ".git"
  extensions:
    # - ".png"
    # - ".jpg"
    # - ".log"
```

### Example command

---

```bash
sls scan --dir ./my-project --exclude dist,node_modules --config ./config.yml --commits 100
```

### You can also detect secrets in a string and mask it by default using the command below

```bash
sls scan --rawValue "raw secret values"
```

---

# Output

The scanner will output potential secrets found, including the following details:

- File path
- Line number
- The secret value
- The detector
- Author information (name & email)
- Commit title (if scanning Git history)

# Git-hooks integration with husky

To automatically run the secret scanning CLI before committing or pushing code, you can use Husky to manage Git hooks in your project.

## 1. Install husky

First, install Husky as a development dependency:

```bash
npm install husky --save-dev
```

## 2. Initialize husky

Initialize Husky to create a `.husky` directory where the hooks will be managed:

```bash
npx husky install
```

## 3. Create git-hooks

Create a pre-commit hook to run the secret scanning CLI:

```bash
npx husky add .husky/pre-commit "sls scan --changed"
```

Or create a pre-push hook:

```bash
npx husky add .husky/pre-push "sls scan --changed"
```

Replace `your-cli-command` with the actual name of your CLI tool.

## 4. Ensure husky runs on install

To ensure Husky is set up automatically when installing dependencies, add the following to your `package.json`:

```json
"scripts": {
  "prepare": "husky install"
}
```

## 5. Testing the hooks

After setting up the hooks, test them by attempting to make a commit or push in your repository. Husky will automatically run securelog scan, allowing or blocking the commit/push based on the scan results.

# CI pipelines

Securelog Scan allows you to run the to scan your codebase for secrets during CI processes. It provides flexibility for various configuration options such as excluding specific folders, limiting the number of commits to scan, and more.

## Usage

To use this workflow in your GitHub repository, reference it in your workflow file (e.g., `.github/workflows/secret-scan.yml`):

```yaml
name: Secret Scan

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Secret Scanning
        uses: onboardbase/securelog-scan@main
        with:
          exclude: "node_modules,dist" # Comma-separated list of folders to exclude (optional)
          commits: 100 # Number of recent commits to scan (optional)
          config: ".securelog.yaml" # Optional path to a custom config file (optional)
          changed: "true" # Set to "false" to scan entire repository instead of just files that was changed (optional)
          mask: "true" # that is mask secret value e.g sk_******
          verify: "true" # that is verify potential secrets against their service provider
```

# Analyzers

We have implemented various analyzers to help detect and analyze potential secrets within different types of services and platforms. Each analyzer is designed to handle specific types of secrets and configurations, ensuring that sensitive information is detected and managed appropriately. Below is an overview of the analyzers we have implemented

## Analyzer descriptions

| **Analyzer**   | **Command**                                             | **Description**                                                                                                                        |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **MongoDB**    | `sls analyze mongodb --secret "<connection-string>"`    | Inspects MongoDB connection strings, connects to the database, and retrieves information about collections, users, and databases.      |
| **MySQL**      | `sls analyze mysql --secret "<connection-string>"`      | Inspects MySQL connection strings, connects to the database, and retrieves information about tables, databases, and user grants.       |
| **PostgreSQL** | `sls analyze postgresql --secret "<connection-string>"` | Inspects PostgreSQL connection strings, connects to the database, and retrieves information about databases, tables, and user roles.   |
| **GitHub**     | `sls analyze github --secret "<api-key>"`               | Inspects GitHub API keys, attempts to access user data, and retrieves information about user details and access scopes.                |
| **GitLab**     | `sls analyze gitlab --secret "<api-key>"`               | Inspects GitLab API keys, attempts to access user and project data, and retrieves information about user roles and project visibility. |
| **Slack**      | `sls analyze slack --secret "<api-token>"`              | Inspects Slack API tokens, attempts to access workspace data, and retrieves information about channels, users, and workspace settings. |

## Command usage

To run an analyzer, use the following command:

```bash
sls analyze <analyzer> --secret "<api key or connection string>" # slack, mongodb, mysql, postgresql, github, gitlab,
```

## Secret removal from git history

To remove any detected secret from git history, use the following command:

```bash
sls git-rewrite --secrets "<secrets you will like removed from git history>"
```

> Note: This command modifies your Git history, so you should force-push the cleaned branches to the remote repository after running this:

```bash
git push --force --all
git push --force --tags
```

# Contributing

Feel free to contribute to this project by opening issues or submitting pull requests.

# License

This project is licensed under the Functional Source License. See the LICENSE file for more details.
