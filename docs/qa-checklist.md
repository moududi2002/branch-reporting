<!-- docs/qa-checklist.md -->
# Final QA Checklist

## Auth & Roles
- [ ] SUPER_ADMIN লগইন, সব branch/thana/user দেখতে পারে
- [ ] BRANCH_ADMIN লগইন, শুধু নিজের শাখার thana/user দেখতে/তৈরি করতে পারে
- [ ] THANA_ADMIN লগইন, শুধু নিজের থানার রিপোর্ট দেখতে/লিখতে পারে
- [ ] VIEWER শুধু পড়তে পারে, কোনো write API 403 দেয়
- [ ] CSRF ছাড়া POST/PATCH 403 দেয়
- [ ] লগআউটে session destroy হয়

## Branch / Thana
- [ ] Super Admin branch তৈরি ও rename করতে পারে; rename-এ snapshot তৈরি হয়
- [ ] Branch Admin শাখার নাম বদলাতে পারে না
- [ ] Branch Admin নিজের শাখায় thana তৈরি ও rename করতে পারে
- [ ] Thana Admin thana rename করতে পারে না

## Period & Draft
- [ ] Period create-এ deadline order এবং overlap check
- [ ] Period খোলা হলে সব active thana-র Draft auto-create হয়
- [ ] Running period API আজকের period-এ পড়ে
- [ ] পুরোনো period-এ নতুন Draft তৈরি হয় না
- [ ] Previous approved report থাকলে `sourceReportId` সেট হয়; না থাকলে `null` (০ নয়)

## Form
- [ ] Previous মান read-only, auto-load (sourceReportId)
- [ ] Current মান editable (শুধু THANA_ADMIN/SUPER_ADMIN, DRAFT-এ)
- [ ] Auto-calc field (বৃদ্ধি, উদ্বৃত্ত) সূত্র অনুযায়ী হিসাব হয়
- [ ] TABLE_ROWS (কর্মী বৃদ্ধি তালিকা, matrix, tour) সংরক্ষণ হয়
- [ ] Section navigation, autosave, progress

## Workflow
- [ ] DRAFT → SUBMITTED (thana)
- [ ] SUBMITTED → APPROVED / REJECTED / REVISION_REQUESTED (branch)
- [ ] REVISION_REQUESTED → SUBMITTED (thana, resubmit)
- [ ] APPROVED → new version DRAFT (branch)
- [ ] Approved report values immutable (service + DB trigger)
- [ ] Report approval history ও revision history সংরক্ষিত

## Aggregation
- [ ] Monthly / semi-annual / annual aggregate window সঠিক
- [ ] শুধু APPROVED report aggregate-এ ঢোকে
- [ ] Missing / Pending / Not approved আলাদা তালিকায়; নীরবে ০ নয়
- [ ] Field-level rule (SNAPSHOT_LAST / ADDITIVE / WEIGHTED_AVERAGE / TEXT_JOIN / NONE)

## Specialized Reports
- [ ] Comment: প্রচ্ছদ নেই, intro/problems(4)/prospects(2)/actions(4 full-width)/conclusion, signature
- [ ] Tour: ১২টি স্থায়ী দায়িত্ব সারি, উপলক্ষ্য ৪+অন্যান্য, দিন, বার, signature
- [ ] Financial: বাম আয় (৬ কলাম), ডান ব্যয় (২ কলাম), উভয় total, comment band, signature
- [ ] Institution matrix: ১৯+ rows, group sub-rows, carry-forward (প্রথম পাতা থেকে), page total, সর্বমোট

## Historical Import
- [ ] Super Admin only
- [ ] Validate / dry-run / commit
- [ ] Duplicate approved report reject হয়
- [ ] Mismatch thana/branch reject হয়
- [ ] Audit log তৈরি হয়

## Security
- [ ] httpOnly cookie; SameSite=Lax; HTTPS-এ Secure
- [ ] Role guard প্রতিটি endpoint-এ
- [ ] Scope guard branch/thana অনুযায়ী
- [ ] Sensitive password hash bcrypt
- [ ] Backup script ৩০-দিন retention + weekly archive
- [ ] PM2 logs, Nginx security headers

## UI
- [ ] বাংলা ফন্ট ঠিকভাবে render হয়
- [ ] মোবাইল ও ডেস্কটপ responsive
- [ ] Status badge + text label (রঙ একা নয়)
- [ ] কোনো export বাটন/মেনু নেই