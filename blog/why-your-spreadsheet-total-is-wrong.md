# Why your Excel or Google Sheets total is wrong: 7 real causes, ranked

> Your SUM returns 0, or a number that's quietly too low. A 60-second triage that names the cause, then the fix for all seven - including the two that never show an error.

Source: https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/
Author: Ben Ison — Python / AI Engineer — https://dayonebuilder.online/
Published: 2026-07-17
Language: en

---
Your SUM says 0. Or worse, it says something believable that happens to be too low, and it has been saying it for months. Here is the triage I run before touching anything, and the seven causes it lands on - ordered by how often they actually turn out to be the culprit.

A wrong total in a spreadsheet is rarely a mystery. It is almost always one of seven things, and six of them announce themselves within a minute if you ask the right question. The trouble is that the usual first move - staring at the formula - is the one that tells you least. The formula is usually fine. It is the data underneath that is lying to it.

So start with the data.

## The 60-second triage

> Short version: three formulas in three empty cells. Their answers narrow seven causes down to one or two before you have touched anything.

Put these next to your data - say your numbers live in `B2:B500`:

1. **`=COUNT(B2:B500)` against `=COUNTA(B2:B500)`** - COUNT counts only real numbers. COUNTA counts everything that isn't empty. If COUNT is lower, some of your "numbers" are text - cause #1, and you can stop reading the rest of the triage.

2. **`=SUM(B2:B500)` against `=SUBTOTAL(109,B2:B500)`** - SUBTOTAL with 109 skips rows that are hidden or filtered out; SUM does not. If the two disagree, hidden rows are in play - cause #5.

3. **`=COUNTA(B:B)` against the last row your total actually covers** - Column B has 812 filled cells but your SUM stops at row 500? The range stopped growing - cause #2. This is the one that hides for months, because nothing about it looks broken.

Two more worth knowing: `=SUMPRODUCT(--ISTEXT(B2:B500))` counts text cells directly, and in Excel, tapping **F9** is a one-second test for a stale total (see the note at the end). Now the seven, in the order they actually turn up.

## 1. Your numbers are text

- **Tell:** SUM returns 0, or far too little. The values sit on the **left** of their cells - real numbers align right. Excel adds a small green triangle.

- **Why:** SUM ignores text inside a referenced range instead of complaining. A whole column of text numbers sums to a confident, wrong `0`.

- **Fix:** Convert the values, don't reformat them: Excel's **Convert to Number** on the error indicator, a Paste Special **multiply by 1**, or `=VALUE(A2)`.

This is first by a wide margin, and it earns the place because SUM's behaviour is documented and merciless: text in a referenced range is **ignored**, not flagged. No error, no warning - just a total that is missing the rows it silently declined to add. The same silence has a bigger version outside the spreadsheet: a product importer that [reports success and quietly skips the rows it declined](https://dayonebuilder.online/blog/import-said-success-rows-missing/).

Where the text comes from, roughly in order: a CSV or platform export where every column arrives as text; a leading apostrophe someone typed to "keep the formatting"; a currency symbol or thousands separator typed into a text-formatted cell; a cell formatted as Text *before* the number was entered; and the nastiest one - a **non-breaking space** (character 160) riding along from an HTML or web export. That last one is invisible, and `TRIM` will not remove it: TRIM was built for the plain ASCII space, character 32. You need `=VALUE(SUBSTITUTE(TRIM(A2),CHAR(160),""))`.

> **The trap** Formatting the column as Number does **not** fix this. A number format changes how a value is shown, never what it is - a text cell wearing a Number format is still text. This is the single most common reason people conclude "the file is cursed" and start over.

In Google Sheets the same fixes apply, minus the green triangle. Sheets sees more of this than Excel does, for one boring reason: locale. A European export written `1.234,56` dropped into a US-locale sheet isn't a number at all - it's a string with punctuation in the wrong places. Re-import with the right locale, or convert explicitly.

## 2. The range stopped growing

- **Tell:** The total is **plausible**, just low. Nothing errors. It has probably been wrong for months.

- **Why:** `=SUM(B2:B50)` was written when the data ended at row 50. It now ends at row 812. Rows appended **below** a range never join it.

- **Fix:** An Excel Table (`Ctrl+T`) whose total grows with the data, a whole-column `=SUM(B:B)`, or in Sheets an open-ended `=SUM(B2:B)`.

Cause #1 is the loudest; this one is the most expensive, because it never looks like a bug. Revenue is "down a bit this quarter" and nobody suspects the total - they suspect the market. Inserting a row *inside* a range extends it automatically, which is exactly why people trust ranges they shouldn't: the failure only shows up when data is appended past the end, which is how every export in the world adds data.

Excel Tables are the real fix rather than the clever one. A Table knows where its data ends, so the total, the chart and every formula referring to it move together. Whole-column sums work too, as long as the column holds nothing but that data - no stray note at the bottom, no second total parked underneath.

## 3. Rows are counted twice

- **Tell:** The total is **higher** than the source system says. Often suspiciously close to double, or to 1.5×.

- **Why:** An export ran twice, someone pasted the same batch again, or a lookup fanned out - one order matched three rows in a table with repeated keys.

- **Fix:** Deduplicate on a **stable key** (order id, or order id + line number), never on "the row looks the same". `UNIQUE` in Sheets, Remove Duplicates in Excel.

Compare `=COUNTA(A2:A500)` with `=COUNTUNIQUE(A2:A500)` in Sheets, or `=SUMPRODUCT((A2:A500<>"")/COUNTIF(A2:A500,A2:A500&""))` in Excel. A gap means repeated keys - which is either duplicate rows, or a legitimately repeating key that your lookup is about to multiply.

> **Careful here** Deduplicating on the whole row deletes real data. Two identical sales of the same item, same price, same day are two sales, not one row typed twice. Key on the identifier, not on the row's appearance - and if there is no identifier, that's the actual finding: the export needs one before the report can be trusted.

## 4. The lookup matched the wrong row

- **Tell:** Some rows are right, some are wrong, and there is no pattern you can see. Spot-check five rows by hand and two are nonsense.

- **Why:** VLOOKUP's fourth argument defaults to **approximate match**. Left out, it returns the next largest value below yours - and it needs the data sorted ascending, which nobody checks.

- **Fix:** Exact match, always: `FALSE` as the fourth argument, or `XLOOKUP`, which is exact by default, or `INDEX`+`MATCH` with a `0`.

This one is dangerous precisely because it is not an error. `=VLOOKUP(A2,Prices!A:C,3)` - no fourth argument - will happily return a price. Just not always the right one. On sorted data it mostly works, which is how it survives review; on unsorted data it returns whatever happened to sit above the gap.

Two companions worth checking at the same time. **Key mismatch:** `"00123"` as text and `123` as a number are different keys, and so are `"Acme Ltd"` and `"Acme Ltd "` with its trailing space - the second is a genuine, and genuinely infuriating, cause of a report being 40% #N/A. **Column drift:** a VLOOKUP's column index is a plain number, so the day someone inserts a column into the source table, `3` quietly starts pointing at the wrong column. XLOOKUP and INDEX+MATCH refer to the column itself and survive it.

## 5. Hidden and filtered rows are still in the total

- **Tell:** The screen shows 12 rows; the total belongs to all 40. Filter to "Paid" and the number doesn't move.

- **Why:** SUM does not care what you can see. Hiding a row is a display choice, not a data one.

- **Fix:** `=SUBTOTAL(109,B2:B500)` ignores both filtered-out and manually hidden rows. `=SUBTOTAL(9,...)` ignores filtered rows but keeps hidden ones - worth knowing which you want.

The real damage here isn't the wrong number, it's the screenshot: a filtered view and a SUM in the same picture, pasted into an email, read by someone who reasonably assumes they belong to each other. If a total is going to be read next to a filter, it has to obey the filter. That is SUBTOTAL's entire job, or AGGREGATE's if you also want it to step over error values while it works.

## 6. IFERROR turned your errors into zeros

- **Tell:** Nothing at all. No error anywhere on the sheet. The total is simply, calmly wrong.

- **Why:** `=IFERROR(VLOOKUP(...),0)` - every failed lookup becomes a zero, and zeros disappear into a sum without trace.

- **Fix:** Guard, don't hide: `=IFERROR(VLOOKUP(...),"CHECK")`, then `=COUNTIF(C2:C500,"CHECK")` tells you how many rows failed.

Of the seven, this is the one I'd call self-inflicted, and it comes from a good instinct. The sheet was full of `#N/A`, someone tidied it up, and the tidying worked: the errors are gone. So is the information that 60 rows never found a price. A zero is a claim - it says "this row contributed nothing" - and IFERROR let the sheet make that claim 60 times without being asked.

If that `IFERROR` was written for you by an AI, it is worth knowing why: asking a model to make the errors stop is exactly the request that produces a silencer. I take that apart in [ChatGPT wrote your script. Your real data broke it.](https://dayonebuilder.online/blog/chatgpt-code-broke-on-real-data/)

The rule I hold to on every file I touch: a guard formula may **flag** a problem, never swallow it. `"CHECK"` in a cell is impossible to ignore and impossible to sum. A zero is easy to ignore and sums beautifully. If a number is going to be wrong, let it be loudly wrong.

## 7. Rounding: what you see isn't what you sum

- **Tell:** The total is off by cents. Every individual row looks perfect. Someone in accounts has noticed and is not letting it go.

- **Why:** The cell displays 2 decimals and stores 8. You are summing the 8, and reading the 2.

- **Fix:** `=ROUND(x,2)` where the value is **calculated**, not in the number format. Format changes the display; ROUND changes the value.

A hundred rows each hiding a third decimal will drift the total by a few cents, and "a few cents" is enough to make a finance team distrust the whole report - correctly, as it happens, because a number that can't be reproduced by hand isn't much of a number.

Underneath this sits real floating-point arithmetic: Excel follows the IEEE 754 standard and keeps 15 digits of precision, so a handful of decimal fractions genuinely cannot be stored exactly, and the classic `0.1 + 0.2` lands a hair off 0.3. It's rarely your actual bug - display rounding beats it to the punch nearly every time - but it's the reason the fix is ROUND at the point of calculation rather than trusting the arithmetic to be tidy.

> **Don't reach for this one** Excel's **Set precision as displayed** option looks like it solves this in one click. It solves it by permanently overwriting your stored values with the rounded ones. There is no undo, and the data you threw away is gone for good.

## The one that isn't a cause at all

Before you go hunting: in Excel, press **F9**. If the total changes, nothing was broken - the workbook was in manual calculation mode and the total was simply stale. Someone switched it on years ago to speed up a heavy file, and it followed the file forever. Google Sheets has no equivalent, which is one thing it genuinely gets right.

## Which one is it: symptom table

| The total is... | Look here first | Confirm with |

|---|---|---|

| 0, or wildly too low | Text numbers (#1) | `COUNT` vs `COUNTA` |

| Believable, but low | Range stopped growing (#2) | `COUNTA(B:B)` vs your range |

| Higher than the source system | Duplicate rows (#3) | Unique count vs row count |

| Right in places, wrong in others | Lookup matched wrong (#4) | Hand-check 5 rows |

| Ignoring your filter | Hidden rows (#5) | `SUM` vs `SUBTOTAL(109,...)` |

| Wrong, with no error in sight | IFERROR zeros (#6) | Search formulas for `IFERROR` |

| Off by cents | Display rounding (#7) | Widen the decimals and look |

| Changing when you press F9 | Manual calculation | Formulas → Calculation Options |

## Six changes that stop it coming back

> Short version: the fix is one afternoon. Making the file incapable of lying to you again is the same afternoon, if you do it while you're already in there.

1. **One table, one shape** - Excel Table or open-ended range. Ranges with hard-coded ends are a time bomb, and the timer runs out the day the data outgrows them.

2. **Clean keys on arrival, not at lookup time** - TRIM and type-normalise the identifier column as it enters the sheet. Every downstream lookup then works on keys that are actually equal.

3. **Guards that flag, never hide** - `"CHECK"`, not `0`. Plus one cell counting the CHECKs, so a broken row has somewhere to show up.

4. **Exact match only** - XLOOKUP, or FALSE. There is no report where "the closest price below yours" is the intended behaviour.

5. **A reconciliation cell** - One cell: your total minus the source system's total. It should read 0. When it doesn't, you learn on the day it breaks - not in the quarterly review.

6. **ROUND where you calculate** - Decide the precision once, in the formula. The number format is for humans, not for arithmetic.

The reconciliation cell is the one to take if you take only one. Everything above is about finding a wrong number; that cell is about the wrong number finding *you*, immediately, which is a much better arrangement. It's also the cheapest thing on the list - a subtraction and a conditional format.

The same idea travels well past spreadsheets. A contact form that only sends an email has nothing to reconcile against, which is how [a form can keep saying thank you while no enquiry reaches anyone](https://dayonebuilder.online/blog/form-said-thanks-email-never-came/).

## Common questions

### My SUM shows 0, but the cells clearly contain numbers.

They contain things that look like numbers. SUM ignores text in a referenced range rather than erroring, so a column of text numbers totals to a confident 0. Run `=COUNT(B2:B500)` against `=COUNTA(B2:B500)`: COUNT sees only real numbers, so if it comes back lower, that's your answer in about four seconds.

### Why doesn't formatting the column as Number fix it?

Because a number format governs how a value is displayed, not what the value is. Text wearing a Number format is still text. You have to convert: Convert to Number on Excel's error indicator, a Paste Special multiply by 1, or `VALUE()`. In Sheets, `VALUE()` or a re-import with the correct locale.

### The total changed after someone sorted the sheet.

Usually the sort covered part of the table rather than all of it - one column selected instead of the whole range - so rows were scrambled against each other. The arithmetic may be flawless while every row now pairs the wrong client with the wrong amount. Undo immediately if you can, and sort the whole table, or use an Excel Table, which sorts as a single object.

### Is Google Sheets more reliable than Excel for this?

No. All seven exist in both, with the same fixes. Sheets sees more text-number trouble, because it lives on imports and locale mismatches. Excel sees more stale totals, because it has a manual calculation mode. Pick on other grounds.

### How long does it take to find which one it is?

The triage is three formulas and about a minute, and in most files it names the cause outright. The fix is usually the same day once you know what you're fixing. The honest exception: a report assembled from several exports whose totals disagree because the *sources* disagree. No formula shortens that one - it's reconciliation work, and anyone promising otherwise hasn't opened the file.
