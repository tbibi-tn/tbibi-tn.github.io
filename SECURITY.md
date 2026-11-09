# Security

Tbibi stores medical records. This page explains how they are protected and what the protection does **not** cover.

## How patient data is stored

- Tbibi runs entirely in the browser from a single HTML file. There is no server and no account.
- Data is kept in the browser's IndexedDB database on the doctor's computer. Tbibi asks the browser to keep it permanently (`navigator.storage.persist()`), so it is not removed when disk space runs low.
- Unsaved consultations are kept as drafts inside the same records, so they are encrypted too.
- The practice logo and scanned stamp are stored with the records (encrypted when encryption is on).
- A Content Security Policy blocks all network requests (`connect-src 'none'`). Only the Google Fonts stylesheet and font files may load. Patient data cannot be sent over the internet by the app.

## Waiting-room screen and QR code

- The waiting-room screen and the patient QR code show **ticket numbers and times only**. Showing initials on the screen is optional and off by default.
- The QR code holds the practice name, ticket numbers and estimated times, encoded in the link itself. Opening it sends nothing to Tbibi or to any server other than the page host.
- The screen window never saves data. It only reads, so it cannot overwrite changes made in the main window.

## Encryption (recommended)

When the doctor turns on encryption in **Paramètres → Sécurité**:

| Item | Value |
|---|---|
| Cipher | AES-256-GCM (authenticated: tampering is detected) |
| Key derivation | PBKDF2-SHA256, 310,000 iterations, random 16-byte salt |
| IV | Random 12 bytes, new for every save |
| Implementation | Browser Web Crypto API (`crypto.subtle`), no third-party crypto code |
| Stored | Only the encrypted vault (IndexedDB key `vault`); the unencrypted copy is deleted |
| Password | Never stored. The derived key lives in memory only while unlocked and is not extractable |

- The app opens on a lock screen. After 5 wrong passwords, each new attempt is delayed by 30 s more.
- Auto-lock after inactivity (default 10 minutes) and the lock button both clear the records and the key from memory.
- Backups are exported as encrypted `.tbibi` files using the same format.

## Limits — please read

- **A forgotten password cannot be recovered.** There is no back door. Keep the password somewhere safe and make regular encrypted backups.
- Encryption protects data **at rest** (stolen laptop, someone copying the browser profile, a shared computer while the app is locked). It does not protect against malware on the computer, or against someone using the computer while the app is unlocked.
- Clearing the browser's site data ("Effacer les données de navigation → cookies et données de sites") deletes the records. Back up regularly (USB stick, cloud storage). An encrypted backup is safe to store in the cloud.
- **A scanned stamp or signature printed automatically means anyone using the unlocked app can produce signed documents.** Turn off automatic printing in Settings if that is a concern.
- Unencrypted `.json` backups can be read by anyone who gets the file.
- Tbibi has not been audited or certified for health-data hosting. Doctors remain responsible for complying with the applicable law (in Tunisia, Loi organique n° 2004-63 on personal data protection and INPDP requirements).

## Reporting a vulnerability

Please do not open a public issue. Contact the maintainer privately with the details and steps to reproduce. You will get an answer within 7 days.
