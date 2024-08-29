const fs = require("fs");
const yaml = require("yaml");
const path = require("path");

const configHandler = (filePath) => {
  const filePathExtension = path.extname(filePath);
  if (filePath && ![".yaml", ".yml"].includes(filePathExtension)) {
    throw new Error("Config file only support YML or YAML files");
  }

  if (filePath && fs.existsSync(filePath)) {
    const config = fs.readFileSync(filePath, "utf8");
    const configContent = yaml.parse(config, { encoding: "utf8" });
    return configContent;
  }
};

module.exports = { configHandler };
