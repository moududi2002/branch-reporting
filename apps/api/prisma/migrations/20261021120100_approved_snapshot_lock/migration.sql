-- apps/api/prisma/migrations/<timestamp>_approved_snapshot_lock/migration.sql
-- Block updates/deletes on report_values and reports for APPROVED snapshots.

CREATE OR REPLACE FUNCTION fn_block_approved_report_update() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "reports" r
    WHERE r."id" = COALESCE(NEW."reportId", OLD."reportId")
      AND r."status" = 'APPROVED'
  ) THEN
    RAISE EXCEPTION 'Approved report is immutable';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_report_values
BEFORE UPDATE OR DELETE ON "report_values"
FOR EACH ROW EXECUTE FUNCTION fn_block_approved_report_update();

CREATE OR REPLACE FUNCTION fn_block_approved_report_meta_update() RETURNS trigger AS $$
BEGIN
  IF OLD."status" = 'APPROVED' AND NEW."status" <> 'APPROVED' THEN
    RAISE EXCEPTION 'Approved report status cannot change directly';
  END IF;
  IF OLD."status" = 'APPROVED' AND OLD."isApprovedSnapshot" = true AND
     (NEW."isApprovedSnapshot" = false OR NEW."templateId" <> OLD."templateId" OR NEW."thanaId" <> OLD."thanaId") THEN
    RAISE EXCEPTION 'Approved report metadata is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_report_meta
BEFORE UPDATE ON "reports"
FOR EACH ROW EXECUTE FUNCTION fn_block_approved_report_meta_update();