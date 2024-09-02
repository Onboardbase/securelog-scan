# Securelog Scan

**Securelog Scan** is a tool designed to scan your codebase for potential secrets like API keys, tokens, and other sensitive information. It supports scanning `.env` files, parsing `.git` commit history, and analyzing all files line by line.

# Features

- **Codebase Scanning**: Scans all files in the specified directory for potential secrets.
- **Git History Scanning**: Analyzes `.git` commit history to detect secrets that might have been committed in the past and also the information of whoever commited the secret.
- **Customizable Rules**: Supports regex patterns for popular companies and services like AWS, Azure, Stripe, PayPal, and many more.
- **Exclusion Options**: Allows users to exclude specific folders and file extensions from scanning.
- **Parallel Processing**: Efficiently scans large repositories using parallel processing to streamline file scanning.
- **Selective Scanning**: Scan only files that have changed in recent commits, optimizing CI/CD pipeline usage.

## Install

To use `sls`,

---

```bash
yarn global add securelog-scan # npm i g securelog-scan
```

---

## Usage

### Basic command

To scan your codebase, simply run:

---

```bash
sls --dir <directory>
```

---

> Note: Secure Log Scan automatically defaults to `$cwd` if `--dir` flag is not provided

### Excluding folders and specifying maximum git commits

You can exclude specific folders or file extensions using the `--exclude` option:

---

```bash
sls --dir <directory> --exclude <folders> --commits <100>
```

---

- **`--exclude <folders>`**: Comma-separated list of folders to exclude from scanning.
- **`--commits <number>`**: Number of most recent commits to scan (defaults to 100 most recent commits).

---

### Scan Only Changed Files

To scan only files and lines that have been changed in recent commits (useful in CI pipelines to only scan code changes):

---

```bash
sls --changed
```

---

### Config file

You can specify a path to a configuration file using the `--config` option. This file allows you to customize regex patterns and exclusion lists:

---

```bash
sls  --config <path_to_config_file>
```

---

### Example config file

Here is an example of what your config file might look like:

---

```yaml
regexes:
  AWS: /^[A-Za-z0-9]{43}$/
  Onboardbase: /^[A-Za-z0-9]{43}$/
  URL: /([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(:\d+)?(\/[^\s]*)?/
exclude:
  paths:
    - "node_modules"
    - "dist"
    - ".git"
  extensions:
    - ".png"
    - ".jpg"
    - ".log"
```

### Example command

---

```bash
sls --dir ./my-project --exclude dist,node_modules --config ./config.yml --commits 100
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

## Git Hooks Integration with Husky

To automatically run the secret scanning CLI before committing or pushing code, you can use Husky to manage Git hooks in your project.

### 1. Install Husky

First, install Husky as a development dependency:

```bash
npm install husky --save-dev
```

### 2. Initialize Husky

Initialize Husky to create a `.husky` directory where the hooks will be managed:

```bash
npx husky install
```

### 3. Create Git Hooks

Create a pre-commit hook to run the secret scanning CLI:

```bash
npx husky add .husky/pre-commit "sls --changed"
```

Or create a pre-push hook:

```bash
npx husky add .husky/pre-push "sls --changed"
```

Replace `your-cli-command` with the actual name of your CLI tool.

### 4. Ensure Husky Runs on Install

To ensure Husky is set up automatically when installing dependencies, add the following to your `package.json`:

```json
"scripts": {
  "prepare": "husky install"
}
```

### 5. Testing the Hooks

After setting up the hooks, test them by attempting to make a commit or push in your repository. Husky will automatically run the secret scanning CLI, allowing or blocking the commit/push based on the scan results.

# CI Pipelines

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
  run_secret_scan:
    uses: Onboardbase/securelog-scan/.github/workflows/securelog-scan.yml@main
    with:
      exclude: "node_modules,dist" # Comma-separated list of folders to exclude (optional)
      commits: 100 # Number of recent commits to scan (optional)
      config: ".securelog.yaml" # Optional path to a custom config file (optional)
      changed: "true" # Set to "flase" to scan entire repository instead of just files that was changed (optional)
```

# Contributing

Feel free to contribute to this project by opening issues or submitting pull requests.

# License

This project is licensed under the Functional Source License. See the LICENSE file for more details.
