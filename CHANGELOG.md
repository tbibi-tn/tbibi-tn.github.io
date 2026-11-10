# Changelog

All notable changes to Tbibi are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned
- 1.5: import from Mon Cabinet v2003, medication list import (CSV), numbered fee notes and monthly income summary, live QR page (needs the online service).
- 1.6: file attachments (scanned results, X-rays), growth curves and vaccinations, pregnancy follow-up, interaction warnings.
- 2.0: installable app, doctor + secretary on two computers, SMS reminders.

## [1.4.1] — 2026-11-09

### Added
- **Online version.** The app is published with GitHub Pages at <https://tbibi-tn.github.io/>. Data still stays in the doctor's own browser; nothing is sent anywhere.
- On the online version the waiting-room QR code works with no setup (the patient page is published next to the app).
- `npm run perf`: times every screen with a 10-year practice (6,000 patients, 70,000 visits).

### Changed
- **Search is about 20× faster on large practices** (≈ 40 ms instead of ≈ 840 ms per key with 70,000 visits): the searchable text is prepared once when the search box opens instead of on every key.
- **Patient lookups use an index**, so lists, statistics and the journal no longer scan every patient for each row (Statistics ≈ 3× faster, Today ≈ 4× faster with large data).
- "Recent patients" on Today is found in one pass instead of sorting every visit.
- The build minifies the app when esbuild is installed (`npm install`); without it, it still builds with no dependencies. `npm run build:plain` keeps the readable output.
- The script load order moved to `scripts/modules.mjs`.

## [1.4.0] — 2026-11-09

### Added
- **Estimated waiting time.** Every patient in the waiting room and every upcoming appointment shows an estimated time ("≈ 15:40"). It is based on the queue order, on how long the current visit has lasted, and on the average visit length.
  - The average is learnt automatically: the median gap between visits over the last 60 days.
  - It can also be set by hand in Settings.
- **Ticket numbers.** Each arrival gets a ticket number for the day (N° 1, 2, 3…), shown in the waiting room in place of the position.
- **80 mm patient ticket**, printed from the waiting room (or automatically on arrival). It shows the number, how many patients are ahead, the estimated time and a QR code.
- **Waiting-room screen** for a TV or second monitor (the screen button in the waiting room, or Ctrl+K → "Écran salle d'attente"):
  - the patient being seen, the next patients with times and "dans 25 min";
  - a large QR code, a clock, and text in French and Arabic;
  - only ticket numbers are shown (initials are optional);
  - it refreshes by itself when the main window saves, and has a full-screen button.
- **Patient page on the phone (`attente.html`)**, opened by the QR code:
  - the patient's number, estimated time, live countdown, patients ahead and the whole queue;
  - French and Arabic (right-to-left), light and dark mode.

  The QR code carries only ticket numbers and times, never names. The page can be hosted for free on GitHub Pages (`docs/attente/`).
- **QR code generator built into the app** (no library, works offline). Its output was checked with an independent decoder (OpenCV) at sizes from version 1 to 22.
- **Quick actions in the search box (Ctrl+K):** new patient, walk-in, appointment, visit, waiting-room screen, journal, statistics, backup, lock.

### Changed
- **Statistics redesigned:**
  - each figure shows a comparison with the previous period (▲/▼ %) and a small trend line;
  - revenue is shown as columns split into "avec BS" and "sans BS", with a legend, a hover tooltip and the highest value labelled;
  - visits per month are shown as a line with the latest value labelled;
  - a new chart shows the busiest days and hours (heat map);
  - women/men and avec BS/sans BS are shown as a single split bar, and unpaid balances list the patients concerned;
  - every chart has a **Tableau** button that shows the numbers as a table;
  - charts are drawn at their real width, so text no longer shrinks or stretches, and they redraw when the window is resized;
  - chart colors were checked for colour-blind readers in light and dark mode.
- The vital-sign charts in the patient file use the same chart engine (labels no longer overlap).
- Waiting room: the ticket number replaces the separate position badge, "See first" is now an icon, and long waits read "1 h 54" instead of "114 min".
- Automatic checks: 54 in total.

## [1.3.1] — 2026-11-09

### Added
- **Waiting room you can reorder.** Patients who have arrived are numbered 1, 2, 3… and the first one is the "next patient" shown at the top of the Today screen. To change the order:
  - drag a patient by the ⠿ handle,
  - use the ↑ / ↓ arrows,
  - or click **En premier** to see someone first (urgent case).
- **Order mode switch**: *Ordre d'arrivée* (first come, first seen; the default) or *Heure du RDV* (by appointment time). Switching the mode resets any manual order.
- **Walk-in patients** ("Patient sans RDV"): add a patient straight to the end of the waiting room without booking.
- **Waiting time** shown for each patient ("attend depuis 25 min"), in red after 45 minutes.
- Waiting room split into *En consultation*, *En salle d'attente*, *À venir*, with *Terminés et absents* folded at the bottom.
- **Remove from queue** (×) with an **Undo** button.
- **Delete a patient** from the patient file (**Supprimer** button) or from the patient list (bin icon on each row). The confirmation shows how many visits, appointments and payments will be removed, and **Undo** is available for 10 seconds.
- 13 new automatic checks (44 in total).

## [1.3.0] — 2026-11-09

### Added
- **Large storage (IndexedDB).** Records now live in the browser's database instead of localStorage, which was capped at about 5 MB (roughly one year of a busy practice). Tested with 10 years of data: 6,000 patients and 70,000 visits (44 MB), saved in under half a second.
- **Automatic move of existing data** from localStorage (versions 1.0 to 1.2, including old Cabinéo data) on first launch.
- **Protection against browser clean-up**: Tbibi asks the browser to keep its data permanently. Settings show how much space is used and whether this protection is active.
- **Save-failure alert**: if a save fails (for example, a full disk), a red banner stays on screen and asks the doctor to download a backup.
- **Consultation drafts**: an open consultation is saved as a draft every few seconds, and the draft is encrypted when encryption is on. If the browser closes, a "Reprendre" banner brings the consultation back exactly as it was.
- **Close warning**: closing a consultation with unsaved changes (Esc, Retour, Annuler) offers three choices: continue the visit, keep it as a draft, or discard it.
- **Logo and scanned stamp/signature** in Settings, printed on every PDF (the logo replaces the green cross). The stamp can be turned off to sign by hand. Images are resized automatically.
- **Settings save automatically**, with a "Enregistré automatiquement" confirmation.
- **Phone calendar**: one day at a time, with day tabs for the week.
- **Double-booking warning** when a new appointment overlaps an existing one.

### Fixed
- `Ctrl+S` saved the consultation only when the cursor was inside the form; it now works anywhere on the consultation screen, and also saves Settings.
- Starting a visit from an appointment such as "Mme. Haddad Sirine" filled the patient form with "Mr." and sex "M". The title and sex are now read from the name.
- Error messages (such as a missing name) showed a green ✓ success icon. They now use the warning style.
- Search showed "40" consultations when there were more. Counts are now exact.
- Prescriptions with more than 7 medicines continued on a second page without a header or patient name. Each page now repeats the header, patient box, page number and signature box.
- On phones, the consultation screen was cut off on the right. Vital signs now use 2 columns and the save bar stacks.
- Blood pressure showed "150/undefined" when only the systolic value was entered.

### Changed
- Encrypted records are stored as raw bytes in IndexedDB (about 25 % smaller than base64). Backup files keep the same `.tbibi` format, so 1.2 backups still restore.
- Smoke test extended to 31 checks: storage, migration, 10-year data volume, drafts, logo/stamp printing, double booking, phone layouts.

## [1.2.0] — 2026-11-09

### Added
- **Encrypted patient records.** The doctor can protect all data with a password. Records are encrypted on the computer with AES-256-GCM, using a key derived from the password with PBKDF2-SHA256 (310,000 iterations, random 16-byte salt).
- **Lock screen** on start-up when encryption is on, with a growing delay after 5 wrong attempts.
- **Auto-lock** after 5, 10, 15, 30 or 60 minutes of inactivity (default 10). Locking clears the records from memory.
- **"Lock" button** in the top bar.
- **Encrypted backups** (`.tbibi` files), protected by the vault password or by a password chosen for the backup. Unencrypted `.json` backups still work, after a warning.
- **Restore** detects encrypted backups and asks for their password.
- **Password management**: turn encryption on, change the password (with a strength meter), turn it off (requires the password).
- **Reminder banner** on the Today screen while encryption is off. It can be dismissed.
- **Content Security Policy** that blocks every network request except Google Fonts, so patient data cannot be sent anywhere.
- App version shown at the bottom of Settings.

### Changed
- Project reorganised for GitHub: source split into `src/` modules, a build script (`scripts/build.mjs`) produces the single file `dist/tbibi.html`, plus an automated smoke test (`tests/smoke.test.mjs`).
- Wrong-password message now reads "Mot de passe incorrect".

### Removed
- The 4-digit PIN lock. It only hid the screen; the data stayed readable. Encryption replaces it.

### Security
- See [SECURITY.md](SECURITY.md) for the threat model and its limits.

## [1.1.0] — 2026-11-09

### Changed
- **Renamed from Cabinéo to Tbibi** (طبيبي, "my doctor"), with a new logo: a green cross with a heartbeat line.
- **New green design system**: deep green sidebar, clinical green (`#0F7B5F`) for actions, IBM Plex Sans font, sentence-case labels, pink/green initials circles by sex.
- **PDF documents redesigned** (prescription, certificates, lab and imaging requests, fee note, referral letter, patient record, daily log): green header band with the doctor's logo, tinted patient box (age, file number, CNAM number, allergies), numbered prescription lines with duration and quantity labels, dashed stamp-and-signature box, dark footer with opening hours, faint cross watermark, green-header tables.
- Patient file: action bar under the patient's details, breadcrumb back to the patient list, icons on details and tabs.

### Added
- **"Next patient" card** on the Today screen: the patient in the waiting room with allergies, reason for visit, last visit and a one-click "Consulter" button.
- **Quick actions** panel on the Today screen.
- **Vital-sign icons** with automatic warnings in orange (blood pressure ≥ 140/90, temperature ≥ 38 °C, blood sugar ≥ 1.26 g/L, SpO₂ < 94 %, BMI ≥ 30, pulse < 50 or > 100).
- **Consultation progress steps** at the top that tick as each section is filled.
- **Sticky save bar** in the consultation screen showing fees, payment and balance.
- **Drawn icons on empty screens** with a hint about what to do next.
- Colored icons by category in the search results.
- Old Cabinéo data is picked up automatically on first launch.

## [1.0.0] — 2026-11-09

First version (named Cabinéo), built to replace the "Mon Cabinet v2003" software.

### Added
- **Today screen**: waiting room with "Arrivé" / "Consulter" / "Absent", daily totals, recent patients, unpaid balances.
- **Journal**: same columns as the old software plus totals (revenue, cash, unpaid, with/without claim form), PDF and Excel (CSV) export.
- **Realtime search** (Ctrl+K) across patients, consultations, medications and appointments, with category tabs.
- **Patient file**: identity, contact, CNAM details, medical history, allergies, chronic disease (APCI), visit history, vital-sign charts, prescriptions, payments, duplicate detection on creation.
- **Consultation screen**: vital signs with automatic BMI, diagnosis suggestions, prescription with medication autocomplete, prescription templates, renew last prescription, allergy alert, lab and imaging requests, 7 certificate types, referral letter, fees and claim form.
- **PDF documents** with the doctor's header (editable in Settings).
- **Weekly calendar** with appointment statuses.
- **Statistics**: revenue per day, visits per month, top diagnoses and medications, age distribution, collection rate.
- **Medication database** and **prescription templates**.
- **Settings**: document header, fee schedule, calendar hours, doctors, JSON backup and restore.
- French / English interface, light / dark theme, keyboard shortcuts, works offline in one HTML file.
