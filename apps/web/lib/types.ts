// apps/web/lib/types.ts
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';

export type ReportSection = { id: string; key: string; titleBn: string; order: number; layoutMeta?: any };
export type ReportField = {
  id: string;
  sectionId?: string | null;
  key: string;
  labelBn: string;
  fieldType: 'NUMBER' | 'TEXT' | 'TEXTAREA' | 'SELECT' | 'DATE' | 'BOOLEAN' | 'TABLE_ROWS';
  calculationRule: string;
  aggregationRule: string;
  isReadOnly: boolean;
  isRequired: boolean;
  order: number;
  options?: any;
  layoutMeta?: any;
};

export type ActiveRevision = {
  id: string;
  reason: string;
  targetFieldIds: string[];
  requestedAt: string;
};

export type FormResponse = {
  report: {
    id: string;
    status: ReportStatus;
    version: number;
    thanaId: string;
    reportTypeId: string;
    reportingPeriodId: string;
    thanaSnapshotName?: string | null;
    branchSnapshotName?: string | null;
  };
  template: { id: string; version: number; sections: ReportSection[]; fields: ReportField[] };
  previous: Record<string, any>;
  current: Record<string, any>;
  computed?: Record<string, number | null>;   // NEW
  tableRows: Record<string, Array<{ rowIndex: number; data: any }>>;
  activeRevision: ActiveRevision | null;
  revisionDeadline: { dueAt: string } | null;
};