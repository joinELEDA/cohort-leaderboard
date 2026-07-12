// Regression tests for the leaderboard's pure logic.
// Run: node tests/run-tests.mjs
//
// Extracts the inline <script> from index.html and make.html and evals it
// with minimal stubs, so the shipped files stay exactly as they are and
// these tests can never drift from production code.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function extractInlineScript(html) {
    // Last <script> block without a src attribute
    const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    return blocks[blocks.length - 1][1];
}

function evalWithStubs(code) {
    const stubEl = () => ({ style: {}, searchParams: null, value: '', addEventListener: () => {} });
    const sandbox = { window: {}, document: { getElementById: stubEl, querySelector: stubEl }, Papa: undefined, fetch: undefined, setInterval: () => {}, URLSearchParams, URL, console, navigator: {} };
    const names = [
        'parseScore', 'cleanMetricTitle', 'parseSettings', 'aggregateByTeam',
        'buildLeaderboards', 'safeUrl', 'safeSheetUrl', 'escapeHtml',
        'normalizeSheetUrl', 'isSheetCsvUrl', 'paramsToSettings',
        'isFormLink', 'classifyDataCsv'
    ];
    const collector = `;return ({${names.map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`).join(',')}})`;
    const fn = new Function(...Object.keys(sandbox), code + collector);
    return fn(...Object.values(sandbox));
}

const indexHtml = await readFile(join(root, 'index.html'), 'utf8');
const makeHtml = await readFile(join(root, 'make.html'), 'utf8');
const lib = evalWithStubs(extractInlineScript(indexHtml));
const makeLib = evalWithStubs(extractInlineScript(makeHtml));

let passed = 0, failed = 0;
function eq(actual, expected, label) {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    if (a === e) { passed++; }
    else { failed++; console.error(`FAIL ${label}\n  expected ${e}\n  got      ${a}`); }
}

// --- parseScore ---
eq(lib.parseScore('45'), 45, 'parseScore plain int');
eq(lib.parseScore('$1,200'), 1200, 'parseScore US currency');
eq(lib.parseScore('1.234,56'), 1234.56, 'parseScore EU thousands+decimal');
eq(lib.parseScore('1,5'), 1.5, 'parseScore EU decimal comma');
eq(lib.parseScore('1,234'), 1234, 'parseScore US thousands');
eq(lib.parseScore('12.5'), 12.5, 'parseScore US decimal');
eq(lib.parseScore(''), 0, 'parseScore empty');
eq(lib.parseScore('abc'), 0, 'parseScore garbage');
eq(lib.parseScore('-3'), -3, 'parseScore negative');
// Documented ambiguity: lone dot reads as US decimal
eq(lib.parseScore('2.500'), 2.5, 'parseScore ambiguous lone dot = US');

// --- cleanMetricTitle ---
eq(lib.cleanMetricTitle('📞 Outreach Made (DMs, emails)\nlong explainer'), '📞 Outreach Made', 'cleanMetricTitle strips paren+newline');
eq(lib.cleanMetricTitle('Revenue'), 'Revenue', 'cleanMetricTitle passthrough');

// --- safeUrl / safeSheetUrl ---
eq(lib.safeUrl('javascript:alert(1)'), '', 'safeUrl blocks javascript:');
eq(lib.safeUrl('https://ok.example'), 'https://ok.example', 'safeUrl allows https');
eq(lib.safeSheetUrl('https://evil.example/x'), '', 'safeSheetUrl blocks non-Google');
eq(lib.safeSheetUrl('https://docs.google.com/spreadsheets/d/e/X/pub?output=csv'), 'https://docs.google.com/spreadsheets/d/e/X/pub?output=csv', 'safeSheetUrl allows published sheet');

// --- parseSettings: legacy positional format (col A by row number) ---
const settingsRows = [
    ['Jumpstart Program Leaderboard'], ['Data Period: Dec 2 - Dec 9'], ['Resets Mondays'], ['All self-reported.'],
    ['Powered by Actionworks'], ['https://pb.example'], ['Submit updates here'], ['https://form.example'],
    ['ON'], ['OFF'], ['SUM'], ['https://logo.example/l.png'], ['12/8/2025']
];
const s = lib.parseSettings(settingsRows);
eq(s.title, 'Jumpstart Program Leaderboard', 'positional A1 title');
eq(s.poweredByText, 'Powered by Actionworks', 'positional A5 powered-by');
eq(s.formLinkUrl, 'https://form.example', 'positional A8 form url');
eq(s.showScoreGap, true, 'positional A9 gap ON');
eq(s.stackOnMobile, false, 'positional A10 stack OFF');
eq(s.aggregate, 'SUM', 'positional A11 aggregate');
eq(s.logoUrl, 'https://logo.example/l.png', 'positional A12 logo');
eq(s.sinceDate instanceof Date && !isNaN(s.sinceDate), true, 'positional A13 since date parses');
// Legacy sheet: QR URL in A11 falls back to RAW
const legacy = lib.parseSettings([['T'],[''],[''],[''],[''],[''],[''],[''],[''],[''],['https://raw.githubusercontent.com/qr.png']]);
eq(legacy.aggregate, 'RAW', 'positional legacy A11 URL -> RAW');

// --- parseSettings: named format (setting name in A, value in B) ---
const namedRows = [
    ['What it controls', '👉 Your input (edit this column)', 'Notes'],   // header row: ignored
    ['Date range', 'Week 2 of 8', 'shows in subtitle'],                  // order scrambled on purpose
    ['Title', 'EDO Cohort Board', 'the headline'],
    [''], // spacer
    ['Submit button URL', 'https://forms.gle/xyz', ''],
    ['Submit button text', 'Report progress', ''],
    ['Multiple submissions', 'latest', 'sum/latest/max'],                // case-insensitive value
    ['Show score gap', 'on', ''],
    ['Your board link', 'https://cohort-leaderboard.netlify.app/?x=1', 'storage only'], // unknown: ignored
    ['Count since', '12/8/2025', '']
];
const n = lib.parseSettings(namedRows);
eq(n.title, 'EDO Cohort Board', 'named title, order-independent');
eq(n.dateRange, 'Week 2 of 8', 'named date range');
eq(n.formLinkUrl, 'https://forms.gle/xyz', 'named submit url');
eq(n.formLinkText, 'Report progress', 'named submit text');
eq(n.aggregate, 'LATEST', 'named aggregate, case-insensitive');
eq(n.showScoreGap, true, 'named gap on, case-insensitive');
eq(n.sinceDate instanceof Date && !isNaN(n.sinceDate), true, 'named count-since parses');
eq(n.poweredByText, '', 'named absent powered-by defaults empty');

// --- aggregateByTeam ---
const entries = [
    { team: 'Alpha', score: 5, order: 0 },
    { team: 'alpha', score: 7, order: 1 },
    { team: 'Beta', score: 10, order: 2 },
    { team: '', score: 99, order: 3 }
];
eq(lib.aggregateByTeam(entries, 'SUM').map(e => e.team + '=' + e.score).sort(), ['Alpha=12', 'Beta=10'], 'aggregate SUM, case-insensitive, drops blank teams');
eq(lib.aggregateByTeam(entries, 'LATEST').map(e => e.team + '=' + e.score).sort(), ['Alpha=7', 'Beta=10'], 'aggregate LATEST');
eq(lib.aggregateByTeam([{ team: 'A', score: 3, order: 0 }, { team: 'A', score: 9, order: 1 }, { team: 'A', score: 4, order: 2 }], 'MAX').map(e => e.score), [9], 'aggregate MAX');

// --- buildLeaderboards end to end ---
const dataRows = [
    ['Timestamp', 'Team Name', 'Outreach', '💰 Revenue closed (number)'],
    ['12/1/2025 10:00:00', 'Alpha', '5', '100'],
    ['12/8/2025 09:00:00', 'Alpha', '7', '200'],
    ['12/8/2025 11:00:00', 'Beta', '10', '20'],
    ['12/9/2025 11:00:00', 'Beta', '2', '80']
];
const cfg = base => Object.assign({ showScoreGap: false, aggregate: 'RAW', sinceDate: null }, base);

let boards = lib.buildLeaderboards(dataRows, cfg({}));
eq(boards.length, 2, 'RAW two metric boards');
eq(boards[0].data.length, 4, 'RAW keeps every row');
eq(boards[1].isCurrency, true, 'currency detected from revenue header');
eq(boards[1].metricTitle, '💰 Revenue closed', 'metric title cleaned');

boards = lib.buildLeaderboards(dataRows, cfg({ aggregate: 'SUM', sinceDate: new Date('12/8/2025') }));
eq(boards[0].data.map(e => e.team + '=' + e.score), ['Beta=12', 'Alpha=7'], 'SUM + since-date outreach');
eq(boards[1].data.map(e => e.team + '=' + e.score), ['Alpha=200', 'Beta=100'], 'SUM + since-date revenue');

boards = lib.buildLeaderboards(dataRows, cfg({ showScoreGap: true }));
eq(boards[0].data[0].scoreGap, 'Leader', 'score gap leader label');
eq(boards[0].data[1].scoreGap, '3 behind', 'score gap behind label');

// --- paramsToSettings: v2 inline settings from the board URL ---
const p1 = lib.paramsToSettings(new URLSearchParams(
    'title=EDO Board&dates=Week 2&form=https://forms.gle/abc&gap=ON&agg=LATEST&since=12/8/2025&btntext=Report'));
eq(p1.title, 'EDO Board', 'params title');
eq(p1.dateRange, 'Week 2', 'params dates');
eq(p1.formLinkUrl, 'https://forms.gle/abc', 'params form link');
eq(p1.formLinkText, 'Report', 'params button text');
eq(p1.showScoreGap, true, 'params gap ON');
eq(p1.aggregate, 'LATEST', 'params agg override');
eq(p1.sinceDate instanceof Date && !isNaN(p1.sinceDate), true, 'params since parses');

const p2 = lib.paramsToSettings(new URLSearchParams('data=x'));
eq(p2.title, 'Cohort Leaderboard', 'params default title');
eq(p2.aggregate, 'SUM', 'params default agg SUM');
eq(p2.stackOnMobile, true, 'params default stack ON');
eq(p2.showScoreGap, false, 'params default gap off');

const p3 = lib.paramsToSettings(new URLSearchParams('form=javascript:alert(1)&logo=data:text/html,x'));
eq(p3.formLinkUrl, '', 'params form link sanitized');
eq(p3.logoUrl, '', 'params logo sanitized');

// --- normalizeSheetUrl (make.html) ---
eq(makeLib.normalizeSheetUrl('https://docs.google.com/spreadsheets/d/e/X/pubhtml'), 'https://docs.google.com/spreadsheets/d/e/X/pub?output=csv', 'normalize pubhtml -> pub csv');
eq(makeLib.normalizeSheetUrl('https://docs.google.com/spreadsheets/d/e/X/pubhtml?gid=5&single=true'), 'https://docs.google.com/spreadsheets/d/e/X/pub?gid=5&single=true&output=csv', 'normalize pubhtml with params');
eq(makeLib.normalizeSheetUrl('https://docs.google.com/spreadsheets/d/e/X/pub?gid=5&single=true&output=csv'), 'https://docs.google.com/spreadsheets/d/e/X/pub?gid=5&single=true&output=csv', 'normalize leaves good url alone');
eq(makeLib.normalizeSheetUrl('not a url'), 'not a url', 'normalize passes garbage through for validation to reject');

// --- builder guards: form-link and data-feed classification (make.html) ---
eq(makeLib.isFormLink('https://docs.google.com/forms/d/e/XYZ/viewform'), true, 'isFormLink accepts forms url');
eq(makeLib.isFormLink('https://forms.gle/abc'), true, 'isFormLink accepts forms.gle');
eq(makeLib.isFormLink('https://docs.google.com/spreadsheets/d/e/X/pub?output=csv'), false, 'isFormLink rejects spreadsheet url');
eq(makeLib.classifyDataCsv('What it controls,👉 Your input (edit this column),Notes\nTitle,X,Y'), 'settings-sheet', 'classify catches settings sheet');
eq(makeLib.classifyDataCsv('Timestamp,Team Name,Outreach,Revenue\n1,2,3,4'), 'ok', 'classify accepts responses header');
eq(makeLib.classifyDataCsv('Timestamp,Your name (or company),Outreach\n1,2,3'), 'ok', 'classify accepts name variant');
eq(makeLib.classifyDataCsv('Week,Amount,Total\n1,2,3'), 'no-name-column', 'classify flags missing name column');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
