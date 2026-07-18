# The Import Said Success. Which Rows Are Missing?

> Your importer reported success and quietly skipped rows. How to find which ones, on a copy, before you touch the live catalog.

Source: https://dayonebuilder.online/blog/import-said-success-rows-missing/
Author: Ben Ison — Python / AI Engineer — https://dayonebuilder.online/
Published: 2026-07-17
Language: en

---


You uploaded a product file. The importer worked through it, then told you it was done. No red box, no error, nothing to click. Then you looked at your catalogue and there were fewer products than there were rows in your file. Your CSV import says success but rows are missing, and both halves of that sentence are true at the same time.

Neither half is your fault. It is how the importer was built to report, and that is the part nobody explains.

The internet's answer to this is a list. Ten reasons your import failed, twelve things to check, fifteen common CSV mistakes. Every one of those lists is accurate and every one of them is useless to you right now, because you cannot tell which of the ten is yours, and you cannot check. You are being handed a menu when what you need is a receipt.

So this is the other thing. Not the reasons. The rows.

## Your CSV import says success but rows are missing. Why?

> <div class="tldr">Short version: when a CSV import says success but rows are missing, the importer is telling you it reached the end of the file, not that your products arrived. Those are two different claims. Every row in your file was sorted into one of five buckets, and only two of them mean the row became a product you can sell.</div>

Open the source of WooCommerce's product importer and one of the first things it does is create five buckets:

``` 'imported' => array(), 'imported_variations' => array(), 'failed' => array(), 'updated' => array(), 'skipped' => array(), ```

Every row in your file lands in exactly one of them. At the end, the importer reports that the job finished. It finished. That is a true statement about the job, and it says nothing at all about which bucket your rows went into.

This is not a WooCommerce quirk. On Magento, someone reported it in July 2016 with the clarity of a man who had just lost an afternoon: "Magento thinks the product import was a success as it reached the end of the data to import, when in fact it hit a null value, and there was additional data to import after." He then named the business consequence, which is the reason you are reading this: "This is particularly dangerous as a merchant could update product prices, get a message they went in, and they haven't gone in."

The word "success" is not doing the job you assumed it was doing. It never was.

## Were your rows skipped, or did they fail?

> <div class="tldr">Short version: your rows probably did not fail. They were skipped, which is a different bucket with a different meaning. A failed row was attempted and something went wrong. A skipped row was never attempted at all: the importer looked at it, decided it already had that product, and moved on. Both get recorded. Only one of them is a bug.</div>

Here is the branch in WooCommerce that decides:

``` if ( is_wp_error( $result ) ) { $result->add_data( array( 'row' => $this->get_row_id( $parsed_data ) ) ); $data['failed'][] = $result; } elseif ( $result['updated'] ) { $data['updated'][] = $result['id']; } else { $data['imported'][] = $result['id']; } ```

Now notice what happens before this code ever runs. `skipped` is filled in earlier, with a `continue` that jumps straight to the next row. A skipped row never reaches the branch above. It is not a failure, it was not attempted, and yet WooCommerce still writes it down as a `WP_Error` with a reason attached. That last part matters, and almost nobody tells you about it.

That single fact changes where you look, but not in the way the troubleshooting lists suggest. They hand you ten reasons a row can fail. Your rows did not fail. WooCommerce does record the skip, and it does tell you: the done screen says how many were skipped and offers the log. The catch is what that log is, and it is the next section.

## The checkbox that skips your whole file

> <div class="tldr">Short version: on both Shopify and WooCommerce, a row whose SKU or handle already exists is skipped unless you tick a box. The box is off by default. If you re-uploaded your catalogue to change prices and nothing changed, this is almost certainly why.</div>

WooCommerce decides with this:

``` if ( $sku_exists && ! $update_existing ) ```

And the controller sets the default:

``` 'update_existing' => isset( $_POST['update_existing'] ) ? (bool) $_POST['update_existing'] : false, ```

`false`. Off. If you did not tick "Update existing products", every row for a product you already sell goes to `skipped` with the message `A product with this SKU already exists.` and the import reports success.

Shopify works the same way, and a member of the Shopify Community spelled it out to a merchant whose products would not import: "you'll need to check the box to overwrite existing products so that the import does not skip any existing products."

Read the scenario back to yourself. You export your catalogue, change the prices in a spreadsheet, upload it, and get told it worked. Nothing changed. Not one price. And the file is fine - there is nothing to find in it, which is why you will spend the evening looking.

There is a third variant of the same trap, and it fires in the opposite direction. Tick the box, then upload rows for products that do *not* exist yet. WooCommerce skips those instead: `No matching product exists to update.` The box has two wrong positions. Which one is wrong depends on what is in your file.

## Count first: three numbers, three meanings

> <div class="tldr">Short version: write down three numbers before you change anything. The rows in your file, the products in your admin, and the products on your storefront. They mean three different things, and most people compare the wrong two, diagnose the wrong problem, and edit a file that was fine all along.</div>

Do this before anything else, because it takes a minute and it decides everything after.

**Rows in your file.** Open the CSV and read the last row number. Careful here: on Shopify a row is not a product. Rows are glued into products by the Handle column, and a variant row carries only the handle and its option values, with title and vendor left empty. A file of 1000 rows can be 200 products with variants and be entirely correct.

**Products in your admin.** The number your platform reports internally.

**Products on your storefront.** What a customer can actually see.

If the file and the admin agree, your import worked and you have a different problem - see the next section before you touch the file again.

One caveat on counting, because a procedure should know its own limits. If your catalogue is very large, the count itself starts lying: Shopify's API documents that "Counts are accurate up to 25,000 items. For arrays with more items, 25,001 is returned as the count." Above that line you cannot compare counts at all; you compare the exports themselves, row by row, which is the next section anyway.

## Are the products missing, or just invisible?

> <div class="tldr">Short version: if your products are in the admin and not on the site, the import is innocent and the file is fine. This is the most expensive wrong turn available, because everything you do to the CSV from here is wasted.</div>

In July 2026 a shop owner posted this, and it is worth reading exactly:

> "I have a problem with a bunch of products on my website. In admin panel i have 1237 products on a vendor, all active and on my website i can see only 652 products. Vendor is set for every product and two weeks ago i was able to see them all."

Look at the last clause. The products are there. All 1237, all active. Two weeks ago they displayed. Nothing was imported and nothing was lost - 1237 minus 652 looks exactly like an import that ate 585 rows, and it is not one.

It got stranger as the thread went on. The storefront filter reported a different count on every refresh: "The product number in Filter → By Brand is changing for no reason." Someone else checked from outside and got a third number: "Search results, however, do show only 437 products out of 653 results total." Five numbers for one catalogue.

The answer, when it came, was the theme: "Switched to Dawn theme, there is everything ok. It shows all the products, the problem is with my theme or some app."

A confident helper in that thread had already proposed the usual explanation - products active but not connected to the sales channel - and was wrong. This is worth ruling out first, not because it is the most common cause, but because it is cheap to check and it decides whether you should be looking at your file at all.

## The log names your rows once, then it is gone

> <div class="tldr">Short version: the import log is real, it works, and on WooCommerce it does list your skipped rows with a reason for each. That is why "check the log" is the standard advice, and it is right. The catch is what the log is: one screen, no address to return to, named by product rather than by line, wiped by the next run, and truncated when there is a lot to say.</div>

I have to be fair to the platforms here, because the popular version of this story is wrong and I believed it myself until I read the code. WooCommerce counts skips and says so: `'%s products were skipped'`. It merges them into the same log as the failures, in one line you can go and read: `array_merge( $error_log, $results['failed'], $results['skipped'] )`. It shows that log a table with two columns, "Product" and "Reason for failure". A core maintainer at Automattic said so in 2018, cheerfully: "The final step does tell you if there were failures and presents the log :)". On Shopify, according to a reply in the community forums, the detail arrives by email rather than on screen: "you would receive an email that outlines what failed and why product's didn't import." WooCommerce's own documentation tells you to start there: "If the import finishes but some products are missing or skipped, check the import log first."

So check it. It is the right first move, and if you still have that tab open you may not need the rest of this article. The trouble is the four ways that log stops short:

**It truncates.** A Shopify Community member posting under the shopifystaff group, now marked Retired: "If there are too many errors, sometimes the error window isn't able to display them all, so small batches are best." Magento is explicit in its code - "Only the first 100 errors are shown."

**It deletes itself.** Magento generates a full `error_report.csv`, the one artifact that actually lists every bad row. From a 2020 issue: "the file is generated, but will be removed after the application ends."

**It does not speak your file's language.** WooCommerce builds the row's name in the log from the product's name, ID and SKU. Not from the line number in your file. So you learn which product had a reason, and you still have to go and find it among your 1000 lines yourself. Magento is the exception here and keys its report by row number.

**It resets.** WooCommerce's error log is stored in a per-user option and cleared at the start of a run.

None of this is a conspiracy. It is the ordinary result of building a log for the person who wrote the importer rather than for the person holding the file. Which is why the rest of this article does not depend on the log at all. If you have it, use it. If you closed the tab, or it was cut off, or it named 153 products you now have to match against a spreadsheet by hand, keep reading: the export tells you the same thing, in your file's language, and you can run it as many times as you like.

## How do you get a list of what actually landed?

> <div class="tldr">Short version: ask the platform for a list of what is in your store right now. Shopify and WooCommerce both have an export button. That file is ground truth: it is the one document here that cannot be wrong about what exists, because it is generated from what exists. It still has two blind spots worth knowing.</div>

Every platform will hand you the current catalogue as a file. Shopify: Products, then Export. WooCommerce has a product exporter built in.

The same Shopify Community member recommends this step, so it is not a workaround anyone invented for you: "create the product in the admin and then export it out to compare to your existing CSV."

Two warnings before you trust the export blindly. WooCommerce's exporter only covers five statuses - private, publish, draft, future and pending - so anything outside those will look missing when it is not. And it leaves out custom meta unless you ask for it: `if ( ! empty( $_POST['export_meta'] ) )`.

## Diff by the key, not by eye

> <div class="tldr">Short version: put the export next to your source file and match them on SKU or handle. The rows in your file with no match in the export are your answer. This is a lookup, and it is the only step that produces a list of names rather than a theory.</div>

You have two files now. Your source, and what actually exists. The missing rows are the ones present in the first and absent from the second, matched on the one column that identifies a product: SKU on WooCommerce and Magento, handle on Shopify.

Do not do this by eye. At a thousand rows your eyes will find about six of them and then quietly stop.

Do it with a lookup in a spreadsheet, which is a tool you already own. Two notes from experience, and both of them will bite you here specifically. Match on the exact key, not on the product name - two products can share a name and no two can share a SKU. And beware the key that is text in one file and a number in the other. A SKU like `00123`, read as the number `123`, will not match itself. The lookup reports the row as missing while it sits right there. If your lookup finds nothing at all, or finds the wrong things, that is its own failure with its own causes. I take it apart in [the lookup matched the wrong row](https://dayonebuilder.online/blog/why-your-spreadsheet-total-is-wrong/#lookup). Rule that out before you believe the diff.

If you would rather have a script do the comparison, that works too - but check it against a file you already know the answer for. A script that [ran fine on ten rows and lied on five thousand](https://dayonebuilder.online/blog/chatgpt-code-broke-on-real-data/) is its own kind of afternoon.

What you have at the end of this is the thing you actually wanted: a list of rows. Not reasons. Rows.

## What makes one row disappear?

> <div class="tldr">Short version: a row disappears for a named reason, and the platforms name them in their own source code. A SKU or handle that already exists. A URL key already taken. Spaces at the edges of a SKU. An image URL that will not download. A parent row that failed and took its variants with it. Take each missing row and look for its signature.</div>

You have your missing rows. Take each one and look for its signature below.

- **The SKU or handle already existsWhy:** Covered above, and it is the big one. If most of your file is missing, stop here - the update checkbox was off, and every row you already sell was skipped.

- **The URL key is already takenWhy:** Two products want the same web address, and one of them loses. Magento names the culprit for you: `Url key: '%s' was already generated for an item with the SKU: '%s'`.

- **The SKU has spaces at the edgesWhy:** Invisible in a spreadsheet, fatal to a match. Magento has an error code for exactly this: `SKU contains marginal whitespaces`.

- **An image URL that will not downloadWhy:** In WooCommerce one unreachable image does not cost you the image. It costs you the whole product. The upload throws and the row dies with `Error getting remote image %s.` WordPress gives that download 300 seconds before it gives up.

- **The parent failed, so the children vanishedWhy:** A row can be valid and still disappear because something above it died. From a WooCommerce maintainer: "the other 'success' rows are variations and these get cleared if the parent product (with the image) fails to import". Magento has a name for the same thing: `Orphan rows that will be skipped due default row errors`.

- **A value the field will not acceptWhy:** Wrong type, or a value outside the allowed list. Shopify's version names the line, like the one a very experienced importer hit in July 2026 and could not explain: `Line 2: Validation failed: Cannot add more than 10000 references to a file.` He opened with "I like to think I am well versed in importing CSV files to Shopify." It is not you.

- **The importer is older than the limitWhy:** Shopify raised the variant ceiling from 100 to 2048 in the 2024-04 API and gave it to every merchant on 15 October 2025. But the old limit did not die, it moved. Shopify's changelog warns that "merchants using apps that are not using the in-support GraphQL product APIs may have a downgraded or broken experience". Your store supports 2048; a plugin written in 2023 and never updated cuts at 101. The age of the tool is a diagnosis.

- **The store is too big for the dayWhy:** Once a store passes 50,000 variants, Shopify adds a throttle of 1000 new variants per day, and it "don't apply to stores on the Shopify Plus plan". This is why the same file behaves differently for you and for someone with a smaller catalogue.

**The SKU or handle already exists**

**The URL key is already taken**

**The SKU has spaces at the edges**

**An image URL that will not download**

**The parent failed, so the children vanished**

**A value the field will not accept**

**The importer is older than the limit**

**The store is too big for the day**

## What if a row landed, but landed wrong?

> <div class="tldr">Short version: a missing row shows up in a count, which is why you found it. A row that imported with the wrong data shows up nowhere at all. Nobody counts it, because by every measure the platform has, that row worked. This is the failure that reaches your customers.</div>

The rows you can count are the good news. Here is the bad news, from a WooCommerce thread this year, a shop with more than 1400 products:

> "Simple products updated perfectly. However, the majority of Variation products became completely empty..." <cite>The sentence goes on to say that their existing prices and descriptions were wiped out with them.</cite>

The owner had done the careful thing. He mapped only the three columns he wanted to change and set everything else to "Do not import", "assuming this would protect the existing [data]". It did not. That thread was closed by a moderator on a timer, not by a fix: "We haven't heard back from you in a while, so I'm going to mark this as resolved."

There is an open WooCommerce issue from January 2025, still open as I write this in July 2026, that documents the shape of it: "No warning about invalid columns | Import successful | Products imported with empty values". The same issue records the perfect version of this failure - "Import complete, failed to import 69 (of 69!) products".

And a Shopify owner with 800 products found a field that simply evaporates, quietly, every time: "No error message appears at any point. The category drops silently every time. This is not anything you are doing wrong."

The diff you ran two sections ago will not catch any of this, because the row is there. To catch it, compare the values instead of the keys. Same two files, same lookup. But this time you check that the price in the export matches the price in your source, not just that the SKU exists in both.

One more reason to care, and it is the reason to work on a copy. As one Shopify Community member put it: "Changes made by CSV cannot be undone."

## Fix on a copy, then re-run the diff

> <div class="tldr">Short version: change the copy, never the live catalogue. Then run the same comparison a second time. The re-run is the point: it turns "I think I fixed it" into a number you can count, and you produced that number yourself, on your own file, without taking anyone's word for it. Including mine.</div>

Work on a copy of your file. Never on the live catalogue, because of the sentence above: CSV changes do not have an undo.

Then the part that matters more than the fix. Run the diff again. The same export, the same lookup, the same key. If the missing list comes back empty, it is done. If it comes back with four rows, you have four rows to look at instead of a feeling that something is still wrong.

This is the whole reason to do it in this order. A fix you cannot check is a story someone told you. A fix that turns a list of 153 rows into a list of zero is a fact, and you produced it yourself, on your own file, in a tool you already know how to use.

## Where should you look first?

> <div class="tldr">Short version: match what you are seeing on screen to the first place worth looking. This is a triage rather than a diagnosis: it will not tell you the answer, but it will stop you working the wrong file. Start at the row that matches your symptom and work from there.</div>

| What you are seeing | Look here first |

|---|---|

| Import said success, prices did not change | The update or overwrite checkbox. Default is off. |

| Import said success, nothing at all was added | Same checkbox, same reason: everything already existed. |

| Products are in the admin but not on the site | Not an import problem. Theme, channel or collection. |

| Some variants missing, products present | Parent row failed, or an import tool older than the 2048 limit. |

| Products imported, fields empty | Column mapping. The diff by key will not see this; compare values. |

| A few rows missing, no pattern | Image URLs, whitespace in SKUs, values outside an allowed list. |

| Re-import says "SKU already exists" for products you cannot see | Leftovers from the failed import. Export first, do not just re-upload. |

| Big catalogue, missing count keeps moving | Daily variant throttle above 50,000 variants, or a count over the 25,000 reporting limit. |

| The error window looked short | It was truncated. Do not re-run the import to read the rest: a second run wipes the first run's log, and CSV changes have no undo. Get the rest from the export diff. |

## If you have not imported yet

> <div class="tldr">Short version: import twenty rows before you import a thousand. The whole problem described in this article is that a failure at scale looks exactly like a success at scale. Twenty rows tells you which of the two you are about to get, while it still costs you a minute.</div>

Take twenty rows from your file. Import those. Look at what landed - not the message, the products. Then do the diff on twenty rows, where you can also just count them by hand and confirm the method agrees with your eyes.

If the twenty are wrong, you found out at twenty. If they are right, you have cleared the file, not the scale. The throttles, the truncated error window and the count ceiling in this article only appear on the big run, so keep the diff for that one too.

## The part nobody in the search results will tell you

> <div class="tldr">Short version: the pages ranking above this one are written by Shopify, by WooCommerce, and by the companies selling import plugins. None of them can write the sentence this article is built on, because it is a sentence about their own product failing quietly. That is not a conspiracy. It is just who gets to rank.</div>

The lists are not wrong. They are written by people who cannot say this next part.

Shopify's help centre cannot tell you that Shopify's importer skipped your rows and called it success. The companies ranking above them sell import plugins - WebToffee, eMagicOne and the rest - and "importers quietly skip rows and report success" is not a sentence you write when your product is an importer. One vendor runs three separate domains for the same question across three platforms. The people who rank for this are, structurally, the people who cannot say it.

I sell neither a platform nor a plugin. I get to say it: the importer is not lying to you, exactly. It answered a question you did not ask. It told you the job finished. You wanted to know where your products went, and those are not the same sentence, and the gap between them is where your afternoon went.

Now you know which rows. The rest is just reading them.

<div class="cta-final"> <strong>Or send me the file.</strong> <p>Show me the file you uploaded and what your catalogue looks like now. You get the rows that did not land, named individually, each with the thing that stopped it, and a check you can re-run yourself. Work happens on a copy. $10, and I say so before you pay if your task is not one of these.</p> <a class="pill" href="https://kwork.com/virtual-assistant/53561379/i-will-find-the-rows-that-break-your-product-catalog-import">Open the kwork</a> </div>

## Common questions

### I re-uploaded the file and nothing changed. Did the import fail?

Probably not. It most likely skipped every row, because the products already existed and the "update existing" box was off. A skip is not a failure, so you get no error and a success message. Turn the box on, work on a copy, and re-upload.

### The importer said it finished. Why are products still missing?

Because "finished" describes the job, not your rows. The importer reached the end of the file and said so. Individual rows were sorted into skipped, failed or updated along the way, and only the export of what actually exists tells you which rows landed and which did not.

### How do I find exactly which rows are missing?

Export the products that are in your store now, put that export next to your original file, and match the two on SKU or handle. The rows present in your file and absent from the export are the missing ones. Do it with a lookup, not by eye - at a thousand rows your eyes give up.

### Is it safe to just import again?

Not blindly. On Shopify, "Changes made by CSV cannot be undone," and on WooCommerce a second run can wipe variation data or report SKUs that already exist for products you cannot see. Work on a copy, keep the original untouched, and verify with the export diff before you touch the live catalogue.

### Why did the same file work for someone else?

Usually a limit that depends on scale or plan. Shopify throttles new variants past 50,000 and exempts Plus stores; an older import plugin can cap variants at 101 while your store supports 2,048. Same file, different store, different result - and none of it is your file being wrong.

## Sources

All quotes below were checked against the raw page or the raw source file, not a summary of one.

- WooCommerce product importer, source: [class-wc-product-csv-importer.php](https://raw.githubusercontent.com/woocommerce/woocommerce/trunk/plugins/woocommerce/includes/import/class-wc-product-csv-importer.php) - the four buckets, the skip conditions and their messages.
- WooCommerce importer controller, source: [class-wc-product-csv-importer-controller.php](https://raw.githubusercontent.com/woocommerce/woocommerce/trunk/plugins/woocommerce/includes/admin/importers/class-wc-product-csv-importer-controller.php) - `update_existing` defaults to false; batch size 30.
- WooCommerce issue [#19863](https://github.com/woocommerce/woocommerce/issues/19863) - Mike Jolley (Automattic) on the log, and on variations cleared when a parent fails.
- WooCommerce issue [#54841](https://github.com/woocommerce/woocommerce/issues/54841) - open since January 2025: import complete, 69 of 69 products failed.
- Magento issue [#5846](https://github.com/magento/magento2/issues/5846), July 2016 - the import reaches the end of the data, hits a null, and reports success anyway.
- Magento issue [#28420](https://github.com/magento/magento2/issues/28420) - the error report file is generated, then removed.
- Shopify changelog: [variant limit raised to 2048 for all merchants](https://shopify.dev/changelog/the-product-variant-limit-is-now-2048-for-all-merchants), 15 October 2025, including the warning about apps on older APIs.
- Shopify: [API rate limits](https://shopify.dev/docs/api/usage/limits) - the 25,000 count ceiling, the 50,000-variant daily throttle, and the Plus exemption.
- Shopify Community: [CSV Import Issue](https://community.shopify.com/t/csv-import-issue/645056) - the 10000-references validation message.
- Shopify Community: [Missing active products on website](https://community.shopify.com/t/missing-active-products-on-website/647043) - 1237 in the admin, 652 on the site, and the theme.
- WooCommerce REST functions, source: [wc-rest-functions.php](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/wc-rest-functions.php) - the `Error getting remote image %s.` message and the 300-second download timeout.
- WordPress: [wp_max_upload_size()](https://developer.wordpress.org/reference/functions/wp_max_upload_size/) - the upload ceiling is the smaller of two PHP settings.
- WordPress.org support: [variation data wiped during CSV import](https://wordpress.org/support/topic/variation-data-wiped-during-csv-import-failed-with-full-and-partial-mapping/) - the 1400-product shop whose variations came back empty, and the thread closed on a timer.
