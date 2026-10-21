-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'BRANCH_ADMIN', 'THANA_ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportTypeCode" AS ENUM ('MONTHLY', 'FINANCIAL', 'INSTITUTION_MATRIX', 'COMMENT', 'TOUR');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('NUMBER', 'TEXT', 'TEXTAREA', 'SELECT', 'DATE', 'BOOLEAN', 'TABLE_ROWS');

-- CreateEnum
CREATE TYPE "CalculationRule" AS ENUM ('NONE', 'ADDITIVE', 'SNAPSHOT_LAST', 'WEIGHTED_AVERAGE', 'DIFFERENCE', 'FORMULA');

-- CreateEnum
CREATE TYPE "AggregationRule" AS ENUM ('SNAPSHOT_LAST', 'ADDITIVE', 'WEIGHTED_AVERAGE', 'TEXT_JOIN', 'NONE');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'REQUEST_REVISION', 'RESUBMIT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'REQUEST_REVISION', 'LOGIN', 'LOGOUT', 'IMPORT', 'PERIOD_OPEN', 'PERIOD_CLOSE');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_name_snapshots" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_name_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thanas" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "thanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thana_name_snapshots" (
    "id" TEXT NOT NULL,
    "thanaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thana_name_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "branchId" TEXT,
    "thanaId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_periods" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "academicSessionId" TEXT NOT NULL,
    "reportTypeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "submissionDeadline" TIMESTAMP(3) NOT NULL,
    "revisionDeadline" TIMESTAMP(3) NOT NULL,
    "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
    "autoCloseOnDeadline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reporting_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_types" (
    "id" TEXT NOT NULL,
    "code" "ReportTypeCode" NOT NULL,
    "nameBn" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "reportTypeId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "nameBn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_sections" (
    "id" TEXT NOT NULL,
    "reportTemplateId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "titleBn" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "layoutMeta" JSONB,

    CONSTRAINT "report_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_fields" (
    "id" TEXT NOT NULL,
    "reportTemplateId" TEXT NOT NULL,
    "sectionId" TEXT,
    "key" TEXT NOT NULL,
    "labelBn" TEXT NOT NULL,
    "fieldType" "FieldType" NOT NULL,
    "calculationRule" "CalculationRule" NOT NULL DEFAULT 'NONE',
    "aggregationRule" "AggregationRule" NOT NULL DEFAULT 'NONE',
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "options" JSONB,
    "formula" TEXT,
    "layoutMeta" JSONB,

    CONSTRAINT "report_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "thanaId" TEXT NOT NULL,
    "reportTypeId" TEXT NOT NULL,
    "reportingPeriodId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "thanaSnapshotName" TEXT,
    "branchSnapshotName" TEXT,
    "sourceReportId" TEXT,
    "isApprovedSnapshot" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_values" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNum" DECIMAL(18,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_table_rows" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rowData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_table_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_revisions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "targetFieldIds" JSONB,
    "previousValues" JSONB,
    "newValues" JSONB,
    "resubmittedAt" TIMESTAMP(3),

    CONSTRAINT "report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_approvals" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "actorId" TEXT NOT NULL,
    "actedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "report_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_deadlines" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "thanaId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "extendedAt" TIMESTAMP(3),
    "extensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE INDEX "branch_name_snapshots_branchId_idx" ON "branch_name_snapshots"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "thanas_code_key" ON "thanas"("code");

-- CreateIndex
CREATE INDEX "thanas_branchId_idx" ON "thanas"("branchId");

-- CreateIndex
CREATE INDEX "thana_name_snapshots_thanaId_idx" ON "thana_name_snapshots"("thanaId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_idx" ON "users"("branchId");

-- CreateIndex
CREATE INDEX "users_thanaId_idx" ON "users"("thanaId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_label_key" ON "academic_sessions"("label");

-- CreateIndex
CREATE INDEX "reporting_periods_branchId_idx" ON "reporting_periods"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "reporting_periods_branchId_reportTypeId_periodStart_periodE_key" ON "reporting_periods"("branchId", "reportTypeId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "report_types_code_key" ON "report_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_reportTypeId_version_key" ON "report_templates"("reportTypeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "report_sections_reportTemplateId_key_key" ON "report_sections"("reportTemplateId", "key");

-- CreateIndex
CREATE INDEX "report_fields_sectionId_idx" ON "report_fields"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "report_fields_reportTemplateId_key_key" ON "report_fields"("reportTemplateId", "key");

-- CreateIndex
CREATE INDEX "reports_thanaId_idx" ON "reports"("thanaId");

-- CreateIndex
CREATE INDEX "reports_reportingPeriodId_idx" ON "reports"("reportingPeriodId");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reports_thanaId_reportTypeId_reportingPeriodId_version_key" ON "reports"("thanaId", "reportTypeId", "reportingPeriodId", "version");

-- CreateIndex
CREATE INDEX "report_values_reportId_idx" ON "report_values"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "report_values_reportId_fieldId_key" ON "report_values"("reportId", "fieldId");

-- CreateIndex
CREATE INDEX "report_table_rows_reportId_fieldId_idx" ON "report_table_rows"("reportId", "fieldId");

-- CreateIndex
CREATE INDEX "report_revisions_reportId_idx" ON "report_revisions"("reportId");

-- CreateIndex
CREATE INDEX "report_approvals_reportId_idx" ON "report_approvals"("reportId");

-- CreateIndex
CREATE INDEX "report_deadlines_thanaId_idx" ON "report_deadlines"("thanaId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- AddForeignKey
ALTER TABLE "branch_name_snapshots" ADD CONSTRAINT "branch_name_snapshots_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thanas" ADD CONSTRAINT "thanas_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thana_name_snapshots" ADD CONSTRAINT "thana_name_snapshots_thanaId_fkey" FOREIGN KEY ("thanaId") REFERENCES "thanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_thanaId_fkey" FOREIGN KEY ("thanaId") REFERENCES "thanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_periods" ADD CONSTRAINT "reporting_periods_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_periods" ADD CONSTRAINT "reporting_periods_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_periods" ADD CONSTRAINT "reporting_periods_reportTypeId_fkey" FOREIGN KEY ("reportTypeId") REFERENCES "report_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_reportTypeId_fkey" FOREIGN KEY ("reportTypeId") REFERENCES "report_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sections" ADD CONSTRAINT "report_sections_reportTemplateId_fkey" FOREIGN KEY ("reportTemplateId") REFERENCES "report_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_fields" ADD CONSTRAINT "report_fields_reportTemplateId_fkey" FOREIGN KEY ("reportTemplateId") REFERENCES "report_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_fields" ADD CONSTRAINT "report_fields_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "report_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_thanaId_fkey" FOREIGN KEY ("thanaId") REFERENCES "thanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportTypeId_fkey" FOREIGN KEY ("reportTypeId") REFERENCES "report_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "reporting_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "report_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_sourceReportId_fkey" FOREIGN KEY ("sourceReportId") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_values" ADD CONSTRAINT "report_values_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_values" ADD CONSTRAINT "report_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "report_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_table_rows" ADD CONSTRAINT "report_table_rows_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_table_rows" ADD CONSTRAINT "report_table_rows_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "report_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_revisions" ADD CONSTRAINT "report_revisions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_approvals" ADD CONSTRAINT "report_approvals_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

