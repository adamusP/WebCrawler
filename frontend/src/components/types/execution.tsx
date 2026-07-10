export type ExecutionStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface ExecutionDTO {
  id: string;
  websiteRecordId: string;
  websiteRecordLabel: string;
  status: ExecutionStatus;
  startedAt: string | null;
  endedAt: string | null;
  pagesCrawled: number;
  createdAt: string;
}

export interface Execution {
  id: string;
  websiteRecordId: string;
  websiteRecordLabel: string;
  status: ExecutionStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  pagesCrawled: number;
  createdAt: Date;
}

export const mapExecution = (dto: ExecutionDTO): Execution => ({
  ...dto,
  startedAt: dto.startedAt ? new Date(dto.startedAt) : null,
  endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
  createdAt: new Date(dto.createdAt),
});
