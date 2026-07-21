# Your form, your spreadsheet, and the three wires between them

> Apps Script, a no-code bridge, or a real backend. What each way of getting a form into Google Sheets actually costs you the day traffic shows up.

Source: https://dayonebuilder.online/blog/form-to-sheets-three-ways/
Author: Ben Ison — Python / AI Engineer — https://dayonebuilder.online/
Published: 2026-07-22
Language: en

---
There are three honest ways to get a web form into a Google Sheet, and every guide picks one and calls it the answer. Here is what each costs you, and the day each one quietly starts dropping submissions.

Every guide to connecting a web form to a Google Sheet does the same thing. It picks one method, walks you through it, and calls it *the* way. Then a different guide picks a different method and calls that one the way. None of them tells you the thing you actually need, which is what the method costs you six months later, on the morning your form finally gets busy.

There are only three honest ways to do this. A Google Apps Script, a no-code bridge, or a real backend of your own. Each one works. Each one fails, and it fails in a specific, predictable place. The trick is not picking the "best" one, because there isn't a best one. The trick is knowing where each will let you down, so you pick the one whose failure you can live with.

So this is not a tutorial for one method. It is the map you read before you choose.

## What is every connection actually doing?

> Short version: whichever method you pick, the job underneath is the same four steps. The form collects the data, something carries it across the internet, something writes it into a row, and something tells you it happened. Every method does all four. They differ only in who does each step and what breaks when a step is under load.

Hold those four steps in your head, because they are how you judge any method a guide throws at you:

1. **Collect** - The form takes what the visitor typed. This part almost never fails, and every method does it the same way.

2. **Carry** - The data travels from the browser to wherever the row gets written. This is where a surprising amount goes wrong, because browsers guard this crossing with rules a tutorial rarely mentions.

3. **Write** - Something appends a row to your sheet. Under one submission at a time this is trivial. Under ten at once it is where rows quietly overwrite each other.

4. **Confirm** - Something decides what the visitor sees and whether you find out a submission arrived. A method that skips this step is the subject of the [article before this one](https://dayonebuilder.online/blog/form-said-thanks-email-never-came/).

A method is not good or bad in the abstract. It is good or bad at each of these four under the load you will actually put on it. Keep the four in mind and the three methods below sort themselves out.

## Apps Script is free, so what does it cost?

> Short version: a Google Apps Script is the free option, and it is genuinely fine for a form that gets a few submissions a day. It has two limits that do not matter at all until they suddenly do, and both of them drop submissions without telling anyone.

Apps Script is Google's own scripting language, it runs on Google's servers, and it can write to your sheet directly. No third party, no monthly fee. For a contact form on a small site it is often the right answer, and I say that as someone who is not selling you a plugin.

Here is the first limit, in Google's own numbers. A script gets [six minutes per execution and thirty simultaneous executions per user](https://developers.google.com/apps-script/guides/services/quotas). Those numbers are the same whether your account is free or a paid Workspace one, so paying Google more does not raise them. On a quiet form you will never come near either. On the morning a post of yours does well and forty people hit submit at the same moment, the thirty-first is not slowed down. It is dropped, and that visitor saw a spinner and gave up.

The second limit is quieter and worse, because it has no number attached at all. When two submissions arrive at the same instant, both scripts run, both read "the sheet has 200 rows," and both write to row 201. One of them wins. The other submission is gone, and nothing anywhere recorded that it existed. Google's own fix for this is a lock:

```javascript
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);            // wait up to 30s for the other write to finish
  try {
    SpreadsheetApp.openById(ID)
      .getSheetByName('Leads')
      .appendRow([new Date(), e.parameter.name, e.parameter.email]);
  } finally {
    lock.releaseLock();
  }
}
```

Four lines of ceremony around one line of work. Almost every copy-paste Apps Script tutorial online omits them, because on the author's test of one submission at a time they change nothing. They change everything on the day two people submit at once, which is also the only kind of day you were hoping to have.

> **The tell** If your form script is the version from a tutorial and does not contain the word `LockService`, it is not that it might drop a submission under load. It is that it will, and you will never see which one, because a dropped write leaves nothing behind to find.

There is a third snag with Apps Script that is not about volume at all. If your form submits with modern JavaScript, the browser applies a safety rule that limits how one site may talk to another, and it often blocks your page from reading the script's reply. The submission can succeed while your page thinks it failed, or the reverse. It is fixable, but it is exactly the kind of thing that works on the developer's machine and breaks on a real visitor's.

## A no-code bridge is fast, but for how long?

> Short version: services like Sheet Monkey, Formspree and Web3Forms sit between your form and your sheet so you write no code at all. You paste a URL into your form and you are done in five minutes. The cost is not the failure of the tool. It is the month you hit its free cap or its price, whichever comes first.

These bridges are good at exactly the two things Apps Script is weakest at. They handle simultaneous submissions properly, and they handle the browser's cross-origin rules for you. If you do not want to touch code, one of them is very likely your answer for the first year.

Read the pricing before you commit, because the free tiers are shaped to run out at the moment you get traction. [At the time of writing](https://sheetmonkey.io/pricing), Sheet Monkey's free tier stops at 100 submissions a month and its first unlimited plan is seven dollars; Web3Forms gives 250 a month free; Formspree gives 50 free and, tellingly, only reaches an actual Google Sheet through a second paid service on top. None of these numbers is a problem. The problem is only that the number exists, and that you will meet it in a good month, not a bad one.

There is one detail worth checking that has nothing to do with price. A few of these services expose your sheet through an API that can read as well as write. A write-only connection can only add rows. A read-capable one, if its key leaks, can hand your entire list of customers to whoever found the key. When you pick a bridge, the question to ask is not "how much" but "can this thing read my sheet, or only add to it."

## A real backend: solid, and honest about the work

> Short version: the third way is a small server of your own that receives the form and writes to the sheet through Google's API. It has none of the caps and none of the hidden read access. What it has instead is setup and upkeep, and pretending otherwise is how people end up resenting it.

This is the option that scales without a surprise. You own the code, there is no monthly submission cap, the connection to the sheet is write-only because you built it that way, and a lock around the write is one line you control rather than one you hope a service got right. For a form that matters to the business, this is where you end up eventually.

The honest part is the cost, and it is not money. It is a thing that has to be deployed somewhere, kept running, given its own credentials to your sheet, and patched when Google changes the API. That is real work, and on a form that gets six submissions a week it is work out of all proportion to the job, which is how I have watched people come to resent a backend they did not need. It is the right answer for volume and the wrong answer for a hobby, and knowing which side of that line you are on is most of the decision.

For most small sites the recommendation I actually give is the boring one: start with a no-code bridge if you will not touch code, or a properly locked Apps Script if you will, and move to a backend the quarter the volume actually justifies it. Not before.

## How do you test which one survives your traffic?

> Short version: you do not have to guess which method holds up. You can make it fail on purpose, in an afternoon, before a real customer is the one who triggers it. The method that survives twenty submissions in ten seconds is the method that survives your busiest morning.

The failure modes above all share one property: they only appear under simultaneous load, which is exactly the condition a single manual test never creates. So I make the load on purpose, before a customer does it for me:

1. **Send one submission and confirm the row** - Fill the form in normally and check that a row appears, with each field under the correct heading. If a single submission does not arrive cleanly, there is no point testing anything harder yet.

2. **Fire twenty submissions in ten seconds** - Have a few people submit at once, or use a simple script that posts to the form twenty times in a row. This is the load a single test never produces and a real morning does.

3. **Count the rows** - Count what arrived against what you sent. Twenty sent, twenty rows, is a method that holds. Twenty sent, seventeen rows, is a method dropping submissions right now, quietly, exactly as it will in production.

Three missing rows in a test is a bad afternoon. Three missing rows in production is three customers who think they contacted you and did not, and you would never have known to look. The whole point of the test is to move that discovery from a real customer to a Tuesday you chose.

## Common questions

### Which one should I actually use?

If you will not touch code and your form is small, a no-code bridge, and read its price page first. If you are comfortable with a little code, an Apps Script with a lock around the write. If the form is load-bearing for the business and gets real volume, a backend. Most sites start with one of the first two and are right to.

### Is Apps Script safe for a real business form?

For low volume, yes, provided the write is wrapped in a lock and you accept that a genuine traffic spike can still drop the overflow. For a form that regularly sees bursts of submissions, its limits stop being theoretical and a bridge or a backend earns its keep.

### Why do people say Google Sheets "can't handle" forms?

Usually they mean one of two specific things: a script without a lock that dropped rows under load, or a free-tier cap that filled up. Neither is the spreadsheet failing. A sheet holds millions of cells quite happily. It is the wire to the sheet that was chosen for a quiet form and then asked to carry a busy one.

### Can I move from one method to another later?

Yes, and it is normal to. The data already sits in the same place, a Google Sheet, no matter which wire delivered it, so switching wires does not move your history. Starting cheap and upgrading the connection when volume arrives is the correct order, not a mistake you have to avoid.

## Sources

- [Apps Script - Quotas for Google Services](https://developers.google.com/apps-script/guides/services/quotas): six-minute runtime and thirty simultaneous executions per user, identical on free and Workspace accounts.
- [Apps Script - Lock Service](https://developers.google.com/apps-script/reference/lock): the lock that stops two simultaneous writes from overwriting each other's row.
- [Sheet Monkey - Submit a form to Google Sheets without a backend](https://sheetmonkey.io/blog/submit-form-to-google-sheets-without-backend): free-tier caps and prices for the common no-code bridges, and the cross-origin snag with Apps Script.
