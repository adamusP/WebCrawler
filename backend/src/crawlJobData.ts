export type CrawlJobData = {
  url: string;
  regex: string;
  websiteRecordId: string;
  executionId: string;
  nextDelay: number;
};

export type CrawlJobDataInput = {
  url: string;
  regex: string;
  websiteRecordId: string;
  executionId: string;
};
