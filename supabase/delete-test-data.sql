-- Deletes every record saved from a test session (a link opened with ?test=1).
-- Paste into the Supabase SQL Editor and click Run. Real participants' rows
-- are never marked is_test, so they are untouched.
--
-- Test sessions never touch the assignment counter. If you also ran the load
-- script (scripts/load-test.mjs), which does call /api/assign, reset the
-- counter before launch with the last statement below.

delete from public.responses      where is_test;
delete from public.contact_emails where is_test;

-- Before launch only (uncomment to run): start the 50/50 counter from zero.
-- update public.assignment_state set n_control = 0, n_treatment = 0 where id = 1;
