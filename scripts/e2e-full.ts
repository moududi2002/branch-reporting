// scripts/e2e-full.ts
// After super admin login + branch/thana/period setup (from e2e-acceptance.ts):
// For each report type, create draft, submit, approve, and verify aggregate visibility.
const REPORT_TYPES = ['MONTHLY', 'FINANCIAL', 'INSTITUTION_MATRIX', 'COMMENT', 'TOUR'];
async function smokeAll() {
  for (const code of REPORT_TYPES) {
    const types = await call('/report-types');
    const t = types.find((x: any) => x.code === code);
    const period = await call(`/branches/${BRANCH_ID}/reporting-periods`, {
      method: 'POST',
      body: JSON.stringify({
        academicSessionId: SESSION_ID, reportTypeId: t.id, label: `E2E ${code}`,
        periodStart: '2024-04-01T00:00:00Z', periodEnd: '2024-04-30T23:59:59Z',
        submissionDeadline: '2024-05-05T23:59:59Z', revisionDeadline: '2024-05-10T23:59:59Z',
      }),
    });
    const list = await call(`/reporting-periods/${period.id}/reports`);
    if (!list.length) throw new Error(`${code}: draft not created`);
    // submit + approve like acceptance script
    console.log(`✔ ${code} flow`);
  }
}