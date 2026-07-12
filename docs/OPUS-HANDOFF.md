# Handoff: remaining work (for Claude Opus or any future session)

Written 2026-07-12 by the Fable session that built v1 and v2. Read
`~/.claude/projects/-Users-cameronhouser/memory/project-leaderboard.md`
first. Cam's working rules: batch fixes (don't fix mid-test), answers in
chat not files, no features beyond this list without his ask (feature
freeze pending real-user feedback), simplest thing that works.

## State when this was written

- v2 SHIPPED: board accepts inline settings via URL params
  (`paramsToSettings` in index.html; params: title, dates, explainer,
  disclaimer, pbtext, pburl, btntext, form, gap, stack, agg, logo, since;
  URL-mode defaults: agg=SUM, stack=ON). Builder (make.html) is a form
  that generates param links, with an "Edit an existing board" prefill
  box and a legacy settings-sheet field. Settings-sheet mode and
  positional mode still work (three-way precedence: config.js > settings=
  sheet param > inline params; demo=1 unchanged).
- Tests: `node tests/run-tests.mjs` (61 assertions). Run before and after
  ANY logic change. The harness evals the inline <script> from the shipped
  HTML files with stubs; if you add top-level DOM calls to make.html or
  index.html, extend the stubs in evalWithStubs.
- Deploy: push to main auto-deploys cohort-leaderboard.netlify.app in
  ~20s. Verify with curl after pushing.
- Verification gotcha: headless Chrome --window-size lies about narrow
  layouts; test mobile via an iframe at 390px and check scrollWidth, or a
  real resized window.

## Task list (roughly in order)

1. **Docs sweep for v1→v2 consistency.** README quickstart is updated;
   PLAYBOOK.md is NOT (it still walks the settings-sheet flow, phases
   4/5/7). Rewrite the playbook against the v2 flow: interview →
   form copy/Publish/Link to Sheets → publish responses CSV → assistant
   constructs the board URL itself from interviewed settings (title,
   dates, form link) using the param scheme above — the assistant can
   skip the builder page entirely. Keep: one step per message,
   checkpoints, exact UI labels, string-only URL checks, fixed starter
   metrics (outreach + revenue), swap-metrics coaching at the end.
   docs/template-sheet-setup.md stays but gets a first line saying it's
   the advanced/sheet-mode path.
2. **Screenshot walkthrough.** A step-by-step page with annotated
   screenshots (circles on the Publish button, the two publish-dialog
   dropdowns, Link to Sheets). Cam captures or approves screenshots (his
   Google account). Host as a page in the repo (walkthrough.html) linked
   from README and builder. Match the board's visual style.
3. **Findings ledger fixes not yet applied** (from Cam's stranger test,
   batch them):
   - Builder result box: add "click your board's Submit button and
     confirm a test entry lands in your response spreadsheet" as a final
     check, plus the 5-minute cache expectation (partially present).
   - Anywhere "Publish to web" appears, the two dropdowns must be spelled
     out (README done; check builder + playbook).
4. **Stranger test round 2** (Cam runs it with a no-context human on the
   v2 flow; also his ChatGPT playbook test). Collect stumbles, batch
   fixes, only then consider any UX code changes.
5. **Cam's own board migration** (leaderboard.actionworks.co, old
   pre-v1 codebase on the "leaderboard.actionworks.co" Netlify project):
   redeploy from ~/Coding/cohort-leaderboard with config.cam.js renamed
   to config.js in the deployed copy (NOT in git), or rebuild his board
   as a v2 param link and retire the old project. His live sheet is
   positional format; the fallback parser handles it. Don't break his
   live board mid-cohort; confirm timing with him.
6. **Deferred, do not build without Cam's explicit ask:** the playbook
   essay for camhouser.com (needs his dictated stories), ELEDA/Actionworks
   landing page, brand decision, swapped-URL heuristics, any SaaS-shaped
   backend.

## Sharp edges learned the hard way

- Netlify Drop page creates NEW projects; project Deploys page updates
  existing ones. Git-push deploys avoid the whole class of mistake.
- Google Forms copies arrive UNPUBLISHED (viewers see "no one can
  respond"). The Publish step is mandatory in every walkthrough.
- Forms have no viewer role: template sharing is anyone-with-link EDITOR
  + /copy links. Cam still needs a private master backup of the template
  form (unmade as of this writing — remind him).
- Typing SUM into Sheets can autocomplete to =SUM() which publishes as
  "0". Docs say "the word SUM"; keep it that way.
- Published-CSV cache is ~5 minutes; every "it's not updating" report is
  this until proven otherwise.
- Sheet URLs in query params are restricted to docs.google.com (see
  safeSheetUrl) and all sheet-supplied URLs are scheme-checked (safeUrl).
  Don't loosen either.
