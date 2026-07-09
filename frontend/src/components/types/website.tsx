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

const MOCK_DATA_RAW: WebsiteRecordDTO[] = [
  {
    id: "1",
    url: "https://example.com",
    label: "Example Main",
    boundaryRegexp: ".*example\.com.*",
    periodicity: "HOUR",
    active: true,
    tags: ["news", "tech"],
    lastCrawledAt: "2026-07-09T09:30:00Z",
    lastStatus: "SUCCEEDED",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-09T09:30:00Z",
  },
  {
    id: "2",
    url: "https://react.dev",
    label: "React Docs",
    boundaryRegexp: ".*react\.dev.*",
    periodicity: "NONE",
    active: true,
    tags: ["docs", "frontend"],
    lastCrawledAt: "2026-07-08T18:15:00Z",
    lastStatus: "SUCCEEDED",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-08T18:15:00Z",
  },
  {
    id: "3",
    url: "https://github.com",
    label: "GitHub Portal",
    boundaryRegexp: ".*github\.com.*",
    periodicity: "HOUR",
    active: true,
    tags: ["dev", "tools"],
    lastCrawledAt: "2026-07-09T10:00:00Z",
    lastStatus: "RUNNING",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-09T10:00:00Z",
  },
  {
    id: "4",
    url: "https://wikipedia.org",
    label: "Wikipedia",
    boundaryRegexp: ".*wikipedia\.org.*",
    periodicity: "NONE",
    active: false,
    tags: ["wiki", "education"],
    lastCrawledAt: "2026-07-05T12:00:00Z",
    lastStatus: "FAILED",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-05T12:00:00Z",
  },
  {
    id: "5",
    url: "https://vite.dev",
    label: "Vite Build Tool",
    boundaryRegexp: ".*vite\.dev.*",
    periodicity: "NONE",
    active: true,
    tags: ["tools", "frontend"],
    lastCrawledAt: "2026-07-09T05:00:00Z",
    lastStatus: "SUCCEEDED",
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-09T05:00:00Z",
  },
];

export const MOCK_DATA: WebsiteRecord[] = MOCK_DATA_RAW.map(mapWebsiteRecord);
