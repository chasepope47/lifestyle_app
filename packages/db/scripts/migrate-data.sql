-- ============================================================
-- Data Migration: budget-app + popepantry → lifestyle_app
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- AFTER completing these steps:
--   1. Run migrations 001–009 in the SQL editor (in order)
--   2. Sign up as Chase at https://klvjpcfsjpqptovyljwt.supabase.co
--   3. Sign up as Bre
--   4. Chase logs in and creates a household (Dashboard or app)
--   5. Bre joins via the invite code
--   6. Get user IDs:  Dashboard → Authentication → Users
--   7. Get household ID: Dashboard → Table Editor → households
--   8. Fill in the three placeholder values below, then run
-- ============================================================

DO $migration$
DECLARE
  -- ── FILL THESE IN ─────────────────────────────────────────
  chase_id UUID := '83d96329-f1ea-4820-b0fc-798e1b799d1b';
  bre_id   UUID := 'f3b494af-9b39-4fd7-9698-02d2e9319fe1';
  hh_id    UUID := 'b0eb1fdd-355c-41f7-87e8-7964fc1ea2e8';
  -- ──────────────────────────────────────────────────────────

  -- Original account UUIDs preserved so transaction FKs work
  acc_usaa_chk UUID := 'a0d731f2-23e6-4f44-a49b-247686b1b915';
  acc_iccu_sav UUID := '0f64fa73-8427-4c49-a37b-3d8435a28734';
  acc_usaa_sav UUID := '1f244a53-bcfa-4f98-b3cd-d85630b1df03';
  acc_iccu_chk UUID := '968df472-1ba6-45dd-9947-ff0d6c798f99';

  -- Category UUIDs (generated fresh at runtime)
  cat_food       UUID;
  cat_groceries  UUID;
  cat_subs       UUID;
  cat_transfers  UUID;
  cat_shopping   UUID;
  cat_utilities  UUID;
  cat_transport  UUID;
  cat_health     UUID;
  cat_donations  UUID;
  cat_income_pay UUID;
  cat_income_ref UUID;

BEGIN
  -- Guard: fail fast if placeholders were not replaced
  IF chase_id::TEXT = 'REPLACE-WITH-CHASE-USER-ID' THEN
    RAISE EXCEPTION 'Fill in chase_id before running';
  END IF;
  IF bre_id::TEXT = 'REPLACE-WITH-BRE-USER-ID' THEN
    RAISE EXCEPTION 'Fill in bre_id before running';
  END IF;
  IF hh_id::TEXT = 'REPLACE-WITH-HOUSEHOLD-ID' THEN
    RAISE EXCEPTION 'Fill in hh_id before running';
  END IF;

  -- Generate category UUIDs
  cat_food       := gen_random_uuid();
  cat_groceries  := gen_random_uuid();
  cat_subs       := gen_random_uuid();
  cat_transfers  := gen_random_uuid();
  cat_shopping   := gen_random_uuid();
  cat_utilities  := gen_random_uuid();
  cat_transport  := gen_random_uuid();
  cat_health     := gen_random_uuid();
  cat_donations  := gen_random_uuid();
  cat_income_pay := gen_random_uuid();
  cat_income_ref := gen_random_uuid();

  -- ── 1. BUDGET ACCOUNTS ─────────────────────────────────────
  -- Preserving original UUIDs so transaction account_id FKs need no changes.
  INSERT INTO budget_accounts (id, household_id, name, type, balance, currency, is_shared, created_by, created_at) VALUES
    (acc_usaa_chk, hh_id, 'USAA Checking', 'checking',  25.32, 'USD', true, chase_id, '2026-06-22 00:36:39+00'),
    (acc_iccu_sav, hh_id, 'ICCU Savings',  'savings',  798.83, 'USD', true, chase_id, '2026-06-22 00:42:01+00'),
    (acc_usaa_sav, hh_id, 'USAA Savings',  'savings',  430.53, 'USD', true, chase_id, '2026-06-22 00:38:01+00'),
    (acc_iccu_chk, hh_id, 'ICCU Checking', 'checking',  71.11, 'USD', true, chase_id, '2026-06-22 00:43:04+00');

  -- ── 2. BUDGET CATEGORIES ───────────────────────────────────
  INSERT INTO budget_categories (id, household_id, name) VALUES
    (cat_food,       hh_id, 'Food & Dining'),
    (cat_groceries,  hh_id, 'Groceries'),
    (cat_subs,       hh_id, 'Subscriptions'),
    (cat_transfers,  hh_id, 'Transfers'),
    (cat_shopping,   hh_id, 'Shopping'),
    (cat_utilities,  hh_id, 'Utilities'),
    (cat_transport,  hh_id, 'Transport – Gas'),
    (cat_health,     hh_id, 'Health & Fitness'),
    (cat_donations,  hh_id, 'Donations'),
    (cat_income_pay, hh_id, 'Income – Paycheck'),
    (cat_income_ref, hh_id, 'Income – Refund');

  -- ── 3. TRANSACTIONS (92 rows) ──────────────────────────────
  -- USAA accounts (a0d731f2, 1f244a53) → Chase
  -- ICCU accounts (0f64fa73, 968df472) → Bre
  -- is_recurring=true for transactions entered from scheduled_templates (source=manual)

  -- USAA Checking (44 rows)
  INSERT INTO transactions
    (id, household_id, account_id, category_id, user_id, amount, description, transaction_date, is_recurring, created_at)
  VALUES
    ('01fdef94-7579-4f96-ba8b-ec29bbf4893f', hh_id, acc_usaa_chk, cat_subs,       chase_id,  -19.99, 'Fox One',                            '2026-06-15', true,  '2026-06-22 02:14:34+00'),
    ('0f6671a5-9ca8-4599-9cbb-947b0dfb66e2', hh_id, acc_usaa_chk, cat_food,       chase_id,  -30.71, 'Wendy''s',                           '2026-06-16', false, '2026-06-22 00:36:39+00'),
    ('1130d9d7-d162-45ad-86ec-4ee483f0d5bc', hh_id, acc_usaa_chk, cat_food,       chase_id,  -23.63, 'DD *DOORDASH MCDONAL',               '2026-06-17', false, '2026-06-22 00:36:39+00'),
    ('12585b42-3e58-410a-b117-1b39f9a75401', hh_id, acc_usaa_chk, cat_groceries,  chase_id,   -9.84, 'Broulim''s',                         '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('17402bbd-2c4c-4c3f-b1cd-56062d861e7a', hh_id, acc_usaa_chk, cat_food,       chase_id,   -3.81, '365 Retail Markets',                 '2026-06-18', false, '2026-06-22 00:36:39+00'),
    ('21116df2-adb3-47ad-90ff-6a43bde263bc', hh_id, acc_usaa_chk, cat_health,     chase_id,   -9.54, 'Walgreens',                          '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('22aa075f-4b76-4125-9a68-b0e4e8ec610f', hh_id, acc_usaa_chk, cat_food,       chase_id,   -8.48, 'Good Go',                            '2026-06-01', false, '2026-06-22 00:36:39+00'),
    ('309b5f2c-14cb-4846-b874-3459f51607ad', hh_id, acc_usaa_chk, cat_shopping,   chase_id,  -84.80, 'Kane Footwear',                      '2026-06-17', false, '2026-06-22 00:36:39+00'),
    ('3bd9e2e5-27ea-40e2-8c5d-3ebb6de6b39a', hh_id, acc_usaa_chk, cat_subs,       chase_id,   -2.07, 'Apple',                              '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('4e3d1daf-6c90-48a2-8eb0-a9edaf12932f', hh_id, acc_usaa_chk, cat_subs,       chase_id,   -7.94, 'Amazon Prime Membership',            '2026-06-01', false, '2026-06-22 00:36:39+00'),
    ('50b5c750-2cd9-43dc-ad74-bb7e59a6715d', hh_id, acc_usaa_chk, cat_groceries,  chase_id,  -64.35, 'Walmart',                            '2026-06-12', false, '2026-06-22 00:36:39+00'),
    ('56c77108-a9fb-4739-8250-2ace6530983b', hh_id, acc_usaa_chk, cat_transfers,  chase_id,  250.00, 'USAA Transfer',                      '2026-06-08', false, '2026-06-22 00:36:39+00'),
    ('5b2a08a6-ff69-4b8c-ab18-856deba70504', hh_id, acc_usaa_chk, cat_transfers,  chase_id,  104.30, 'Transfer from Cash App',             '2026-06-11', false, '2026-06-22 00:36:39+00'),
    ('5f484d53-2d65-440d-bd6b-f5d9147be414', hh_id, acc_usaa_chk, cat_transfers,  chase_id,   34.62, 'Transfer from Venmo',                '2026-06-09', false, '2026-06-22 00:36:39+00'),
    ('60f22131-0ac2-4203-b74e-23a1b51b0463', hh_id, acc_usaa_chk, cat_transfers,  chase_id,   24.00, 'USAA Transfer',                      '2026-06-11', false, '2026-06-22 00:36:39+00'),
    ('6f386072-4349-4e79-be0e-2c4a15ba4725', hh_id, acc_usaa_chk, cat_transfers,  chase_id,   70.00, 'Transfer from Venmo',                '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('6fc6804d-81f8-4dd8-a834-7d9c45ee11bc', hh_id, acc_usaa_chk, cat_subs,       chase_id,   -0.99, 'Apple',                              '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('7c7b18f2-683a-43f9-af22-c9169039f538', hh_id, acc_usaa_chk, cat_food,       chase_id,   -3.81, '365 Retail Markets',                 '2026-06-09', false, '2026-06-22 00:36:39+00'),
    ('7e47de8e-bc02-4ea0-b9c2-2d93271111fa', hh_id, acc_usaa_chk, cat_food,       chase_id,   -3.81, '365 Retail Markets',                 '2026-06-10', false, '2026-06-22 00:36:39+00'),
    ('7fdf0456-2945-460c-955b-1af4c9ac2a06', hh_id, acc_usaa_chk, cat_utilities,  chase_id, -150.00, 'Rocky Mountain Power',               '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('7fe1a5f6-a941-4119-b3c5-3742b300f0e2', hh_id, acc_usaa_chk, cat_food,       chase_id,  -22.10, 'Cafe Rio',                           '2026-06-08', false, '2026-06-22 00:36:39+00'),
    ('841b7d13-1313-40f4-8850-6960a49b7e17', hh_id, acc_usaa_chk, cat_donations,  chase_id, -220.00, 'Tithing Donation',                   '2026-06-16', false, '2026-06-22 00:36:39+00'),
    ('851ec4c7-407a-4ff2-8c1e-d96fc5f50412', hh_id, acc_usaa_chk, cat_subs,       chase_id,  -20.00, 'Claude Pro',                         '2026-06-03', true,  '2026-06-22 02:12:35+00'),
    ('8f33cafa-93f3-4681-8294-23d4e61e2ff7', hh_id, acc_usaa_chk, cat_food,       chase_id,   -4.11, 'Maverik',                            '2026-06-08', false, '2026-06-22 00:36:39+00'),
    ('923f57c4-7f8e-4165-9f44-6eed9b4be84d', hh_id, acc_usaa_chk, cat_transfers,  chase_id,    8.00, 'USAA Transfer',                      '2026-06-03', false, '2026-06-22 00:36:39+00'),
    ('9462e17d-2e42-42b5-99cf-182cc7847816', hh_id, acc_usaa_chk, cat_utilities,  chase_id, -350.34, 'Capital One Credit Card Payment',    '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('9a34e335-bb7e-49d9-915d-959631868801', hh_id, acc_usaa_chk, cat_transport,  chase_id,  -44.27, 'Maverik',                            '2026-06-05', false, '2026-06-22 00:36:39+00'),
    ('9ff6b483-a353-4009-b8c4-07906a7cade5', hh_id, acc_usaa_chk, cat_food,       chase_id,   -8.48, 'Good Go',                            '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('a83e57a8-2e1d-41fc-ab6f-64828c80acfe', hh_id, acc_usaa_chk, cat_shopping,   chase_id, -160.87, 'Klarna',                             '2026-06-17', false, '2026-06-22 00:36:39+00'),
    ('a8c255e3-c5fa-4ba8-b579-77b3ccff7fe7', hh_id, acc_usaa_chk, cat_transfers,  chase_id, -107.00, 'Transfer to Venmo Joey',             '2026-06-12', false, '2026-06-22 00:36:39+00'),
    ('ae91e346-34e1-4707-9f22-cf5b63b2809d', hh_id, acc_usaa_chk, cat_food,       chase_id,   -8.48, 'Good Go',                            '2026-06-10', false, '2026-06-22 00:36:39+00'),
    ('af01d1de-a394-4f00-bd1b-dcda83931722', hh_id, acc_usaa_chk, cat_groceries,  chase_id,  -55.35, 'Walmart',                            '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('b3062951-65b0-494b-8b1b-fabb90979fae', hh_id, acc_usaa_chk, cat_income_pay, chase_id,  942.34, 'USA Payroll',                        '2026-06-12', false, '2026-06-22 00:36:39+00'),
    ('bff208e5-8f1e-42a1-815e-756315d98c81', hh_id, acc_usaa_chk, cat_health,     chase_id,  -39.74, 'Bucked Up',                          '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('cce5b5f2-0d16-4219-bada-b8e5124c5702', hh_id, acc_usaa_chk, cat_subs,       chase_id,   -9.62, 'Youtube Premium',                    '2026-06-08', true,  '2026-06-22 02:13:26+00'),
    ('d0cd1377-803f-42ce-bbe8-81886bd7bf7b', hh_id, acc_usaa_chk, cat_shopping,   chase_id, -200.09, 'Affirm Payment for Eberlestock',     '2026-06-09', false, '2026-06-22 00:36:39+00'),
    ('d5e67668-f8fa-47f9-bd36-60c35d59248d', hh_id, acc_usaa_chk, cat_income_ref, chase_id,   41.95, 'Bucked Up Refund',                   '2026-06-17', false, '2026-06-22 00:36:39+00'),
    ('d743535e-e7ea-494c-9b4d-5b3d1d95f6bb', hh_id, acc_usaa_chk, cat_income_pay, chase_id,  400.25, 'USA Payroll',                        '2026-06-12', false, '2026-06-22 00:36:39+00'),
    ('df564cdf-38e0-4543-b5e4-6e9f63b8ed63', hh_id, acc_usaa_chk, cat_shopping,   chase_id, -200.08, 'Affirm Payment for Eberlestock',     '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('e84496fc-4a76-4ea2-b236-f0439a38dc2a', hh_id, acc_usaa_chk, cat_utilities,  chase_id,  -11.33, 'Intermountain Gas',                  '2026-06-21', true,  '2026-06-22 02:06:04+00'),
    ('e8d607f7-94f4-40f3-abfa-1860fda277a6', hh_id, acc_usaa_chk, cat_shopping,   chase_id,  -13.61, 'Exc Adv Dep',                        '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('ed82b1a7-73d3-4b22-a521-18f0b6fdca2b', hh_id, acc_usaa_chk, cat_transfers,  chase_id,   20.00, 'USAA Transfer',                      '2026-06-08', false, '2026-06-22 00:36:39+00'),
    ('f7bb8270-7d7e-48e3-9720-853e83dafae6', hh_id, acc_usaa_chk, cat_health,     chase_id,  -67.63, 'Bucked Up',                          '2026-06-15', false, '2026-06-22 00:36:39+00'),
    ('fe514fdc-20f8-4258-a26e-2aa5c281066b', hh_id, acc_usaa_chk, cat_shopping,   chase_id,  -15.89, 'Steam',                              '2026-06-04', false, '2026-06-22 00:36:39+00');

  -- USAA Savings (6 rows)
  INSERT INTO transactions
    (id, household_id, account_id, category_id, user_id, amount, description, transaction_date, is_recurring, created_at)
  VALUES
    ('34dc3646-9319-48f0-8370-d33295e349b6', hh_id, acc_usaa_sav, cat_transfers,  chase_id,  -20.00, 'USAA Funds Transfer',                '2026-06-08', false, '2026-06-22 00:38:01+00'),
    ('4ef6c644-e8f4-4fed-a919-ec23525bd5d7', hh_id, acc_usaa_sav, cat_income_ref, chase_id,  750.00, 'BYU Idaho',                          '2026-06-08', false, '2026-06-22 00:38:01+00'),
    ('96c6a8ba-1cdd-4be1-b001-c2eb1452664a', hh_id, acc_usaa_sav, cat_transfers,  chase_id,  -24.00, 'USAA Funds Transfer',                '2026-06-11', false, '2026-06-22 00:38:01+00'),
    ('c597f10c-5564-45ab-9078-e7eeb4061549', hh_id, acc_usaa_sav, cat_transfers,  chase_id, -250.00, 'USAA Funds Transfer',                '2026-06-08', false, '2026-06-22 00:38:01+00'),
    ('c64022a9-b92c-4e86-8f95-45468641aa9a', hh_id, acc_usaa_sav, cat_transfers,  chase_id,   50.00, 'Zelle Transfer from Breanna Gray',   '2026-06-03', false, '2026-06-22 00:38:01+00'),
    ('d7af758b-0e61-46a3-ba3d-8218043c3d01', hh_id, acc_usaa_sav, cat_transfers,  chase_id,   -8.00, 'USAA Funds Transfer',                '2026-06-03', false, '2026-06-22 00:38:01+00');

  -- ICCU Savings (7 rows) — Bre's paycheck account
  INSERT INTO transactions
    (id, household_id, account_id, category_id, user_id, amount, description, transaction_date, is_recurring, created_at)
  VALUES
    ('21f51b95-4f4e-44ce-9eae-97c16ef5f33e', hh_id, acc_iccu_sav, cat_income_pay, bre_id,   696.07, 'Salary/Regular Income from Walmart', '2026-06-02', false, '2026-06-22 00:42:01+00'),
    ('5cee94bf-004d-4977-a1ab-af726a3d60e2', hh_id, acc_iccu_sav, cat_transfers,  bre_id,  -250.00, 'Xfer To ICCU Checking',              '2026-06-17', false, '2026-06-22 00:42:01+00'),
    ('61b729f9-0ac1-4d92-aa6d-ffadad8cf2ee', hh_id, acc_iccu_sav, cat_transfers,  bre_id,  -500.00, 'Xfer To ICCU Checking',              '2026-06-03', false, '2026-06-22 00:42:01+00'),
    ('b955693f-6bc7-4f0c-a982-eec6b766a279', hh_id, acc_iccu_sav, cat_transfers,  bre_id,  -100.00, 'Xfer To ICCU Checking',              '2026-06-11', false, '2026-06-22 00:42:01+00'),
    ('c2f725e3-9a1c-4d98-8cc9-632944f75daa', hh_id, acc_iccu_sav, cat_transfers,  bre_id,  -250.00, 'Xfer To ICCU Checking',              '2026-06-20', false, '2026-06-22 00:42:01+00'),
    ('c45bdcf4-7587-451d-8946-d2ed494c44a6', hh_id, acc_iccu_sav, cat_transfers,  bre_id,  -200.00, 'Xfer To ICCU Checking',              '2026-06-21', false, '2026-06-22 00:42:01+00'),
    ('d276acaf-bc82-460b-ba17-e5781023507e', hh_id, acc_iccu_sav, cat_income_pay, bre_id,   842.14, 'Salary/Regular Income from Walmart', '2026-06-16', false, '2026-06-22 00:42:01+00');

  -- ICCU Checking (35 rows) — Bre's spending account
  INSERT INTO transactions
    (id, household_id, account_id, category_id, user_id, amount, description, transaction_date, is_recurring, created_at)
  VALUES
    ('04f16b98-a466-4833-88f3-4b9b3f12ec4c', hh_id, acc_iccu_chk, cat_transfers,  bre_id,   200.00, 'Xfer From ICCU Savings',             '2026-06-21', false, '2026-06-22 00:43:04+00'),
    ('1f8ff538-1334-4f7d-b3dd-a3911ed1e4bf', hh_id, acc_iccu_chk, cat_groceries,  bre_id,   -59.24, 'Walmart',                            '2026-06-21', false, '2026-06-22 00:43:04+00'),
    ('287483c9-f8c6-4403-9701-0c00cc74684e', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -3.74, 'Walmart',                            '2026-06-09', false, '2026-06-22 00:43:04+00'),
    ('3e18c50f-502d-483d-80a9-0983abf24695', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -5.88, 'Walmart',                            '2026-06-18', false, '2026-06-22 00:43:04+00'),
    ('3f97a816-09c9-4a80-b238-ae64f984c816', hh_id, acc_iccu_chk, cat_shopping,   bre_id,  -133.21, 'Scheels All Sports',                 '2026-06-06', false, '2026-06-22 00:43:04+00'),
    ('41ab0153-7eb4-4f3d-8314-3244d51022c2', hh_id, acc_iccu_chk, cat_transfers,  bre_id,   -50.00, 'ZELLE – Hubby',                      '2026-06-03', false, '2026-06-22 00:43:04+00'),
    ('45160a22-5731-44b9-bc60-47b71124c053', hh_id, acc_iccu_chk, cat_transfers,  bre_id,    15.00, 'Transfer from Elevations Credit Union','2026-06-03', false, '2026-06-22 00:43:04+00'),
    ('455c38d7-2256-467a-a7e2-60638ac4a56f', hh_id, acc_iccu_chk, cat_food,       bre_id,    -8.48, 'Good2go',                            '2026-06-13', false, '2026-06-22 00:43:04+00'),
    ('48b3a4a4-b49a-4e7d-9b3d-cef5e34e2b9c', hh_id, acc_iccu_chk, cat_transfers,  bre_id,   250.00, 'Xfer From ICCU Savings',             '2026-06-20', false, '2026-06-22 00:43:04+00'),
    ('49642392-0563-4500-a3d9-0999ad124cf9', hh_id, acc_iccu_chk, cat_food,       bre_id,   -43.41, 'Jersey Mike''s Subs',                '2026-06-17', false, '2026-06-22 00:43:04+00'),
    ('4b3c919a-b744-4065-a219-89891c8bcaea', hh_id, acc_iccu_chk, cat_food,       bre_id,    -8.48, 'Good2go',                            '2026-06-17', false, '2026-06-22 00:43:04+00'),
    ('50d6bfb3-436d-4aea-ac05-5a706f2a5d1c', hh_id, acc_iccu_chk, cat_transport,  bre_id,   -47.49, 'Costco Gas Stations',                '2026-06-06', false, '2026-06-22 00:43:04+00'),
    ('5fcdba7f-4aac-4472-9f16-6c23e824ddd1', hh_id, acc_iccu_chk, cat_transfers,  bre_id,   100.00, 'Xfer From ICCU Savings',             '2026-06-11', false, '2026-06-22 00:43:04+00'),
    ('64ff4390-b2e4-47d4-93db-d7a3fbcf1023', hh_id, acc_iccu_chk, cat_food,       bre_id,    -6.34, 'Maverik',                            '2026-06-04', false, '2026-06-22 00:43:04+00'),
    ('660d1058-beb2-458a-b95a-795c5527916a', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -5.47, 'Walmart',                            '2026-06-12', false, '2026-06-22 00:43:04+00'),
    ('6ed4fcc9-9d30-4ce6-822d-8ba37f425601', hh_id, acc_iccu_chk, cat_shopping,   bre_id,  -147.00, 'Vagaro Tattoo',                      '2026-06-11', false, '2026-06-22 00:43:04+00'),
    ('8267fd46-584c-4b7c-b145-10d529825aa3', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -3.65, 'Walmart',                            '2026-06-17', false, '2026-06-22 00:43:04+00'),
    ('8f6317fe-4e4c-452c-a15c-69cb82f5c597', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -3.12, 'Walmart',                            '2026-06-19', false, '2026-06-22 00:43:04+00'),
    ('8fdf6c60-8a91-498b-b199-c12225bb2a35', hh_id, acc_iccu_chk, cat_shopping,   bre_id,   -86.66, 'Deseret Book',                       '2026-06-17', false, '2026-06-22 00:43:04+00'),
    ('99e52edc-715c-4f31-bcd0-b1d5f8184d4a', hh_id, acc_iccu_chk, cat_groceries,  bre_id,   -17.28, 'Walmart',                            '2026-06-19', false, '2026-06-22 00:43:04+00'),
    ('a493c1cf-d771-4e31-a952-17c90ec19aff', hh_id, acc_iccu_chk, cat_groceries,  bre_id,  -272.21, 'Costco',                             '2026-06-20', false, '2026-06-22 00:43:04+00'),
    ('a8620351-fb14-4feb-90d8-56dc59953ae9', hh_id, acc_iccu_chk, cat_transfers,  bre_id,   250.00, 'Xfer From ICCU Savings',             '2026-06-17', false, '2026-06-22 00:43:04+00'),
    ('a92a69bf-c7af-431b-af9f-f91bdda7f87a', hh_id, acc_iccu_chk, cat_transfers,  bre_id,   500.00, 'Xfer From ICCU Savings',             '2026-06-03', false, '2026-06-22 00:43:04+00'),
    ('b2dee4c0-52e6-48f9-8d58-aa6fcd11d4fc', hh_id, acc_iccu_chk, cat_food,       bre_id,   -30.29, 'Mo'' Bettahs',                       '2026-06-09', false, '2026-06-22 00:43:04+00'),
    ('b44a5a1f-cfda-4fc6-a960-dcd581870840', hh_id, acc_iccu_chk, cat_food,       bre_id,   -15.90, 'Chipotle Mexican Grill',             '2026-06-12', false, '2026-06-22 00:43:04+00'),
    ('d0534c8a-49a0-4de4-a3cf-bd7d7cfdc2e4', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -6.78, 'Walmart',                            '2026-06-16', false, '2026-06-22 00:43:04+00'),
    ('dd55edf4-efe5-4ace-a967-280bc39a052b', hh_id, acc_iccu_chk, cat_groceries,  bre_id,   -87.50, 'Costco',                             '2026-06-07', false, '2026-06-22 00:43:04+00'),
    ('e57ce2cc-2834-4156-8822-c06d95b38e44', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -7.59, 'Walmart',                            '2026-06-15', false, '2026-06-22 00:43:04+00'),
    ('e61b9a6f-a7b8-4753-a6df-9fa8b9549ada', hh_id, acc_iccu_chk, cat_groceries,  bre_id,   -27.52, 'WAL-MART #1878',                     '2026-06-21', false, '2026-06-22 00:43:04+00'),
    ('e66178d2-fcea-4391-b889-fffa0de5e91f', hh_id, acc_iccu_chk, cat_food,       bre_id,    -3.45, 'ExxonMobil',                         '2026-06-17', false, '2026-06-22 00:43:04+00'),
    ('edb2ccc9-6019-4650-8f5d-82bd7dc8eceb', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -5.30, 'Walmart',                            '2026-06-16', false, '2026-06-22 00:43:04+00'),
    ('ef316546-58d8-4e1e-9199-94ca1a4ebe5f', hh_id, acc_iccu_chk, cat_shopping,   bre_id,   -37.86, 'Amazon',                             '2026-06-19', false, '2026-06-22 00:43:04+00'),
    ('ef974f71-b24f-4b8d-b12b-11c635074402', hh_id, acc_iccu_chk, cat_food,       bre_id,   -34.16, 'In-N-Out',                           '2026-06-04', false, '2026-06-22 00:43:04+00'),
    ('f96b096b-e3ab-4019-9cd9-6fc9c54c468d', hh_id, acc_iccu_chk, cat_groceries,  bre_id,    -6.10, 'Walmart',                            '2026-06-19', false, '2026-06-22 00:43:04+00'),
    ('fe3b2f3d-61a9-403c-827e-bd2e8217c21a', hh_id, acc_iccu_chk, cat_groceries,  bre_id,   -21.47, 'Costco',                             '2026-06-07', false, '2026-06-22 00:43:04+00');

  -- ── 4. PANTRY ITEMS (63 rows) ──────────────────────────────
  -- Chase's items (47 rows)
  INSERT INTO pantry_items
    (id, household_id, user_id, name, category, quantity, price, expiration_date, barcode, store, created_at)
  VALUES
    ('085b2ca6-b9d1-4172-9540-b7057f2e216b', hh_id, chase_id, 'Gluten Free Brioche – Franz',                          'Grains & Pasta',  1, 9.89,  '2026-07-14', '072220000054', 'Costco',    '2026-06-20 18:00:49+00'),
    ('11344bfc-70c4-406e-86e9-be6248f8f2f9', hh_id, chase_id, 'Monster Energy White Zero Sugar Ultra',                'Beverages',       1, 29.26, '2026-08-01', '070847891291', 'Amazon',    '2026-06-21 01:01:26+00'),
    ('165bc1c7-743f-475d-b1da-97c902e9471d', hh_id, chase_id, 'Mayonnaise – Best Foods',                              'Condiments',      1, 9.99,  '2027-02-04', '048001516519', 'Costco',    '2026-06-20 17:52:57+00'),
    ('1b68789a-d77f-4494-b302-5770a1dafeb8', hh_id, chase_id, 'Reduced Fat Sausage Patties – Tyson',                  'Meat & Seafood',  1, 15.79, '2026-09-23', '023700013545', 'Costco',    '2026-06-20 17:53:50+00'),
    ('1b817c46-a328-4e89-9d2b-f3881c0766f2', hh_id, chase_id, 'Organic Bananas',                                      'Produce',         1, 2.19,  '2026-07-04', '1711411111252','Costco',    '2026-06-20 16:37:53+00'),
    ('22e511b1-9cd9-4bb6-8e6e-13406d7545d6', hh_id, chase_id, '100% Orange Juice – Tropicana',                        'Beverages',       1, 9.00,  '2026-07-19', '048500018330', 'Walmart',   '2026-06-20 14:28:12+00'),
    ('286dc536-52a7-4c6e-bcd4-3f31d97a24fd', hh_id, chase_id, 'All Natural Romano Cheese – Belgioioso',               'Dairy',           1, 4.00,  '2027-01-09', '031142526752', 'Broulim''s','2026-06-20 14:33:30+00'),
    ('330e6cc0-7f38-4318-b6e8-3bc645624928', hh_id, chase_id, 'Monster Energy Strawberry Shot Sugar Free',            'Beverages',       1, 31.48, '2026-08-01', '070847899839', 'Amazon',    '2026-06-21 01:00:18+00'),
    ('33bc1d9f-630a-437f-b8fb-070a136fe3e4', hh_id, chase_id, 'Bread & Butter Chips – Mt. Olive',                     'Canned & Jarred', 1, 6.00,  '3035-02-01', '009300000772', 'Walmart',   '2026-06-20 14:35:59+00'),
    ('344b7060-cc43-4674-818e-dedacf645896', hh_id, chase_id, 'Honey Bunches of Oats with Almonds – Post',            'Grains & Pasta',  1, 8.00,  '2027-03-04', '884912356321', 'Sam''s Club','2026-06-20 14:07:44+00'),
    ('3bc9f041-e8b9-43bf-b2e7-81d0310a0be2', hh_id, chase_id, 'Crispy Creamy Wafer (Strawberry/Blueberry) – Nature Valley','Snacks',    1, 12.00, '2026-11-11', '016000234833', 'Costco',    '2026-06-20 14:01:15+00'),
    ('41c97967-185b-4255-b144-c5e6652efa16', hh_id, chase_id, 'Large Carrots 2lbs',                                   'Produce',         1, 2.26,  '2026-07-11', NULL,           'Walmart',   '2026-06-22 13:46:36+00'),
    ('4855c839-07c2-4518-85b0-a74418476162', hh_id, chase_id, 'Buttery Steakhouse Salmon – Inland Market',            'Meat & Seafood',  1, 21.69, '2027-01-28', '615433330732', 'Costco',    '2026-06-20 17:55:55+00'),
    ('4af86826-6805-450b-974e-b6afcc1e0746', hh_id, chase_id, 'Birthday Cake – Drizzliscious',                        'Snacks',          1, 2.32,  '2027-03-07', '850079592247', 'Walmart',   '2026-06-20 13:53:55+00'),
    ('4fa6c482-bcb7-48df-b4cc-704538b65be2', hh_id, chase_id, 'Reduced Fat Ultra-Filtered Milk – Fairlife',           'Dairy',           1, 8.00,  '2026-08-09', '856312002771', 'Walmart',   '2026-06-20 14:18:23+00'),
    ('505c5cee-c96c-4735-9103-f7f54cf1e238', hh_id, chase_id, 'Raspberry Fig Bars GF',                                'Snacks',          1, 5.97,  NULL,         NULL,           'Walmart',   '2026-06-22 13:51:20+00'),
    ('523527cb-2106-444c-bc59-8a3e55d1f7da', hh_id, chase_id, '100% Lemon Juice – Realemon',                          'Condiments',      1, 3.00,  '2027-02-13', '014800582239', 'Walmart',   '2026-06-20 14:20:29+00'),
    ('58344cc6-ad68-4c24-ac6e-bb6dd41e6bee', hh_id, chase_id, 'Organic Greek Yogurt Plain – Kirkland Signature',      'Dairy',           1, 8.00,  '2026-07-08', '096619483556', 'Costco',    '2026-06-20 14:29:29+00'),
    ('58f1a46a-0ef0-4549-bf16-ab939873c491', hh_id, chase_id, 'Jalapeño & Garlic Hand Stuffed Greek Olives – Member''s Mark','Canned & Jarred',1,8.00,'2026-07-16','193968135461','Costco',   '2026-06-20 14:36:49+00'),
    ('5df1d965-a9c4-4894-9e79-e9ee28b03d1b', hh_id, chase_id, 'Slow Roasted Turkey Breast – Hillshire Farm',          'Meat & Seafood',  1, 8.99,  '2026-07-13', '044500201376', 'Costco',    '2026-06-20 17:59:10+00'),
    ('62fa2cae-404f-4807-a3f3-c339d7a8d042', hh_id, chase_id, 'Purified Drinking Water – Kirkland Signature',         'Beverages',       1, 3.99,  '2026-08-01', '096619756803', 'Costco',    '2026-06-21 01:26:20+00'),
    ('635e9939-8e41-42a0-93c2-6a18af4f2676', hh_id, chase_id, 'Black Peppercorn Grinder',                             'Condiments',      1, 4.00,  NULL,         '193968356170', 'Sam''s Club','2026-06-20 14:10:10+00'),
    ('671e3275-da46-4410-a2a9-33e953e42215', hh_id, chase_id, 'Extra Variety Gum Packet',                             'Snacks',          1, 17.99, '2027-06-20', '022000331243', 'Costco',    '2026-06-20 17:55:09+00'),
    ('6e1a0d10-b27c-47fd-b59a-a0423d0b957f', hh_id, chase_id, 'Dark Sweet Cherries',                                  'Produce',         1, 5.29,  '2026-07-04', '042188240458', 'Costco',    '2026-06-20 17:52:01+00'),
    ('7624a81f-3c6c-4296-ac1e-81474253747b', hh_id, chase_id, 'BBQ Sauce Hickory Brown Sugar – Kinder''s',            'Condiments',      1, 97.59, '2028-05-03', '755795758260', 'Costco',    '2026-06-20 17:58:10+00'),
    ('7cf66072-6042-4966-91c3-31406d537e77', hh_id, chase_id, 'Refried Beans',                                        'Canned & Jarred', 1, 12.89, '2028-03-08', '044300000124', 'Costco',    '2026-06-20 17:57:18+00'),
    ('87fdd91f-ddfc-4d1a-aef3-6dbba4431f82', hh_id, chase_id, 'Shredded Mexican-Style Blend Cheese – Kirkland Signature','Dairy',        1, 8.00,  '2026-10-26', '096619362776', 'Costco',    '2026-06-20 14:32:43+00'),
    ('9e23e8e3-799f-40ad-abf8-ae06ce3a07db', hh_id, chase_id, 'Organic Cilantro & Lime Rice – Rizza''s Global Grains','Grains & Pasta',  1, 8.00,  '2028-01-14', '195893170920', 'Costco',    '2026-06-20 14:02:04+00'),
    ('a106f332-ae36-4c50-ad01-42fca04ef456', hh_id, chase_id, 'Gushers Variety Pack – Gushers',                       'Snacks',          1, 7.89,  '2027-03-24', '016000146983', 'Costco',    '2026-06-20 17:42:09+00'),
    ('a3b6db78-f16f-4211-8301-6f55ff0c7790', hh_id, chase_id, '100% Whole Wheat',                                     'Grains & Pasta',  1, 4.59,  '2026-06-27', '831201003336', 'Costco',    '2026-06-20 18:01:54+00'),
    ('a59d7a6a-d7f7-40fc-9ac8-f0329db4cdb5', hh_id, chase_id, 'Small Hass Avocados 5–6 Count Bag',                    'Produce',         2, 3.48,  '2026-07-11', NULL,           'Walmart',   '2026-06-22 13:50:52+00'),
    ('ab8910c1-4294-4b03-a05f-84505975a6b8', hh_id, chase_id, 'Sweet Cream Butter Salted – Great Value',              'Dairy',           1, 4.00,  '2026-11-10', '078742016030', 'Walmart',   '2026-06-20 14:30:13+00'),
    ('ac33f4e0-f148-4e7b-a334-c8ae7166486d', hh_id, chase_id, 'G2G Protein Bars – Grab & Go',                         'Snacks',          1, 8.00,  '2027-01-14', '857064007090', 'Costco',    '2026-06-20 14:30:49+00'),
    ('b53d1e4a-5f46-4709-aef1-b1ac1249cbad', hh_id, chase_id, 'Cheez-It White Cheddar 67.5oz – Sunshine',             'Snacks',          1, 8.00,  '2027-01-04', '024100108930', 'Sam''s Club','2026-06-20 14:05:50+00'),
    ('b81fe52f-907f-4630-b397-c8cada6bfe40', hh_id, chase_id, 'Ground Beef – Kirkland',                               'Meat & Seafood',  1, 24.69, '2026-06-26', '196633881243', 'Costco',    '2026-06-20 17:50:33+00'),
    ('b8ba7792-5006-44db-a32a-fa3f3650bba7', hh_id, chase_id, 'Original Teriyaki Marinade & Sauce – Kikkoman',        'Condiments',      1, 3.00,  '2026-12-14', '041390010309', 'Walmart',   '2026-06-20 14:22:55+00'),
    ('c002c599-419f-4c44-8d0f-7c3e0c9508db', hh_id, chase_id, 'Swiss Natural Cheese – Tillamook',                     'Dairy',           1, 10.59, '2026-11-08', '072830008099', 'Costco',    '2026-06-20 18:03:06+00'),
    ('cc6cc88c-63a8-4d25-a800-6780f2b262b4', hh_id, chase_id, 'Sourdough – Franz',                                    'Grains & Pasta',  1, 9.89,  '2026-08-03', '072220010244', 'Costco',    '2026-06-20 18:01:19+00'),
    ('d8e25905-78a7-403f-9fbb-abe5075c6934', hh_id, chase_id, 'Country Kitchen Original Syrup',                       'Condiments',      1, 3.00,  '2026-12-18', '644202001115', 'Broulim''s','2026-06-20 13:57:15+00'),
    ('e1f09829-82e9-47bc-9b0b-43077b5fb425', hh_id, chase_id, 'American Grana Extra Aged Parmesan – BelGioioso',      'Dairy',           1, 4.00,  '2027-02-10', '031142379259', 'Broulim''s','2026-06-20 14:34:09+00'),
    ('e3d2909f-54f3-4c03-99b2-67e65d925fc7', hh_id, chase_id, 'Mini Tacos – MegaMex Foods',                           'Frozen',          1, 11.89, '2026-07-11', '027086175101', 'Costco',    '2026-06-20 17:42:47+00'),
    ('e7ead280-0750-4f2a-a685-5d6997f021af', hh_id, chase_id, 'Organic Quinoa & Brown Rice with Garlic – Seeds of Change','Grains & Pasta',1,12.00,'2027-06-20','748404420238','Costco',     '2026-06-20 14:03:15+00'),
    ('ea73acc1-4acc-4d2c-9052-f233b101a1d0', hh_id, chase_id, 'Real Mayonnaise – Smash Kitchen',                      'Condiments',      1, 4.00,  '2026-10-26', '850068174065', 'Walmart',   '2026-06-20 14:21:27+00'),
    ('ee4884f9-7f6f-4e51-8beb-8dc47616824d', hh_id, chase_id, 'Chicken Breasts',                                      'Meat & Seafood',  1, 24.02, NULL,         '247735324029', 'Costco',    '2026-06-20 17:49:00+00'),
    ('f66bc558-1a12-4c43-9f10-cd169f4d5444', hh_id, chase_id, 'Yellow Mustard – Heinz',                               'Condiments',      1, 2.00,  '2027-07-07', '013000000987', 'Sam''s Club','2026-06-20 14:19:30+00'),
    ('fbf991be-7a09-4ef0-8d34-dd8dde2b6ca1', hh_id, chase_id, 'Supreme Cauliflower Crust Pizza – Kirkland Signature', 'Frozen',          1, 11.99, '2027-06-03', '096619031955', 'Costco',    '2026-06-20 17:56:35+00'),
    ('fdc276d1-9e6d-4856-82de-73be4465c686', hh_id, chase_id, 'Sweet Potato – Bako',                                  'Produce',         1, 6.00,  '2026-07-20', '819614010165', 'Costco',    '2026-06-20 14:11:54+00');

  -- Bre's items (16 rows)
  INSERT INTO pantry_items
    (id, household_id, user_id, name, category, quantity, price, expiration_date, barcode, store, created_at)
  VALUES
    ('041ddf6d-2954-4775-bf07-e1ce5ab833cc', hh_id, bre_id, 'Organic Sweet Potato Fries – R House',               'Frozen',          1, 6.96,  NULL,         '628514001407', 'Costco',    '2026-06-20 14:01:14+00'),
    ('05beca46-765f-46b0-a9ec-e45c8582d338', hh_id, bre_id, 'Double Chocolate Muffins – Veggies Made Great',      'Frozen',          1, 3.00,  NULL,         '704863028187', 'Walmart',   '2026-06-20 14:04:11+00'),
    ('0e0dd426-f093-40f1-8873-04bf037fffcb', hh_id, bre_id, 'ZBAR – CLIF Kid',                                    'Snacks',          1, 15.19, '2026-08-01', '722252702067', 'Costco',    '2026-06-20 17:50:45+00'),
    ('14fc1f1f-1ef2-4c88-a245-45f6c9699fa3', hh_id, bre_id, 'Blackened Salmon 2 Fillets',                         'Meat & Seafood',  1, 6.00,  '2026-09-25', NULL,           'Costco',    '2026-06-20 14:02:56+00'),
    ('454deace-9743-41e1-bb75-2c7d2ea5cd04', hh_id, bre_id, 'Sauerkraut – Wildbrine',                             'Condiments',      1, 6.39,  '2026-08-01', '858159002532', 'Costco',    '2026-06-20 17:53:30+00'),
    ('4f7e983c-1e9d-4295-bafb-6d329dd2735e', hh_id, bre_id, 'Beddar with Cheddar – Johnsonville',                 'Meat & Seafood',  1, 2.00,  '2026-12-11', '077782023930', 'Walmart',   '2026-06-20 14:04:42+00'),
    ('4fe2a773-d272-42a9-8345-ec59e5f427fd', hh_id, bre_id, 'Ground Beef Chuck – Cargill',                        'Meat & Seafood',  1, 5.00,  NULL,         '078742123134', NULL,        '2026-06-20 14:05:37+00'),
    ('55d40611-2767-4962-a922-51b5ded3a39c', hh_id, bre_id, 'Gushers Variety Pack – Gushers',                     'Snacks',          1, 7.89,  '2026-08-01', '016000146983', 'Costco',    '2026-06-20 17:49:02+00'),
    ('668c31cb-c49c-48ad-aaa4-2abed9871842', hh_id, bre_id, 'Super Premium Vanilla Ice Cream – Kirkland Signature','Frozen',         1, 6.90,  NULL,         '096619207640', 'Costco',    '2026-06-20 14:02:14+00'),
    ('73dc8086-bc60-4c4a-808b-bfd01b5ad730', hh_id, bre_id, 'Orange Juice – Great Value',                         'Frozen',          1, 2.00,  NULL,         '078742371672', 'Walmart',   '2026-06-20 14:01:48+00'),
    ('889f6bb3-0125-42f1-9bf8-48b17ed2fa4f', hh_id, bre_id, 'Protein Blend Strawberry Banana – Wyman''s',        'Frozen',          1, 7.00,  NULL,         '079900005576', 'Sam''s Club','2026-06-20 14:05:50+00'),
    ('8bd24b93-d51e-4a71-8d3b-c1e030d03e74', hh_id, bre_id, 'Tomatoes – Sunset',                                  'Produce',         1, 6.59,  '2026-07-04', '057836020825', 'Costco',    '2026-06-20 17:47:23+00'),
    ('8cc614f0-d902-42bf-bf86-8a4f8ac72769', hh_id, bre_id, 'Andouille Smoked Sausage – Johnsonville',            'Meat & Seafood',  1, 3.00,  NULL,         '077782026979', 'Walmart',   '2026-06-20 14:05:07+00'),
    ('94785eaf-8d70-4eb9-aac7-9a7e0fa7b8f7', hh_id, bre_id, 'Light & Fit Flavored Greek Yogurt – Light + Fit',   'Dairy',           1, 6.00,  '2026-07-19', '036632032737', 'Walmart',   '2026-06-20 14:28:51+00'),
    ('d8b5e806-ea3a-4be3-bf6e-e1a8aac9a70b', hh_id, bre_id, 'Strawberries – Well Pict',                           'Produce',         1, 5.99,  '2026-07-04', '780353784047', 'Costco',    '2026-06-20 17:52:50+00'),
    ('ef621cc9-3263-45bd-8885-17be90cffb3f', hh_id, bre_id, 'Original Premium Sausage – Great Value',             'Meat & Seafood',  1, 3.50,  NULL,         '078742054780', 'Walmart',   '2026-06-20 14:03:20+00');

  -- ── 5. SHOPPING SUGGESTIONS (5 rows) ───────────────────────
  INSERT INTO shopping_suggestions (id, household_id, name, category, added_by, is_checked, created_at) VALUES
    ('00bc2707-893e-4a0c-b0b7-f29276560d19', hh_id, 'Himalayan Pink Salt – Member''s Mark', 'Other',          bre_id,   false, '2026-06-20 14:08:44+00'),
    ('1956de6e-9df9-4224-8dee-e997ed347073', hh_id, '100% Whole Wheat',                      'Grains & Pasta', chase_id, false, '2026-06-25 19:53:20+00'),
    ('428c91b9-40f3-49c0-ac14-0b5bd5df43e2', hh_id, 'Organic Classic Tomato Ketchup – Smash Kitchen', 'Condiments', chase_id, false, '2026-06-20 14:17:37+00'),
    ('4ae14968-8200-4b87-b75e-57f663f104ee', hh_id, 'Great Value Granulated Garlic 26oz',   'Other',          chase_id, false, '2026-06-20 13:52:41+00'),
    ('f375cb4e-2bda-4ae7-b00d-616ca6cfedaf', hh_id, 'Ground Beef – Kirkland',               'Meat & Seafood', chase_id, false, '2026-06-25 19:53:20+00');

  RAISE NOTICE 'Migration complete: 4 accounts, 11 categories, 92 transactions, 63 pantry items, 5 shopping suggestions';
END;
$migration$;
