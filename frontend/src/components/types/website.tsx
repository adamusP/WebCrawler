export interface WebsiteRecordDTO {
  id: string;
  url: string;
  boundaryRegexp: string;
  periodicity: "MINUTE" | "HOUR" | "DAY" | "NONE";
  label: string;
  active: boolean;
  tags: string[];
  lastCrawledAt: string | null;
  lastStatus: "SUCCEEDED" | "FAILED" | "RUNNING" | null;
  createdAt: string;
  updatedAt: string;
}
export interface WebsiteRecord {
  id: string;
  url: string;
  boundaryRegexp: string;
  periodicity: "MINUTE" | "HOUR" | "DAY" | "NONE";
  label: string;
  active: boolean;
  tags: string[];
  lastCrawledAt: Date | null;
  lastStatus: "SUCCEEDED" | "FAILED" | "RUNNING" | null;
  createdAt: Date;
  updatedAt: Date;
}

export const mapWebsiteRecord = (dto: WebsiteRecordDTO): WebsiteRecord => {
  return {
    ...dto,
    lastCrawledAt: dto.lastCrawledAt ? new Date(dto.lastCrawledAt) : null,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
};
