// Load order of the app's scripts (src/js/...). Order matters: later files use
// globals defined by earlier ones. To add a screen, add its file here.
export const MODULES = [
  // strings and data
  "i18n.js",
  "data/demo-data.js",
  // core
  "core/state.js",
  "core/utils.js",
  "ui/icons.js",
  "ui/qr.js",
  "ui/components.js",
  "core/storage.js",
  "core/security.js",
  "ui/shell.js",
  // screens
  "views/search.js",
  "views/queue.js",
  "views/today.js",
  "views/screen.js",
  "views/journal.js",
  "views/patients.js",
  "views/patient.js",
  "views/patient-form.js",
  "views/visit.js",
  "views/certificates.js",
  "pdf/documents.js",
  "views/agenda.js",
  "views/meds.js",
  "views/templates.js",
  "ui/charts.js",
  "views/stats.js",
  "views/settings.js",
  // start-up (last)
  "main.js",
];
