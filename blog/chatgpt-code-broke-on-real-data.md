# ChatGPT wrote your script. Your real data broke it.

> Your ChatGPT code works on sample data but not real data. The example had 10 clean rows; your export has 5,000 messy ones. How to tell crashed from lying.

Source: https://dayonebuilder.online/blog/chatgpt-code-broke-on-real-data/
Author: Ben Ison — Python / AI Engineer — https://dayonebuilder.online/
Published: 2026-07-17
Language: en

---
It ran perfectly on the sample rows. On your actual file it either died or, worse, handed you a number that looks right and is not. Here is why that happens, and what to do about it.

You asked ChatGPT for a script. It gave you one, politely, in seconds. You pasted it in, ran it on a few rows, and it worked. Then you pointed it at the actual file, and it either fell over or - the worse outcome - it did not fall over at all and handed you a number.

Both of those have the same root, and it is not that you did something wrong.

## Why did it work on the example and not on your data?

> Short version: ChatGPT code works on sample data but not real data because ten clean rows cannot fail. The sample was too small to tell a good script from a bad one. Your real file fails in ways the sample could not: blank rows, numbers that arrived as text, three date formats, a column somebody renamed last spring.

Think about what the model actually saw. It saw the shape of your problem, described in a sentence or two, plus maybe a handful of sample rows you typed by hand.

Those rows were clean, because you made them. Every number was a number, nothing was blank, and there was one date format. Nobody had sorted the sheet at 2am or pasted a column out of a bank export.

Your real file is none of those things. It has 5,000 rows that arrived from six directions over three years. It has a column where 40 entries are text because they came out of an export. It has a blank row in the middle that somebody left as a visual separator.

The script did not change between the two runs. The data did. That is the whole story, and the rest of this article is the detail.

## Is it crashed, or is it lying?

> Short version: a crashed script and a lying script are two different problems with two different fixes, and confusing them wastes your afternoon. A crash is loud and honest: it tells you something broke and roughly where. A wrong number is quiet and expensive, and it will sit in your reports until somebody happens to check.

Before you touch anything, sort your situation into one of these:

| What you see | What kind of broken | Where to go |

|---|---|---|

| An error message, a red box, "Exceeded maximum execution time", nothing happens at all | Crashed | The three timeout sections below |

| It finishes, reports success, and gives you a number you do not trust | Lying | From "the number is wrong and nothing errored" onwards |

| It finishes, and some rows are updated and some are not | Both, and this is the nastiest | The checklist section, and read every word |

If the symptom is that your totals look wrong and no script is involved at all, you are in a different building: I took the seven real causes apart in [why your spreadsheet total is wrong](https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/), and the [60-second triage](https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/#the-60-second-triage) there tells you in three formulas whether the data is lying or the formula is.

The same split shows up when the tool is not yours at all: a platform importer can finish, report success, and [leave rows out without raising a single error](https://dayonebuilder.online/blog/import-said-success-rows-missing/).

## What "Exceeded maximum execution time" actually means

> Short version: Google gives any Apps Script six minutes per run, then stops it dead at whatever line it was on. The limit is identical on a free account and a paid Workspace one, so upgrading changes nothing. The reason it appears out of nowhere is that your file crossed the threshold, and the script that fit last quarter no longer does.

Google's quota page is blunt about the consequence:

> If you exceed a quota or limitation, your script throws an exception and execution stops.
> - [Google, Quotas for Google Services](https://developers.google.com/apps-script/guides/services/quotas)

Six minutes per execution, consumer and Workspace alike. Custom functions - the kind you call from inside a cell with `=myFunction()` - get 30 seconds.

The part that makes people think their file is haunted is that this arrives late. Here is a real one from Google's own community forum:

> Just recently my google script has been returning an error message of Exceeded Maximum Execution Time. I've been running the script for months and have never had any issues until last week. It errors out usually in the morning but will run just find [sic] by mid-day. Nothing has changed in the script since I first wrote it.
> - [Cameron Coile, Google Apps Script Community](https://groups.google.com/g/google-apps-script-community/c/5VITsm55SS0)

Nothing changed in the script. The file grew. A script that needs five and a half minutes today needs six and a half next quarter, and then it is over. The time-of-day thing is real too: a loaded morning is slower than a quiet lunchtime, so the same script passes at noon and fails at 9am, which feels exactly like a haunting and is just arithmetic.

## Why does the same script take 70 seconds instead of one?

> Short version: because the model wrote a loop that talks to the sheet once per cell. Google's own documentation puts the cost of that at 70 seconds against 1 second for the same result. On ten rows you cannot see the difference. On five thousand, one of them dies.

This is the single most useful thing to understand here, so let me use Google's numbers rather than mine:

> Alternating read and write commands is slow. To speed up a script, read all data into an array with one command, perform operations on the array data, and write the data out with one command.
> - [Google, Apps Script Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)

And the measurement, on the same 100x100 block of cells:

> The inefficient code takes about 70 seconds to run, while the efficient code runs in just 1 second.
> - [Google, Apps Script Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)

Seventy times, for output that is character-for-character identical.

Now, why does a model reach for the slow one? Because reading a cell, doing something, writing the cell back is the obvious way to say it, and the obvious way is what shows up most in the text it learned from. The choice is a reasonable one. It only becomes wrong at a volume the model was never shown.

An expert on the same Google forum names the culprit in one line:

> The classic example is setting Sheet cell values individually, one per loop.
> - [Alan Wells, Google Apps Script Community](https://groups.google.com/g/google-apps-script-community/c/5VITsm55SS0)

Here is what that pattern costs on a real sheet. One user measured his own script at nearly five minutes for a single pass over 500 rows:

> to run through the 500 rows looking for one email address once and generate an HTML email of 13 rows takes nearly 5 minutes
> - [Dean Barrett, Google Apps Script Community](https://groups.google.com/g/google-apps-script-community/c/IMCFHQcWWEw)

Sit with that rate for a second. Five minutes for 500 rows is about 0.6 seconds per row, and the arithmetic from there is mine, not Google's: against today's six-minute ceiling, a script running at that rate is finished at roughly 600 rows. Your file has 5,000. It never had a chance, and the ten-row test could not have told you.

## Why "just make it faster" cannot work

> Short version: sometimes the ceiling is arithmetic rather than code quality. When a script needs 105 minutes of network calls and the platform allows six, no rewrite closes that gap, and the model will cheerfully keep producing rewrites anyway. Knowing which kind of wall you are against saves you an afternoon of pasting errors into a chat window.

The clearest case on the forum: a user needed about 2,100 order numbers, each one a separate call out to an API.

> Each URL request can take 3-5 seconds to process and doing 2100 of them will certainly not be possible ever within the 6 mins window.
> - [George Ghanem, Google Apps Script Community](https://groups.google.com/g/google-apps-script-community/c/HyCxPjvwyI4)

Do that multiplication: 2,100 requests at 3 seconds each is 105 minutes against a 360-second ceiling. You are not 10% over. You are off by a factor of seventeen. That job needs a different shape entirely - batching, saved progress, a trigger that picks up where the last run stopped - and no amount of "please optimise this" produces a different shape, because you did not ask for one.

Which brings up the loop most people are stuck in when they give up: paste the error back, get a rewrite, run it, paste the next error. It feels like converging. Someone on Hacker News put the problem with it better than I could:

> my gut reaction to "take an AI-inflated codebase and apply AI deflation to it" is something like "that's akin to applying two rounds of lossy transcoding; the errors don't cancel out, they cross-multiply"
> - [fwlr, Hacker News](https://news.ycombinator.com/item?id=48825761)

Each rewrite starts from scratch. It can quietly change logic you never asked it to touch. And piling more of the conversation in does not help as much as you would hope. Chroma's research on long context found that "models do not use their context uniformly; instead, their performance grows increasingly unreliable as input length grows" ([Context Rot](https://www.trychroma.com/research/context-rot)).

If you have pasted the final fixed version five times and it still fails, that is information. It means the loop cannot close from where you are standing.

## The number is wrong and nothing errored. Why?

> Short version: your script assumed a number and your export handed it a string that looks exactly like one. Nothing crashes, because nothing is technically wrong - the formula simply skips what it does not recognise. The total comes out quietly short, and there is no error message anywhere to tell you that it did.

This is the failure that costs real money, and it has no error message at all.

Microsoft states both the cause and the tell:

> This issue sometimes occurs after you import or copy data from a database or other external data source.
> - [Microsoft Support, Fix text-formatted numbers by applying a number format](https://support.microsoft.com/en-us/office/fix-text-formatted-numbers-by-applying-a-number-format-6599c03a-954d-4d83-b78a-23af2c8845d0)

And the free five-second diagnostic, from the same page:

> Numbers that are formatted as text are left-aligned instead of right-aligned in the cell, and are often marked with an error indicator.
> - [Microsoft Support](https://support.microsoft.com/en-us/office/fix-text-formatted-numbers-by-applying-a-number-format-6599c03a-954d-4d83-b78a-23af2c8845d0)

Look at the column the script reads. If the values hug the left edge, the spreadsheet does not think they are numbers, and every calculation written on top of them is suspect. The sample rows you gave the model did not have this problem, because you typed them.

Locale is the other one, and it is worse because it produces a wrong number rather than no number. Google's rule for CSV files:

> When the decimal number separator is period, the delimiter is comma. When the decimal number separator is comma, the delimiter is semicolon.
> - [Google, Configure the CSV locale](https://support.google.com/appsheet/answer/11512216?hl=en)

A European export written `1.234,56` read under a US locale comes out as a different number entirely - and it still looks perfectly reasonable sitting in the cell.

Both of these live under the same roof as the classic spreadsheet failures. I covered them at the cell level in [your numbers are text](https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/#1-your-numbers-are-text) and, for the lookup the model almost certainly wrote without an exact-match argument, [the lookup matched the wrong row](https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/#4-the-lookup-matched-the-wrong-row).

## Why does it sound so certain?

> Short version: ChatGPT sounds certain because it was trained to. OpenAI's own researchers, with Georgia Tech, published a paper saying models guess when uncertain rather than admit it - and the guess arrives specific and confident, not hedged, because hedging scores worse on the exams the model is measured by.

This comes from OpenAI's own researchers, working with Georgia Tech, on the subject of their own product:

> Like students facing hard exam questions, large language models sometimes guess when uncertain, producing plausible yet incorrect statements instead of admitting uncertainty.
> - [Kalai, Nachum, Vempala and Zhang, Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664)

"Plausible yet incorrect" is the whole problem in three words. And the shape of the bluff matters:

> Bluffs are often overconfident and specific, such as "September 30" rather than "Sometime in autumn" for a question about a date.
> - [Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664)

So the answer never arrives hedged. A model that said "I am not sure how your date column is formatted" would be more useful and would score worse on the exams it is measured by. As the paper puts it, they are "always in test-taking mode".

There is a deeper reason it cannot know your file. The same paper argues the error floor is set by how often a fact appeared in training - facts seen once tend to get hallucinated. Your column names, your business rules, the reason row 400 is blank: those appeared exactly zero times. The model can write generic Apps Script well. It cannot know your data at all, and it will not say so.

## Is this your fault?

> Short version: no, and there is measurement to back that up. Two thirds of professional developers - people who read code for a living - name almost-right AI output as their single biggest frustration. You are not failing at something everyone else finds easy. You are standing at the far end of a documented, industry-wide problem.

The 2025 Stack Overflow Developer Survey asked over 31,000 developers about their biggest frustration with AI tools. The top answer:

> AI solutions that are almost right, but not quite - 66%
> - [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/ai)

Second place: debugging AI-generated code is more time-consuming, at 45.2%. And on trust, distrust now outweighs trust: 45.7% against 32.7%.

Sixty-six percent of people who read code for a living get burned by almost-right output. You do not read code for a living. This is not a skill gap you should feel bad about - it is a documented, industry-wide problem, and you are standing at the far end of it.

Two more measurements worth knowing, because they are about the part nobody suspects: how badly people judge their own work.

Ray Panko, who has spent decades measuring spreadsheet errors, ran a study where the people building a sheet - students, in this case - were asked how likely it was they had made a mistake. The median guess was 10%. In reality, 86% had made one. Then:

> When debriefed in class and asked to raise their hands if they thought they were among the successful 14%, well over half of all subjects raised their hands.
> - [Ray Panko, Spreadsheet Errors: What We Know. What We Think We Can Do.](https://eusprig.org/wp-content/uploads/0802.3457.pdf)

And a 2025 randomised trial by [METR](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) on 16 experienced open-source developers found they expected AI to make them 24% faster, actually finished 19% slower, and afterwards still believed it had sped them up by 20%.

Put those together and you get the honest picture: a machine trained to sound certain, handed to a human who is measurably bad at knowing when they are wrong. That is why a second pair of eyes is worth money.

## Where the model quietly cuts corners

> Short version: six corners, and they are predictable once you know their names. None of them is the model being stupid - each is a sensible default that only turns wrong when it meets a file nobody showed it. Every one is invisible on a ten-row test sheet and expensive on a real one.

None of these are the model being stupid. Each is a reasonable default that only turns wrong once it meets a file it was never shown.

| The corner | What it looks like on your file | Why the ten-row test missed it |

|---|---|---|

| Redesigns instead of repairing | Your process quietly gets replaced by a better one you did not ask for | The test had no process, just rows |

| Answers a different question | A plausible number at the wrong level of aggregation | One day of sample data cannot disagree with itself |

| Never writes the empty case | Works until the day a lookup finds nothing | Your sample always found something |

| Reaches for "the current file" | Real arithmetic on yesterday's copy | You never duplicated the test sheet |

| Installs a silencer | Nothing ever fails, and the total is wrong | Clean data has nothing to complain about |

| Reports one "done" per batch | Failed rows never raise their hand | Ten rows all passed |

**It redesigns instead of repairing.** Ask it to fix one step and you often get an improved architecture you did not order. Say your process is: export, paste values into a second file, check them by eye. Ask for help with the paste, and a live link between the two files comes back. Elegant, works in the demo, and now both files must be open, in sync and alive forever - and the process you actually chose has been quietly cancelled. The model optimised the code. It never saw the process.

**It answers a different question with a plausible number.** You ask for sales by day and get sales for the whole period, spread across the rows. Nothing errors, nothing turns red, and you get a number. On your ten-row sample covering one day, right and wrong look identical - the sample is too small to disagree.

**It never writes the empty case.** AI code assumes the lookup finds something and the list has rows in it. The day the set comes back empty, the run dies - or worse, a zero slides into the total and nobody notices.

**It reaches for "the current file".** A script written against the active spreadsheet keeps holding the original after you duplicate the file. The arithmetic is fine and the numbers are real - they are just from yesterday's copy.

**It installs a silencer.** You say "make the errors stop" and it wraps everything so that nothing ever appears to fail. GitClear, analysing 623 million code changes, measured error-masking constructs up 47% in the AI-assisted era. A crash is a gift: it tells you something broke. A silenced error hands you a plausible total and says nothing. If your script never complains about anything on messy real data, treat that as a symptom. I take the spreadsheet version of this apart in [IFERROR turned your errors into zeros](https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/#6-iferror-turned-your-errors-into-zeros).

**It reports one "done" for a whole batch.** Rows that failed do not raise their hand. The fix is the thing models almost never write unless asked: a status written next to every single row, so failure has somewhere to appear. Websites fail this way one level up: a single thank-you screen stands in for four separate stages of delivery and can only see the first, which is [the contact form that says thanks while the enquiry goes nowhere](https://dayonebuilder.online/blog/form-said-thanks-email-never-came/).

## How do you take a draft to production?

> Short version: six checks turn an AI-written draft into something you can actually trust. You do not need to read a line of code to run any of them, and together they catch nearly everything above. If you only ever do one, do the second: compare the new number against a number you already know.

1. **Work on a copy. Always.** File, Make a copy, run it there. A script that writes cells is not undoable in bulk once a trigger has fired. Google is explicit that execution stops - and nothing rolls back the five minutes of writing it already did. That leaves you with a half-processed file that looks like real data. Copy first, and this whole class of disaster stops existing.
2. **Reconcile against one number you already know.** Before you believe anything: does the new total match last month's bank figure, or the row count you can see at the bottom of the sheet? One independent number is enough to catch most silent wrongness. This is the single highest-value check on the list, and it costs a subtraction.
3. **Say out loud how many rows it must survive.** "It works" is not a specification. "It works on 5,000 rows and 3 years of history" is. Give the model, or the person, that number up front - the 70-seconds-instead-of-one failure is a script built for a number nobody stated.
4. **Ask for a status per row, not a summary.** One "done" at the end hides everything. A column that says why row 214 was skipped turns an invisible failure into a visible one.
5. **Test on the ugliest real data you have.** Not a clean sample. The month with the blank rows, the odd date format, the client whose name has a trailing space. If it survives your worst file, it will survive the rest.
6. **Get a run you can repeat.** If you cannot reproduce the failure on demand, you cannot fix it, and neither can the model. This is why the paste-the-error loop stalls: you are handing over a description of the symptom and hoping the failure comes with it.

## When to stop rewriting and hand it over

> Short version: after the second failed rewrite, stop asking for fixes and start collecting evidence instead. The loop is not converging - it is repairing your description of the symptom. What a person needs from you is small: the error text, a copy of the file, and the number you expected to see.

There is a paradox in getting help here, and someone on Hacker News named it exactly:

> Do you expect the client to sit down and explain every detail? If they know how to do that, they wouldn't be having messy code base as the one the post is describing.
> - [Oras, Hacker News](https://news.ycombinator.com/item?id=48825456)

You cannot fully specify the fix, and you cannot fully evaluate it either. So do not try to. Ask for evidence instead - it is the one thing you can check without reading code:

- The work was done on a copy, and your live file is untouched.
- A before-and-after check against a number you already knew.
- A stated row count the fix is tested to.
- One plain sentence naming the cause, and which parts not to edit.

That list is a fair thing to demand from anyone, including me. It is also what I hand back by default: the cause in plain words, the fix verified on a copy of your data, and a note on what not to touch. If you would rather not run the six checks yourself, [that is the kwork](https://kwork.com/scripting/53560025/i-will-fix-the-code-chatgpt-gave-you-that-breaks-on-your-real-data) - send the error text and a copy of the file, and I will tell you which of these it is. If it turns out to be bigger than one failing scenario, I say so before you pay, not after.

## Common questions

### The script worked for months and just started failing. Nothing changed.

The code did not change. The file grew. The most common version is a script that needs five and a half minutes on a sheet that gets a little longer every week - and Apps Script stops at six, on free and paid accounts alike. The tell is that it fails in the busy morning and passes at lunchtime.

### Should I just ask ChatGPT to fix its own code?

Once, sure. It often works. But if you have been round that loop twice and it still fails, stop: each rewrite starts from scratch, so it can change logic you never asked it to touch. And when the ceiling is arithmetic - 2,100 network calls against a six-minute limit - no rewrite gets there. Collect a reproduction instead: the smallest slice of real data that reliably breaks it.

### How do I know if the number it gave me is actually right?

Compare it to one number you already know from somewhere else. Last month's total, the count at the bottom of the sheet, an invoice you can see. If those two disagree, you have your answer without reading any code. If you have no independent number to compare against, that is worth fixing before anything else - a report nobody can check is not a report.

### Is a paid tier or a better model going to solve this?

Not for the six-minute limit: Google publishes the same runtime ceiling for consumer and Workspace accounts. And a better model does not know your data any better - your column names and business rules were not in its training data at any tier. Better models write cleaner generic code. The gap between generic and yours stays exactly where it was.

### I do not understand the code at all. Is that a problem for getting it fixed?

No - that is the normal case here. The code is readable on its own; the story behind it is not needed. What is needed is what you expected to see, what you got instead, and a copy of the data it failed on. In plain words, with no technical terms.

## Sources

- Google, Quotas for Google Services (Apps Script) - the 6-minute runtime limit, identical for consumer and Workspace: https://developers.google.com/apps-script/guides/services/quotas
- Google, Apps Script Best Practices - batch operations, and the 70 seconds vs 1 second measurement: https://developers.google.com/apps-script/guides/support/best-practices
- Kalai, Nachum, Vempala, Zhang (OpenAI / Georgia Tech), Why Language Models Hallucinate, 2025 - "plausible yet incorrect", bluffs are specific, test-taking mode: https://arxiv.org/abs/2509.04664
- Stack Overflow Developer Survey 2025 - "almost right, but not quite" 66%, debugging cost 45.2%, trust vs distrust: https://survey.stackoverflow.co/2025/ai
- Ray Panko, Spreadsheet Errors: What We Know. What We Think We Can Do. (EuSpRIG, 2000) - predicted 10% error rate, actual 86%: https://eusprig.org/wp-content/uploads/0802.3457.pdf
- Microsoft Support, Fix text-formatted numbers by applying a number format - imports produce text, left-aligned tell: https://support.microsoft.com/en-us/office/fix-text-formatted-numbers-by-applying-a-number-format-6599c03a-954d-4d83-b78a-23af2c8845d0
- Google, Configure the CSV locale - decimal separator and delimiter pairing: https://support.google.com/appsheet/answer/11512216?hl=en
- GitClear, The Maintainability Gap: AI Code Quality in 2026 - error-masking constructs up 47% across 623 million code changes: https://www.gitclear.com/the_ai_code_quality_maintainability_gap
- Chroma (Hong, Troynikov, Huber), Context Rot: How Increasing Input Tokens Impacts LLM Performance - models do not use context uniformly: https://www.trychroma.com/research/context-rot
- METR, Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity - expected +24%, actually 19% slower, still believed +20%: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
- Google Apps Script Community - "Exceeded Maximum Execution Time" after months of working: https://groups.google.com/g/google-apps-script-community/c/5VITsm55SS0
- Google Apps Script Community - 500 rows taking nearly 5 minutes: https://groups.google.com/g/google-apps-script-community/c/IMCFHQcWWEw
- Google Apps Script Community - 2,100 API calls against a 6-minute window: https://groups.google.com/g/google-apps-script-community/c/HyCxPjvwyI4
- Hacker News - "the errors don't cancel out, they cross-multiply": https://news.ycombinator.com/item?id=48825761
- Hacker News - on clients being unable to specify the fix: https://news.ycombinator.com/item?id=48825456

Broken script, and you would rather just have it working? Send me the error and a copy of the file. I find the cause, fix one failing scenario, verify it on your data, and tell you in plain words what broke and what not to touch. $10, payment held by Kwork until you accept: [I will fix the code ChatGPT gave you that breaks on your real data](https://kwork.com/scripting/53560025/i-will-fix-the-code-chatgpt-gave-you-that-breaks-on-your-real-data).
