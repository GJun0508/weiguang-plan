# Shared Donation Sky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each simulated donation create a star that is visible to every visitor in real time, while retaining a local fallback when the shared service is unavailable.

**Architecture:** GitHub Pages remains the static host. A Supabase Free project holds constrained public `donation_stars` rows and publishes inserted rows through Postgres Changes. A small browser adapter owns Supabase I/O; `donation.js` owns the existing UI, animation, and fallback storage.

**Tech Stack:** Plain HTML/CSS/JavaScript, Supabase JavaScript CDN v2, Supabase Postgres + Realtime, Python `unittest`, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-23-shared-sky-design.md`

## Global Constraints

- Keep GitHub Pages as the public host and use only the Supabase Free plan.
- Do not collect or write payment credentials, contact details, payment receipts, or the Supabase service-role key.
- The visible label defaults to `匿名微光`; a provided label is capped at 24 characters in the database.
- Store only three existing project labels, an integer amount from 1 to 999999, normalized star coordinates, timestamps, and non-identifying IDs.
- Retain the local `localStorage` experience as a non-blocking fallback when the shared service fails or is paused.
- Load and render no more than the latest 80 remote stars on initial page load.

## Review Focus

- Missing or placeholder Supabase configuration: the donation flow still animates and saves a local fallback star.
- A remote row matching a just-created `client_id`: the canvas shows exactly one diamond, not a duplicate.
- A remote row with a disallowed project, oversized label, or out-of-range coordinates: database constraints reject it.
- A remote insert from another browser: it appears without a reload and pulses once without launching from the local button.
- A page refreshed while the free project is paused or offline: existing stars remain visible and the site stays interactive.

---

### Task 1: Define and test the shared-star data contract

**Files:**
- Create: `supabase/donation_stars.sql`
- Create: `supabase-config.js`
- Create: `work/test_realtime_sky.py`

**Interfaces:**
- Produces: `window.WEIGUANG_SUPABASE_CONFIG` with `url` and `publishableKey` strings.
- Produces: a SQL script that creates `public.donation_stars` and enables a public insert/select-only Realtime feed.
- Consumes: the three project values in `index.html`.

- [ ] **Step 1: Write failing contract tests**

```python
def test_sql_limits_public_star_fields():
    sql = (ROOT / "supabase/donation_stars.sql").read_text()
    self.assertIn("create table public.donation_stars", sql)
    self.assertIn("client_id uuid not null unique", sql)
    self.assertIn("amount integer not null check (amount between 1 and 999999)", sql)
    self.assertIn("alter table public.donation_stars enable row level security", sql)
    self.assertIn("alter publication supabase_realtime add table public.donation_stars", sql)

def test_public_config_has_no_privileged_key():
    config = (ROOT / "supabase-config.js").read_text().lower()
    self.assertIn("publishablekey", config)
    self.assertNotIn("service_role", config)
```

- [ ] **Step 2: Run the contract tests to verify they fail**

Run: `python3 -m unittest work/test_realtime_sky.py -v`

Expected: FAIL because the SQL and configuration files do not yet exist.

- [ ] **Step 3: Add the SQL schema and access controls**

Create `supabase/donation_stars.sql` with this schema shape. Keep the three `project` values exactly aligned with the radio input values in `index.html`.

```sql
create table public.donation_stars (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique,
  amount integer not null check (amount between 1 and 999999),
  project text not null check (project in (
    '读到世界 · 乡村阅读',
    '水往低处流 · 清洁饮水',
    '手上有光 · 女性生计'
  )),
  anonymous_label text not null default '匿名微光'
    check (char_length(anonymous_label) between 1 and 24),
  x numeric not null check (x between 0.18 and 0.86),
  y numeric not null check (y between 0.10 and 0.52),
  created_at timestamptz not null default now()
);

alter table public.donation_stars enable row level security;
grant select, insert on public.donation_stars to anon;

create policy "public can read shared donation stars"
on public.donation_stars for select to anon using (true);

create policy "public can insert valid simulated donation stars"
on public.donation_stars for insert to anon with check (true);

alter publication supabase_realtime add table public.donation_stars;
```

Create `supabase-config.js` with empty string defaults and a short comment that only the publishable key belongs in the browser.

```js
window.WEIGUANG_SUPABASE_CONFIG = {
  url: '',
  publishableKey: '',
};
```

- [ ] **Step 4: Run the contract tests to verify they pass**

Run: `python3 -m unittest work/test_realtime_sky.py -v`

Expected: PASS.

- [ ] **Step 5: Commit the contract artifacts**

```bash
git add supabase/donation_stars.sql supabase-config.js work/test_realtime_sky.py
git commit -m "feat: define shared donation star schema"
```

### Task 2: Add a focused Supabase browser adapter

**Files:**
- Create: `shared-stars.js`
- Modify: `index.html:83-85`
- Modify: `work/test_realtime_sky.py`

**Interfaces:**
- Consumes: `window.supabase.createClient`, `window.WEIGUANG_SUPABASE_CONFIG`.
- Produces: `window.sharedDonationStars`.
- `loadLatest() -> Promise<Array<SharedStar>>`
- `publish(star: LocalStar) -> Promise<SharedStar>`
- `subscribe(onInsert: (star: SharedStar) => void) -> () => void`
- `isConfigured() -> boolean`

- [ ] **Step 1: Extend tests with the adapter's public API**

```python
def test_shared_star_adapter_uses_publishable_client_and_insert_subscription():
    script = (ROOT / "shared-stars.js").read_text()
    self.assertIn("window.sharedDonationStars", script)
    self.assertIn("createClient", script)
    self.assertIn("donation_stars", script)
    self.assertIn("postgres_changes", script)
    self.assertIn("event: 'INSERT'", script)
    self.assertNotIn("service_role", script.lower())

def test_page_loads_supabase_before_donation_logic():
    html = (ROOT / "index.html").read_text()
    self.assertLess(html.index("@supabase/supabase-js@2"), html.index("donation.js"))
    self.assertLess(html.index("shared-stars.js"), html.index("donation.js"))
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `python3 -m unittest work/test_realtime_sky.py -v`

Expected: FAIL because the adapter and script tags do not exist.

- [ ] **Step 3: Implement `shared-stars.js` as the only Supabase I/O boundary**

Use this conversion boundary so `donation.js` stays in camelCase while Supabase rows remain snake_case.

```js
const toSharedStar = (row) => ({
  id: row.id,
  clientId: row.client_id,
  amount: Number(row.amount),
  project: row.project,
  anonymousLabel: row.anonymous_label,
  x: Number(row.x),
  y: Number(row.y),
  createdAt: row.created_at,
});

const toRow = (star) => ({
  client_id: star.clientId,
  amount: star.amount,
  project: star.project,
  anonymous_label: star.anonymousLabel,
  x: star.x,
  y: star.y,
});
```

`isConfigured()` must return false when either configuration value is empty. In that state, `loadLatest()` resolves to `[]`, `publish()` rejects with `new Error('Shared sky is not configured')`, and `subscribe()` returns a no-op unsubscribe function.

When configured, create the client with `{ auth: { persistSession: false, autoRefreshToken: false } }`; select newest rows with `.order('created_at', { ascending: false }).limit(80)`; subscribe only to `INSERT` events for `public.donation_stars`; and make the returned cleanup call `supabase.removeChannel(channel)`.

Update `index.html` to load these scripts in exactly this order before `donation.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="shared-stars.js"></script>
<script src="donation.js"></script>
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `python3 -m unittest work/test_realtime_sky.py -v`

Expected: PASS.

- [ ] **Step 5: Commit the browser adapter**

```bash
git add index.html shared-stars.js work/test_realtime_sky.py
git commit -m "feat: add shared star client adapter"
```

### Task 3: Merge real-time stars with the existing animated sky

**Files:**
- Modify: `donation.js:7-16`
- Modify: `donation.js:160-268`
- Modify: `work/test_realtime_sky.py`

**Interfaces:**
- Consumes: `window.sharedDonationStars.loadLatest`, `.publish`, `.subscribe`, `.isConfigured`.
- Produces: `addOrReplaceDonation(star, { pulse })`, `visibleDonations()`, and `createClientId()` within `donation.js`.
- Preserves: `writeDonations`, `launchStar`, canvas hover/click behavior, and the existing donation form.

- [ ] **Step 1: Add failing integration tests for local fallback and de-duplication**

```python
def test_donation_script_has_shared_collection_and_local_fallback():
    script = (ROOT / "donation.js").read_text()
    self.assertIn("new Map()", script)
    self.assertIn("window.sharedDonationStars", script)
    self.assertIn("localStorage", script)
    self.assertIn("Shared sky is temporarily unavailable", script)

def test_donation_script_de_duplicates_remote_rows_by_client_id():
    script = (ROOT / "donation.js").read_text()
    self.assertIn("clientId", script)
    self.assertIn("addOrReplaceDonation", script)
    self.assertIn("subscribe(", script)
```

- [ ] **Step 2: Run the integration tests to verify they fail**

Run: `python3 -m unittest work/test_realtime_sky.py -v`

Expected: FAIL because `donation.js` still renders directly from `readDonations()`.

- [ ] **Step 3: Refactor the in-memory collection without changing the visual design**

Initialize `const donationStars = new Map(readDonations().map((star) => [star.clientId || star.id, star]));` and replace canvas reads with `visibleDonations()`, which returns the map's values ordered by `createdAt` and limited to the newest 80 items.

Generate a UUID-shaped `clientId` before launching the local animation. Prefer `crypto.randomUUID()` and provide a UUID v4-compatible fallback:

```js
function createClientId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    return (token === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });
}
```

On the existing `.create-order` click, add the contribution to the local map and `localStorage`, start `launchStar`, then call `window.sharedDonationStars.publish(contribution)` without delaying the receipt step. On success, call `addOrReplaceDonation(remoteStar, { pulse: false })`. On rejection, keep the local star and call:

```js
window.showToast('Shared sky is temporarily unavailable; this star is saved on this device.');
```

On startup, call `loadLatest()` and merge each row with `{ pulse: false }`, then subscribe once. For each remote insert, call `addOrReplaceDonation(star, { pulse: true })` only when it did not replace a local star with the same `clientId`. Track a short per-star pulse deadline in a `Map`; `drawDiamondStar` receives a focused flag when the deadline is later than the current animation time.

- [ ] **Step 4: Run the full browser-source test suite and build**

Run: `python3 -m unittest work/test_visual_refresh.py work/test_sky_donation.py work/test_realtime_sky.py -v`

Expected: PASS for all tests.

Run: `/Users/hanyun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build-static.mjs`

Expected: exit code 0 and `dist/index.html`, `dist/shared-stars.js`, and `dist/supabase-config.js` exist.

- [ ] **Step 5: Commit the shared renderer**

```bash
git add donation.js work/test_realtime_sky.py
git commit -m "feat: synchronize donation sky stars"
```

### Task 4: Configure the free project and publish the integration

**Files:**
- Modify: `supabase-config.js`
- Modify: `README.md` only if one is added during this task; otherwise do not add unrelated documentation.

**Interfaces:**
- Consumes: the project URL and publishable key from the Supabase project Settings > API Keys screen.
- Consumes: `supabase/donation_stars.sql` from Task 1.
- Produces: a public GitHub Pages build that can select, insert, and subscribe to `donation_stars`.

- [ ] **Step 1: Create one Supabase Free project in the browser**

Create a project named `weiguang-shared-sky` in the nearest practical region. Do not enter a service-role key into a file, browser script, or GitHub secret. Accept the Supabase account/project creation prompt only after the user confirms the final account action.

- [ ] **Step 2: Apply the schema and verify database access**

Open the Supabase SQL Editor, run the complete contents of `supabase/donation_stars.sql`, then run:

```sql
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename = 'donation_stars';
```

Expected: one `donation_stars` row.

- [ ] **Step 3: Set only public client configuration**

Copy the project URL and the `sb_publishable_...` key into `supabase-config.js`.

```js
window.WEIGUANG_SUPABASE_CONFIG = {
  url: 'https://<project-ref>.supabase.co',
  publishableKey: 'sb_publishable_<public-key>',
};
```

Before committing, search the repository to prove no privileged key entered source:

Run: `rg -n "service_role|sb_secret_|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" -g '!supabase-config.js' .`

Expected: no matches.

- [ ] **Step 4: Test two independent browser sessions**

Open the deployed page in two separate browser profiles or an ordinary and a private window. Complete a simulated donation in the first session. Expected: the first session shows its launch animation; the second receives a pulsing diamond star without refresh. Refresh the second session and confirm the newest star remains.

Disable the network in one session or temporarily blank the public config in a local preview. Expected: a new local star still flies and a non-blocking fallback notice appears.

- [ ] **Step 5: Publish and verify GitHub Pages**

Run:

```bash
git add supabase-config.js index.html shared-stars.js donation.js supabase/donation_stars.sql work/test_realtime_sky.py
git commit -m "feat: publish realtime donation sky"
git push origin main
/Users/hanyun/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build-static.mjs
git subtree push --prefix dist origin gh-pages
```

Then verify the public site contains the integration:

```bash
curl -L --max-time 30 -sS https://gjun0508.github.io/weiguang-plan/ | rg -q 'shared-stars.js'
```

Expected: exit code 0.

- [ ] **Step 6: Commit only any deployment fix discovered during verification**

If a source change was required after the two-session test, add that focused fix and its corresponding test, then commit it with a `fix:` message. Do not create a commit when verification found no source changes.
