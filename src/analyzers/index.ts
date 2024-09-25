import { githubAnalyzer } from "./github";
import { gitlabAnalyzer } from "./gitlab";
import { mongodbAnalyzer } from "./mongodb";
import { mysqlAnalyzer } from "./mysql";
import { postgresqlAnalyzer } from "./postgresql";
import { slackAnalyzer } from "./slack";

interface Analyzer {
  [key: string]: (secret: string) => void;
}

const analyzers: Analyzer[] = [
  { github: githubAnalyzer },
  { gitlab: gitlabAnalyzer },
  { mongodb: mongodbAnalyzer },
  { mysql: mysqlAnalyzer },
  { postgresql: postgresqlAnalyzer },
  { slack: slackAnalyzer },
];

export { analyzers };
