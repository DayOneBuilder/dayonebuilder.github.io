# The form said thanks. Did anyone get the message?

> Your form shows a thank-you and the email never arrives. How to tell in three minutes whether leads are dropping, and how to count the ones already gone.

Source: https://dayonebuilder.online/blog/form-said-thanks-email-never-came/
Author: Ben Ison — Python / AI Engineer — https://dayonebuilder.online/
Published: 2026-07-22
Language: en

---
Someone filled in your form, saw the thank-you, and assumed you got it. You did not, and neither of you knows. Here is how to find out whether it is happening to you, and how much already has.

Someone filled in your contact form. They saw the thank-you message, so they think you have their enquiry. You never got an email. Neither of you knows anything is wrong, and both of you are waiting for the other to speak first.

Your contact form says sent, but no email arrives, and this is the quietest way a business loses money. Nothing breaks. No error appears anywhere. The form works, the site works, and the enquiries stop arriving. Most owners find out weeks later, and usually by accident, when a customer says "I did write to you."

Search for the problem and you land in a plugin manual. Usually for WordPress, usually published by whoever sells the plugin, and usually ending on the same instruction: install this, configure sending, done. That may well turn out to be your fix. It is also a fix for a cause nobody has established yet, on a platform you might not even be running.

The part missing from those pages is everything that comes before the fix. Whether your form is losing anything at all. And if it is, how much of it already went.

## Your form says sent but no email arrives. Why?

> Short version: the thank-you screen answers a question you never asked. It confirms the form ran. It says nothing about whether anything reached you, because the code that draws that screen never finds out. A submission crosses four separate stages, and only the last one puts an email in front of a human.

The clearest statement of this comes from the documentation of the thing doing the sending. PHP, which runs the server side of most of the web, describes what its mail function actually promises:

> It is important to note that just because the mail was accepted for delivery, it does NOT mean the mail will actually reach the intended destination.
> - [PHP Manual, mail() return values](https://www.php.net/manual/en/function.mail.php)

That sentence is the whole problem in one line. The form asked the server to send an email. The server said "accepted." Your site treated "accepted" as "done" and showed a thank-you. Everything after that point happens somewhere you cannot see.

Here is the full path a submission takes:

1. **The browser sends the form** - The visitor clicks. Their data reaches your site. This almost never fails, and this is the only stage the thank-you message actually knows about.

2. **Your site hands the message to a mail server** - It hands it over and gets back an acknowledgement. Not a delivery, an acknowledgement. This is where `accepted for delivery` is decided, and it is the last thing your site hears about it.

3. **The receiving mail service decides what to do** - Gmail, Outlook or whoever runs your mailbox now judges the message. It can accept it, put it in spam, or reject it outright. Your site is not told which.

4. **Something puts it in front of you** - Or a filter files it away, or it lands in a folder you never open. The message can exist and still never be read.

The thank-you covers stage one. Stages two through four happen in silence, and a failure in any of them looks identical from the outside: a happy visitor and an empty inbox.

> **The trap** Testing your own form from your own computer proves almost nothing. Mail from you to you often takes a shorter route and skips the checks that kill real messages. The test that matters is a submission that looks like a stranger's, sent to the address you actually watch.

## How do you check whether it is happening to you?

> Short version: three checks, in this order, and you can run all of them without touching your site. They tell you whether the problem is delivery, filtering, or something never having been sent at all.

1. **Send one real submission the way a stranger would** - Fill the form in as a customer would, and put an address you control at a different provider in the reply field - a personal Gmail if your business runs on Outlook, or the other way round. What matters is not your network but that the address is not the same domain as the one you are testing, because that is the exact case that gets filtered. Write a nonsense word into the message so you can search for it later.

2. **Search your whole mailbox for that word, not just the inbox** - Look in the inbox first, then widen it. In Gmail, searching `in:anywhere` adds Spam and Trash to the search, which the plain inbox search skips - and Trash is exactly where a rule with a delete action drops things. If the message turns up anywhere, delivery works and something on your end filed it. That is a filter problem, and it is the good outcome.

3. **Ask your form where it thinks the submission went** - Most platforms keep a log or a submissions list separate from email. If your submission appears there but not in your mailbox, the form is fine and the email is dying. If it appears in neither, the form never got it.

Three outcomes, three different problems, and now you know which one is yours before you have changed a single setting.

## Where does the message actually go?

You can hear the exact shape of this on any platform's support forum. One Shopify store owner put it as plainly as anyone:

> The contact form I have on the website is submitting all right but i am not receiving any emails on my email.
> - Store owner, [Shopify Community](https://community.shopify.com/t/why-am-i-not-receiving-emails-from-my-websites-contact-form/291473)

Submitting all right, not receiving any emails. Both halves true at once, and everything that fits between them is the five causes below. Each one has a tell, so you can usually name yours rather than working through all five.

**1. The message was never authenticated**

- **Tell:** Nothing arrives from your site, but mail you write by hand from the same domain arrives fine.

- **Why:** Your site sends mail without the records that prove the mail is really yours. To reach a Gmail inbox, [Google now requires every sender to set up SPF or DKIM](https://support.google.com/a/answer/81126), and anyone sending more than 5,000 messages a day to have SPF, DKIM and DMARC all three. Messages without them, in Google's own words, "might be marked as spam or rejected." Microsoft brought in the same demand for Outlook.com in 2025, so this is where mail is going, not a Gmail quirk.

- **Fix:** Send through an authenticated mail service instead of the web server. This is the fix the plugin guides are pointing at, and for this cause they are right. It means changes to your domain's DNS, though, and getting SPF wrong - two SPF records instead of one is the classic mistake - can take down every email your domain sends. If you do not run your own DNS, this is the one cause to hand to whoever does, rather than try on a live domain.

**2. The reply-to address pretends to be the visitor**

- **Tell:** Enquiries arrive from some senders and not others, with no pattern you can see.

- **Why:** Many forms put the visitor's address in the from field, so the message claims to come from a domain that never authorised your server. That is the exact shape of a forged email, and filters treat it as one.

- **Fix:** Send from your own domain and put the visitor's address in reply-to. The reply button still works, and the message stops looking forged.

**3. Your own filter is eating it**

- **Tell:** The message exists somewhere in your mailbox when you search everything, just not in the inbox.

- **Why:** A rule you set up years ago, a spam classifier that decided one message was junk and applied that to the rest, or a shared mailbox where someone else's rule moves them. [Squarespace tells its own users to add its sending address to their mail rules](https://support.squarespace.com/hc/en-us/articles/205813938-Troubleshooting-form-issues), which is a platform openly admitting this happens.

- **Fix:** Find the rule and remove it, then whitelist the sending address. Cheapest fix on this list, and worth ruling out first - but if it is a shared mailbox, check whose rule it is before deleting it, because that rule may be doing a job for someone else.

**4. It goes to an address nobody opens**

- **Tell:** You find the enquiries immediately, in a mailbox nobody has logged into since the site was built.

- **Why:** The notification address is whatever was typed during setup: a developer's address, an old info@ that forwards nowhere, a staff member who left. Nothing is broken and nothing is being read.

- **Fix:** Point it at an address a person actually watches, then send a test submission to prove where it landed.

**5. Nothing was ever sent**

- **Tell:** The submission does not appear in your mailbox, and does not appear in the form's own records either.

- **Why:** A form that fails before sending, an integration that quietly disconnected, or a required field the platform needs before it will record anything at all. The thank-you can still show, because the thank-you is often just the next screen.

- **Fix:** Check the form's own submissions list first. This is the worst cause on the list, because unlike the others there is nothing sitting in a folder to recover.

## How many did you already lose?

> Short version: you cannot recover what was never stored, but you can usually measure the hole. Compare how many people reached the thank-you page against how many enquiries you have in hand for the same period.

If you have analytics on the site, the thank-you page has a view count. That number is roughly how many people believed they had contacted you. Set it against the enquiries you actually received in the same weeks. The gap is your answer, and it is usually the first honest number anyone has put on the problem.

If you have no analytics, you are not stuck, you are just working with a shorter history. Turn on submission storage today, watch for a fortnight, and compare storage against your inbox. That gives you a live loss rate instead of a historical one.

> **Be careful what you conclude** A gap between page views and enquiries is a strong signal, not a proof. Refreshes, bots and people who open the page twice all inflate the view count. Treat the number as "something is wrong, and roughly this big," not as a precise count of lost customers.

Either way you end up with a number you can act on instead of a nagging sense that something is off. A rough number you can defend beats a precise one you made up.

## The fix that ends this whole class of problem

> Short version: stop letting email be the only record. Whenever someone hands me a form that "sometimes loses messages," this is where I end up, because an email is a notification that an enquiry exists, and it is a terrible place to keep the enquiry itself - a notification you never received leaves nothing behind to find.

Every cause above has the same shape. The enquiry existed, the notification failed, and because the notification was the only copy, the enquiry was gone. Chase the notification and you have fixed one cause until the next one turns up. Write the enquiry down the moment it arrives, before any email is attempted, and none of the five can cost you a customer again - the worst any of them does then is delay when you read it.

1. **Write every submission to a store first** - A spreadsheet is enough. A row per enquiry, with a timestamp, before any email is attempted. If mail breaks tomorrow, nothing is lost, it is just unread.

2. **Keep the email, but demote it** - It stays useful for speed. It is no longer the record, so its failure costs you a delay rather than a customer.

3. **Make silence visible** - An empty inbox looks the same whether nobody wrote or everything broke. A quick weekly glance at the store, or an alert when a row lands, tells the two apart.

This is also why the fix is worth doing even if today's cause turns out to be a filter you can delete in a minute. Deleting the filter fixes the filter. It does nothing about the fact that a single missed notification was all it took to lose the enquiry for good, and that is the part I would not leave in place.

## Proving it is fixed, on your own evidence

> Short version: one test submission, three things true at once. If all three hold you are done, and you did not have to take anyone's word for it, including mine.

1. **The row appears in the store** - Send a test submission and watch the row land, with the right values in the right columns. Data in the wrong column is a fix that has not finished.

2. **The email arrives at a watched address** - From outside your network, to the mailbox a human actually reads. If it lands in spam, you found a second problem while the first was still fresh.

3. **A stranger's submission does the same** - Ask someone with a different email provider to send one. Providers disagree about what looks suspicious, and one of them disagreeing is what started this.

Run all three now, and again in a month. Mail providers change their rules, domains expire, and staff leave. A form that worked in July is not evidence about a form in December.

If you want the wider version of this idea, it is the same reasoning behind the [60-second triage for a wrong spreadsheet total](https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/) and the [procedure for finding rows a product import skipped](https://dayonebuilder.online/blog/import-said-success-rows-missing/). Different tools, same trap: a piece of software reported that it finished, and finishing is not the same as succeeding. The same split shows up in [code that runs perfectly and hands you a wrong number](https://dayonebuilder.online/blog/chatgpt-code-broke-on-real-data/).

## Common questions

### My form worked for years and stopped. What changed if I changed nothing?

Almost certainly not your site. Mail providers tightened their rules: since February 2024 Google has required every sender to have SPF or DKIM authentication, and bulk senders to have DMARC too. A site sending unauthenticated mail was tolerated for years and then quietly stopped being tolerated. Nothing on your end had to change for the outcome to change.

### Is this a WordPress problem?

No. The guides are mostly about WordPress because WordPress runs more sites than anything else, and the people writing those guides have an SMTP plugin to sell. The forums of Shopify and Squarespace are full of the same complaint, and platform-hosted forms fail the same four stages. What differs is which part you can reach: on your own site you can change how the mail is sent and add the authentication that keeps it out of spam, while on a hosted platform you are mostly limited to changing where the submission is stored and which address it is sent to, because the sending itself belongs to the platform.

### The submissions are in spam. Can I just tell people to check spam?

You can, and you should look there yourself, but it is not a fix. Spam placement is a judgement your mail provider makes fresh for every message, so it can flip back without warning. Worse, if your provider ever moves from spam to outright rejection, the same cause stops producing anything you can find at all.

### Should I use a form plugin, a platform form, or something custom?

Whichever one writes the enquiry down before it tries to email you. That single property matters more than the choice of tool. A basic form that logs to a spreadsheet loses fewer enquiries than a sophisticated one that only sends mail.

### What does this cost me in time, realistically?

The check usually names it in a few minutes, because the three outcomes map onto different causes. Fixing it is the same day for a filter or a wrong address, and an afternoon for authentication or a storage setup. The exception is the fifth cause, where nothing was ever recorded: that one is quick to fix going forward and impossible to fix backwards, which is the argument for not leaving it.

## Sources

- [PHP Manual - `mail()` return values](https://www.php.net/manual/en/function.mail.php): mail accepted for delivery is not mail that reached its destination.
- [Google - Email sender guidelines](https://support.google.com/a/answer/81126): SPF/DKIM required to reach Gmail since February 2024; SPF, DKIM and DMARC for senders of 5,000+ messages a day.
- [Squarespace - Troubleshooting form issues](https://support.squarespace.com/hc/en-us/articles/205813938-Troubleshooting-form-issues): storage and email notification are separate; the platform asks users to whitelist its sending address.
- [Shopify Community - contact form not receiving emails](https://community.shopify.com/t/why-am-i-not-receiving-emails-from-my-websites-contact-form/291473): the same symptom, in a store owner's words.
