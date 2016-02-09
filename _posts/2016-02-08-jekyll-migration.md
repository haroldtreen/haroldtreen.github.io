---
layout: post
title:  "Jekyll Migration"
categories: site update
---

I'm currently travelling South America (in Colombia to be more specific) and found some time to give my website a refresh.

#### **Before**:

The first version was something I hacked together really quickly. A custom single page app.

- The entire site was one HTML file.
- Pages were implemented as Markdown files converted to HTML files using a grunt task.
- When menu buttons were clicked, an AJAX call would fetch the pre-built HTML and inject it into the page.

**Pros:**

- Super easy to add new pages.
- Worked with Markdown files.
- Header could be downloaded and content injected after (progressive rendering).
- No page refreshes (single page "app").

**Cons:**

- URL did not change based on the page (no way to link to other pages).
- HTML generated from Markdown was bloated.
- No way to selectively load CSS/JS based on the page.

![Site Version 1](/assets/site-v1.jpg)

#### **After**:

Since I'm using Github Pages, Jekyll seemed like a better option for building a site.

**Changes:**

- Nicer theme (thanks Jekyll defaults!)
- Background of all pages is the source code for that page **#IM-SO-META-EVEN-THIS-ACRONYM**.  
(check out [show-code](https://www.github.com/haroldtreen/show-code) to see how that works)
- Updated content (things have changed since I last built my site...)
- No more AJAX requests on page load.
- Better control over what CSS/JS is included with each page.
- A blog!

![Site Version 2](/assets/site-v2.jpg)

I'm still figuring out all the features of Jekyll, but so far it's been working reasonably well.

If you find any bugs/issues, don't hesitate to [email me](/contact).
