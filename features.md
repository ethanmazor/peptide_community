# Feature spec & user flows

---

## Screens overview

| Screen | Nav tab | Type |
|---|---|---|
| Home | Home | Main screen |
| Log dose | — | Bottom sheet (from Home) |
| History | History | Main screen |
| Calculator | Calc | Main screen |
| Photos | Photos | Main screen |
| Settings | Settings | Main screen |
| Protocol builder | — | Multi-step flow (from Settings) |
| Vial setup | — | Sub-flow (from Protocol builder) |

---

## Home

The landing screen after login.

**Content:**
- Date header ("Friday, Mar 20")
- Cycle progress bar — protocol name, "Day X / Y", thin teal fill bar representing % of cycle complete
- Dose card list — all doses scheduled for today pulled from the active protocol

**Dose card states:**
- `Due now` — teal border, green "Due now" pill badge. Appears when the scheduled time has passed and the dose has not been logged.
- `Logged` — neutral border, gray pill with time logged (e.g. "Logged 7:32 AM")
- `Upcoming` — neutral border, gray pill with scheduled time (e.g. "8:00 PM")

**Actions:**
- Tap a "Due now" or "Upcoming" card → opens Log dose bottom sheet, pre-filled for that dose
- Tap the FAB (floating action button, bottom-right) → opens Log dose bottom sheet in off-schedule mode (no pre-fill)

**Empty state:**
If no protocol is active, show centered message: "No active protocol" with a button linking to Protocol builder.

---

## Log dose (bottom sheet)

Slides up over the Home screen. Not a page navigation.

**Pre-filled fields (from the dose card tapped):**
- Peptide name (read-only display, not editable)
- Dose in mcg (editable)
- Units to draw (auto-calculated from vial concentration, editable)
- Timestamp (defaults to now, editable via time picker)

**Required fields:**
- Injection site — dropdown with SubQ presets: "Left abdomen", "Right abdomen", "Left thigh", "Right thigh", "Left deltoid", "Right deltoid", plus a "Custom..." option for free text

**Optional fields (below a divider, labeled "Optional"):**
- Weight (kg) — numeric input
- Body fat % — numeric input
- Symptoms / notes — free-text area with placeholder "Any symptoms or observations..."

**Actions:**
- "Save log" button (teal, full width) — saves the `dose_logs` row, creates `body_metrics` and `symptoms` rows if filled, decrements `vials.units_remaining`, dismisses sheet
- Swipe down or tap outside — dismisses without saving

**Vial depletion:**
If `units_remaining` after this dose would reach 0, show a banner inside the sheet: "This will finish your vial. You'll be prompted to set up a new one after saving." After save, navigate to Vial setup.

---

## History

A filterable log of all past dose entries.

**Header:**
- Screen title "History"
- Search input — filters by peptide name in real time

**Body metric summary (top of list):**
- Two side-by-side stat cards: latest weight (kg) and latest body fat %
- Small bar chart below showing body weight trend across the last 7 logged entries. Bars are teal; latest is full opacity, older bars are muted.

**Log list:**
- Rows separated by 0.5px dividers
- Each row: peptide name + injection site (left), relative timestamp (right) — "Today, 7:14 AM", "Yesterday", or "Mar 15"
- Tap a row to expand inline and show: dose mcg, units drawn, symptoms (if any), body metrics (if any), notes (if any)

**Filters:**
- Search input filters by peptide name
- Future: date range picker and protocol filter (not MVP)

---

## Calculator

A standalone reconstitution calculator. No backend call required — all logic is client-side.

**Inputs:**
- Vial size (mg) — numeric input
- BAC water volume (mL) — numeric input

**Outputs (calculated live as user types):**
- Concentration per mL (mcg/mL)
- Concentration per unit (mcg/unit, assuming 100-unit insulin syringe)
- Target dose field — user enters a desired dose in mcg, app outputs the exact units to draw

**"Save to vial" button:**
Pre-fills a new Vial setup form with the values from the calculator and navigates to Vial setup. Only shown when a protocol with an active peptide exists.

---

## Photos

A chronological grid of progress photos.

**Layout:**
- 2-column photo grid, newest first
- Each thumbnail shows capture date overlaid at the bottom

**Upload:**
- Tap the "+" button (top right) → prompts to select a photo from the device
- After selecting, prompt: "Attach to which log entry?" — shows the 5 most recent dose logs to select from, or "Today's dose" if a dose was logged today
- After attaching, optionally add a caption

**Full-screen view:**
Tapping a photo opens it full-screen with the associated dose log metadata: peptide, dose, date, any notes.

**Storage:**
Photos upload directly from the frontend to Supabase Storage (bucket: `progress-photos`). The Hono API returns a signed upload URL; the frontend uploads directly and then sends the `storage_path` to the API to save the `photos` row. Never proxy file uploads through the backend.

---

## Settings

Three sections.

**Profile:**
- Display name (editable)
- Email (read-only, from auth)
- Notification time — time picker for preferred reminder time of day
- Reminder lead time — how many minutes before a dose to send the reminder (default 15)

**Peptide library:**
- List of all default peptides + user-created peptides
- Tap any row to edit: name, alias, description, typical dose (mcg), typical frequency, half-life (hours)
- "Add peptide" button at the bottom — creates a new custom peptide (`is_default = false`, `created_by_user_id = current user`)
- Default peptides can be edited by the user (edits are stored as user overrides, not modifications to the seed data)

**Active protocol:**
- Shows the current active protocol name, start date, and peptide count
- "Edit protocol" link → Protocol builder in edit mode
- "New protocol" link → Protocol builder in create mode

**Account:**
- Sign out button

---

## Protocol builder

A multi-step flow accessed from Settings. Creates or edits a protocol.

**Step 1 — Protocol details:**
- Protocol name (text input)
- Start date (date picker, defaults to today)
- End date (date picker, optional)
- Notes (text area, optional)
- "Next" button

**Step 2 — Add peptides:**
- List of peptides already added to this protocol (empty on create)
- "Add peptide" button → opens a sub-sheet:
  - Search/select from peptide library
  - Dose (mcg) — pre-filled from `typical_dose_mcg` if set, editable
  - Frequency — pre-filled from `typical_frequency` if set, editable (dropdown: "Once daily", "Twice daily", "Every other day", "Every 3 days", "Weekly", "Custom")
  - Optional notes
  - "Add to protocol" confirms and returns to step 2
- Each added peptide shows in the list with dose and frequency; tap to edit or remove
- "Next" button (only enabled when at least one peptide is added)

**Step 3 — Review:**
- Summary card: protocol name, dates, full list of peptides with doses and frequencies
- "Activate protocol" button — saves the protocol, sets `status = 'active'`, deactivates any previously active protocol, navigates to Vial setup for each peptide

---

## Vial setup

Triggered after Protocol builder step 3, or when an active vial runs out.

**Content:**
- Peptide name (read-only header)
- Vial size (mg) — numeric input
- BAC water volume (mL) — numeric input
- Calculated output: concentration per mL, concentration per unit (shown live)
- Vendor name — text input, optional (e.g. "Peptide Sciences")
- Vendor URL — text input, optional
- Reconstitution date — date picker, defaults to today
- Expiry date — date picker, defaults to today + 60 days
- "Save vial" button — creates the `vials` row with `is_active = true`, sets `units_remaining` based on vial size and concentration

If a protocol has multiple peptides, Vial setup cycles through each one. A progress indicator shows "Vial 1 of 2", etc.

---

## Notification flow

When a protocol is activated, the backend schedules email reminders for each peptide's doses based on the user's notification preferences from Settings.

Implementation:
- Supabase `pg_cron` runs a job every 15 minutes
- The job queries `protocol_peptides` joined to `protocols` and `profiles` to find doses due within the user's reminder lead time window
- A Supabase Edge Function fires for each match and sends an email via Resend
- Email contains: peptide name, dose, units to draw, and a deep link back to the app
- Hono has no involvement in scheduling or sending reminders

---

## Community features (Phase 2 — not MVP)

Do not build these in Phase 1. Schema fields (`is_public`, `shared_at` on `protocols`) are already in place.

**Protocol sharing:**
- User toggles `is_public = true` on a protocol from Settings
- Public protocols appear in a community feed (future screen)
- Shared data: protocol name, peptide names, doses, frequencies, notes
- Never shared: dose logs, body metrics, symptoms, photos

**Friends system:**
- Users can search for others by display name or username
- Send/accept/decline friend requests via `friendships` table
- Friends can optionally share body metric trends with each other (opt-in per user, not per protocol)

**Vendor normalization:**
- `vendor_name` on `vials` (free text in MVP) migrates to a foreign key to a `vendors` table
- Users can rate and review vendors on community-shared protocols
