import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
/**
 * Reads and processes input file data based on file extension
 */
export function readInputFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const extension = path.extname(filePath).toLowerCase();

  try {
    switch (extension) {
      case '.json':
        return JSON.parse(fileContent);
      case '.yaml':
      case '.yml':
        return yaml.load(fileContent);
      default:
        return fileContent;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    throw error;
  }
}
