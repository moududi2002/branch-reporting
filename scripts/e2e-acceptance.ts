// scripts/e2e-acceptance.ts
/**
 * End-to-end smoke: creates one branch/thana/user, opens a period,
 * verifies draft auto-create, submit/approve, and aggregate visibility.
 *
 * Run: pnpm tsx scripts/e2e-acceptance.ts (with API running on localhost:4000)
 */
const API = process.env.API_BASE ?? 'http://localhost:4000/api/v1';
let cookie = '';

async function call(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any) };
  if (cookie) headers['cookie'] = cookie;
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const stamp = Date.now();
  const branchCode = `E2E-${stamp}`;
  const thanaCode = `T-${stamp}`;

  // 1. login super admin
  await call('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'superadmin@example.com', password: 'Admin@12345' }) });
  console.log('✔ super admin login');

  // 2. session
  const session = await call('/academic-sessions', {
    method: 'POST',
    body: JSON.stringify({ label: `S-${stamp}`, startDate: '2024-01-01', endDate: '2024-12-31' }),
  });
  console.log('✔ academic session created', session.id);

  // 3. branch
  const branch = await call('/branches', { method: 'POST', body: JSON.stringify({ name: 'E2E Branch', code: branchCode }) });
  console.log('✔ branch created', branch.id);

  // 4. thana
  const thana = await call(`/branches/${branch.id}/thanas`, {
    method: 'POST',
    body: JSON.stringify({ name: 'E2E Thana', code: thanaCode }),
  });
  console.log('✔ thana created', thana.id);

  // 5. thana user
  await call('/users', {
    method: 'POST',
    body: JSON.stringify({
      email: `thana-${stamp}@e2e.local`,
      password: 'Thana@12345',
      fullName: 'E2E Thana Admin',
      role: 'THANA_ADMIN',
      branchId: branch.id,
      thanaId: thana.id,
    }),
  });
  console.log('✔ thana user created');

  // 6. branch admin user
  await call('/users', {
    method: 'POST',
    body: JSON.stringify({
      email: `branch-${stamp}@e2e.local`,
      password: 'Branch@12345',
      fullName: 'E2E Branch Admin',
      role: 'BRANCH_ADMIN',
      branchId: branch.id,
    }),
  });
  console.log('✔ branch user created');

  // 7. get monthly report type
  const types = await call('/report-types');
  const monthly = types.find((t: any) => t.code === 'MONTHLY');

  // 8. open period (auto-creates drafts)
  const period = await call(`/branches/${branch.id}/reporting-periods`, {
    method: 'POST',
    body: JSON.stringify({
      academicSessionId: session.id,
      reportTypeId: monthly.id,
      label: `E2E ${stamp}`,
      periodStart: '2024-03-01T00:00:00Z',
      periodEnd: '2024-03-31T23:59:59Z',
      submissionDeadline: '2024-04-05T23:59:59Z',
      revisionDeadline: '2024-04-10T23:59:59Z',
    }),
  });
  console.log('✔ period opened, draft auto-created', period.id);

  // 9. list reports for period
  const list = await call(`/reporting-periods/${period.id}/reports`);
  if (!list.length) throw new Error('draft not auto-created');
  const report = list[0];
  console.log('✔ draft found', report.id, report.status);

  // 10. thana login
  cookie = '';
  await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: `thana-${stamp}@e2e.local`, password: 'Thana@12345' }),
  });
  console.log('✔ thana login');

  // 11. submit
  await call(`/reports/${report.id}/submit`, { method: 'POST', body: JSON.stringify({ comment: 'e2e submit' }) });
  console.log('✔ submitted');

  // 12. branch login, approve
  cookie = '';
  await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: `branch-${stamp}@e2e.local`, password: 'Branch@12345' }),
  });
  await call(`/reports/${report.id}/approve`, { method: 'POST', body: JSON.stringify({ comment: 'e2e approve' }) });
  console.log('✔ approved');

  // 13. aggregate
  const agg = await call(`/branches/${branch.id}/aggregates?reportTypeId=${monthly.id}&scope=monthly&at=2024-03-15`);
  if (agg.approvedCount !== 1) throw new Error(`expected approvedCount=1, got ${agg.approvedCount}`);
  console.log('✔ aggregate sees 1 approved, missing:', agg.missingCount);

  // 14. approved report should be immutable
  cookie = '';
  await call('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: `thana-${stamp}@e2e.local`, password: 'Thana@12345' }),
  });
  const immutableRes = await fetch(`${API}/reports/${report.id}/values`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ values: [] }),
  });
  if (immutableRes.ok) throw new Error('approved report should be read-only');
  console.log('✔ approved report is immutable');

  console.log('\n✅ E2E acceptance flow passed');
}

main().catch((e) => {
  console.error('❌ E2E failed:', e);
  process.exit(1);
});