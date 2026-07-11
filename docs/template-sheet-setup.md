# Template Form + Settings sheet (operator setup)

This documents the exact template contents. Cam: create these once in your
Google account, set sharing to "Anyone with the link can view," and replace
the TODO links below with the real template links.

> Template Form: **[TODO: link]** · Template Settings sheet: **[TODO: link]**

## Why two documents

The board reads two published-CSV URLs that do NOT need to come from the same
spreadsheet. That sidesteps the classic Google gotcha: copying a Sheet does
not bring its linked Form along. So the flow is: copy the Form (it creates
its own response spreadsheet), copy the Settings sheet separately.

## The Form (template contents)

Title: "Weekly Progress Update"

1. **Your name (or your company's name — whatever you prefer)**
   Short answer. Required.
   (This wording matters: it lets people in privacy-sensitive programs use a
   company name or handle instead of a real name.)
2. **📞 Outreach made (enter a number)**
   Short answer, number validation.
   Description: "Any direct attempt to contact a potential customer or
   stakeholder: DMs, emails, cold calls."
3. **💰 Revenue closed (enter a number)**
   Short answer, number validation.
   Description: "Deals that have officially closed. Dollars, not promises."

Rename, add, or remove metric questions freely; every question after the
name becomes its own leaderboard column. Keep "name" in the name question's
wording (the board finds the team column by it). Put "revenue", "sales",
"earner", or "$" in money questions so they format as currency.

## The Settings sheet (template contents)

One tab named Settings. Column A, rows 1-12:

| Row | Template value |
|-----|----------------|
| A1  | My Program Leaderboard |
| A2  | Week 1 of 8 |
| A3  | Resets every Monday at midnight. |
| A4  | Disclaimer: All numbers are self-reported. The point of this leaderboard is motivation and community. Awards and recognition are at the discretion of the program organizers. |
| A5  | (blank, or "Powered by Your Org") |
| A6  | (blank, or https://your-org.example) |
| A7  | Submit Updates |
| A8  | (paste your Form's share link here) |
| A9  | OFF |
| A10 | ON |
| A11 | (leave blank) |
| A12 | (blank, or a logo image URL) |

Put labels in column B if you like; the board only reads column A.

## Operator steps (what the copy flow looks like)

1. Open the template Form → ⋮ menu → **Make a copy**.
2. In your copy: Responses tab → **Link to Sheets** → creates your response
   spreadsheet.
3. Open the template Settings sheet → **File > Make a copy**.
4. Edit your Settings copy: title, dates, and paste your Form's "Send" link
   into A8.
5. Publish both as CSV (File > Share > Publish to web; pick the
   Form-responses tab in one, Settings in the other; format = .csv).
6. Paste the two URLs into the leaderboard builder. Done.

## Testing checklist (before sharing template links publicly)

- [ ] Copy the Form from a DIFFERENT Google account than the one that owns it.
- [ ] Link responses, submit one test entry, confirm it lands.
- [ ] Copy the Settings sheet from the other account.
- [ ] Publish both, build a board, confirm title + entry render.
- [ ] Confirm the Submit button opens the copied Form (not the template).
