// Self-hosted configuration.
//
// Copy this file to config.js and paste your two published-CSV URLs.
// In each Google Sheet: File > Share > Publish to web, pick the tab,
// choose "Comma-separated values (.csv)", publish, copy the URL.
//
// config.js is gitignored so your sheet URLs stay out of the repo.
// When config.js is absent or empty, the page falls back to
// ?settings=...&data=... query params (hosted mode) or ?demo=1.

window.LEADERBOARD_CONFIG = {
    settingsCsvUrl: "",
    dataCsvUrl: ""
};
