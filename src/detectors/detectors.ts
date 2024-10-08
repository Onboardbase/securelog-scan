import { Detector } from "../types/detector";
import { AgoraDetector } from "./agora";
import { AlgoliaDetector } from "./algolia";
import { AnthropicDetector } from "./anthropic";
import { ApifyDetector } from "./apify";
import { AWSDetector } from "./aws";
import { AzureDetector } from "./azure";
import { BraintreeDetector } from "./braintree";
import { GCPDetector } from "./gcp";
import { GeminiDetector } from "./gemini";
import { GitHubClassicTokenDetectorV1 } from "./github/classic/v1";
import { GitHubClassicTokenDetectorV2 } from "./github/classic/v2";
import { GitLabDetectorV1 } from "./gitlab/v1";
import { GitLabDetectorV2 } from "./gitlab/v2";
import { MailgunDetector } from "./mailgun";
import { MailjetBasicAuthDetector } from "./mailjet/basicAuth";
import { MailjetSmsDetector } from "./mailjet/sms";
import { MixpanelDetector } from "./mixpanel";
import { MongoDBDetector } from "./mongodb";
import { MuxDetector } from "./mux";
import { MySQLDetector } from "./mysql";
import { OktaDetector } from "./okta";
import { OpenAIDetector } from "./openai";
import { PaystackDetector } from "./paystack";
import { PostgreSQLDetector } from "./postgres";
import { PostmanDetector } from "./postman";
import { RedisDetector } from "./redis";
import { SendgridDetector } from "./sendgrid";
import { SlackDetector } from "./slack";

export const detectors: Detector[] = [
  AgoraDetector,
  AlgoliaDetector,
  AnthropicDetector,
  ApifyDetector,
  AWSDetector,
  AzureDetector,
  BraintreeDetector,
  GCPDetector,
  GeminiDetector,
  GitHubClassicTokenDetectorV1,
  GitHubClassicTokenDetectorV2,
  GitLabDetectorV1,
  GitLabDetectorV2,
  MailgunDetector,
  MailjetBasicAuthDetector,
  MailjetSmsDetector,
  MixpanelDetector,
  MongoDBDetector,
  MuxDetector,
  MySQLDetector,
  OktaDetector,
  OpenAIDetector,
  PaystackDetector,
  PostgreSQLDetector,
  PostmanDetector,
  RedisDetector,
  SendgridDetector,
  SlackDetector,
];
