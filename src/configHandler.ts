import fs from "fs";
import yaml from "yaml";
import path from "path";
import { Config } from "./types";

export const configHandler = (filePath: string): Config | null => {
  const filePathExtension = path.extname(filePath);
  if (filePath && ![".yaml", ".yml"].includes(filePathExtension)) {
    throw new Error("Config file only supports YML or YAML files");
  }

  if (filePath && fs.existsSync(filePath)) {
    const config = fs.readFileSync(filePath, "utf8");
    return yaml.parse(config);
  }

  return null;
};
