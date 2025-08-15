import { QualityStatus, QualityIssueType } from '../../enums';

export interface QualityControlDTO {
  id: string;
  taskId: string;
  controllerId: string;
  controller?: {
    id: string;
    name: string | null;
  };
  controlNumber: string;
  status: QualityStatus;
  completionRate: number;
  notes?: string | null;
  issuesFound?: number | null;
  correctionsNeeded?: number | null;
  controlDate: string;
  recontrolDate?: string | null;
  issueType?: QualityIssueType | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQualityControlDTO {
  taskId: string;
  controllerId: string;
  status?: QualityStatus;
  completionRate: number;
  notes?: string;
  issuesFound?: number;
  correctionsNeeded?: number;
  issueType?: QualityIssueType;
  recontrolDate?: string;
}

export interface UpdateQualityControlDTO {
  status?: QualityStatus;
  completionRate?: number;
  notes?: string | null;
  issuesFound?: number | null;
  correctionsNeeded?: number | null;
  recontrolDate?: string | null;
  issueType?: QualityIssueType | null;
}