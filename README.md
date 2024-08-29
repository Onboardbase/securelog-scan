# Securelog Scan

**Securelog Scan** is a tool designed to scan your codebase for potential secrets like API keys, tokens, and other sensitive information. It supports scanning `.env` files, parsing `.git` commit history, and analyzing all files line by line.

## Features

- **Codebase Scanning**: Scans all files in the specified directory for potential secrets.
- **Git History Scanning**: Analyzes `.git` commit history to detect secrets that might have been committed in the past and also the information of whoever commited the secret.
- **Customizable Rules**: Supports regex patterns for popular companies and services like AWS, Azure, Stripe, PayPal, and many more.
- **Exclusion Options**: Allows users to exclude specific folders and file extensions from scanning.
- **Parallel Processing**: Efficiently scans large repositories using parallel processing to streamline file scanning.

## Installation

`npm install -g securelog-scan`

## Usage

### Basic Command

To scan your codebase, simply run:

`sls --dir <directory>`

> Note: Secure Log Scan automatically defaults to `$cwd` if `--dir` flag is not provided

### Excluding Folders and Extensions

You can exclude specific folders or file extensions using the `--exclude` option:

`sls --dir <directory> --exclude <folders>`

- **`--exclude <folders>`**: Comma-separated list of folders to exclude from scanning.

### Config File

You can specify a path to a configuration file using the `--config` option. This file allows you to customize regex patterns and exclusion lists:

`sls  --config <path_to_config_file>`

#### Example Config File

Here is an example of what your config file might look like:

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

### Config File

You can specify a path to a configuration file using the `--config` option:

`sls <directory> --config <path_to_config_file>`

- **`--config <path_to_config_file>`**: Path to a secure log scan config file.

## Example Command

`sls --dir ./my-project --exclude dist,node_modules --config ./config.yml --commits 100`

### Output

The scanner will output potential secrets found, including the following details:

- File path
- Line number
- The secret value
- The detector
- Author information (name & email)
- Commit title (if scanning Git history)

## Contributing

Feel free to contribute to this project by opening issues or submitting pull requests.

## License

This project is licensed under the Functional Source License. See the LICENSE file for more details.
