import { Detector } from "../types/detector";
import { AgoraDetector } from "./agora";
import { AlgoliaDetector } from "./algolia";
import { AnthropicDetector } from "./anthropic";
import { ApifyDetector } from "./apify";
import { AtlassianV1Detector } from "./atlassian/v1";
import { AtlassianV2Detector } from "./atlassian/v2";
import { AWSDetector } from "./aws";
import { AzureDetector } from "./azure";
import { BraintreeDetector } from "./braintree";
import { CensysDetector } from "./censys";
import { ChatbotDetector } from "./chatbot";
import { CircleCiDetector } from "./circleci";
import { CloudflareDetector } from "./cloudflare";
import { CodacyDetector } from "./codacy";
import { CodeClimateDetector } from "./codeclimate";
import { CoinApiDetector } from "./coinapi";
import { CoinbaseDetector } from "./coinbase";
import { ConfluentDetector } from "./confluent";
import { CreditCardDetector } from "./creditcard";
import { DatadogTokenDetector } from "./datadogtoken";
import { DigitaloceanV1Detector } from "./digitalocean/v1";
import { DigitaloceanV2Detector } from "./digitalocean/v2";
import { DiscordBotTokenDetector } from "./discordbottoken";
import { DiscordWebhookDetector } from "./discordwebhook";
import { DisqusDetector } from "./disqus";
import { DocusignDetector } from "./docusign";
import { DropboxDetector } from "./dropbox";
import { FlickrDetector } from "./flickr";
import { FlutterwaveDetector } from "./flutterwave";
import { FormBucketDetector } from "./formbucket";
import { GCPDetector } from "./gcp";
import { GeminiDetector } from "./gemini";
import { GitHubClassicTokenDetectorV1 } from "./github/classic/v1";
import { GitHubClassicTokenDetectorV2 } from "./github/classic/v2";
import { GitLabDetectorV1 } from "./gitlab/v1";
import { GitLabDetectorV2 } from "./gitlab/v2";
import { GoogleOauth2Detector } from "./googleoauth2";
import { MailchimpDetector } from "./mailchimp";
import { MailgunDetector } from "./mailgun";
import { MailjetBasicAuthDetector } from "./mailjet/basicAuth";
import { MailjetSmsDetector } from "./mailjet/sms";
import { MiroDetector } from "./miro";
import { MixpanelDetector } from "./mixpanel";
import { MongoDBDetector } from "./mongodb";
import { MuxDetector } from "./mux";
import { MySQLDetector } from "./mysql";
import { NotionDetector } from "./notion";
import { NpmV1Detector } from "./npm/v1";
import { NpmV2Detector } from "./npm/v2";
import { OktaDetector } from "./okta";
import { OpenAIDetector } from "./openai";
import { PaystackDetector } from "./paystack";
import { PostgreSQLDetector } from "./postgres";
import { PostmanDetector } from "./postman";
import { RedisDetector } from "./redis";
import { SendgridDetector } from "./sendgrid";
import { SlackDetector } from "./slack";
import { SlackWebhooksDetector } from "./slackwebhook";
import { StripeDetector } from "./stripe";
import { TelegramBotTokenDetector } from "./telegrambottoken";

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
  AtlassianV1Detector,
  AtlassianV2Detector,
  CensysDetector,
  ChatbotDetector,
  CloudflareDetector,
  CodacyDetector,
  CodeClimateDetector,
  CoinApiDetector,
  CoinbaseDetector,
  ConfluentDetector,
  DigitaloceanV1Detector,
  DigitaloceanV2Detector,
  DiscordBotTokenDetector,
  DiscordWebhookDetector,
  DisqusDetector,
  DocusignDetector,
  DropboxDetector,
  FlickrDetector,
  StripeDetector,
  SlackWebhooksDetector,
  NpmV1Detector,
  NpmV2Detector,
  NotionDetector,
  GoogleOauth2Detector,
  MiroDetector,
  MailchimpDetector,
  FlutterwaveDetector,
  FormBucketDetector,
  CircleCiDetector,
  DatadogTokenDetector,
  TelegramBotTokenDetector,
  CreditCardDetector,
];
