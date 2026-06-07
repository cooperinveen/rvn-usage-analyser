TELETRAX PORTAL AND REPORTS: WHAT THE DATA MEANS AND HOW TO USE IT

A practical guide for Reuters TV producers and journalists

---

PART 1: WHAT IS TELETRAX AND HOW DOES IT WORK?

Teletrax is a global broadcast monitoring service. It watches television channels around the world and automatically identifies when your video content airs. It does this in two ways: watermarking (an invisible signal embedded in the video before distribution) and video fingerprinting (a digital signature of the video content itself). When a channel airs content that matches a watermark or fingerprint in the system, that is recorded as a detection, also called a hit.

For Reuters TV producers, this means you can find out which channels aired a story, when they aired it, how long they used, and in which markets. All of that data lives in the Teletrax portal and in exported reports.

Detection data is available on the portal approximately 30 to 60 minutes after a story airs.

---

PART 2: THE PORTAL INTERFACE

How to navigate the portal

Log in at www.teletrax.com with your email address and password. The portal is customised to your individual seat, so only you and your colleagues within your organisation can see your data.

The navigation menu runs along the top of the screen. The main tabs you will use are:

DETECTIONS - This is where you find reports on how and where your content has aired. Start here when you want to know whether a story was used.

ASSETS - This shows the content registered in Teletrax, meaning the stories and packages that have been fingerprinted or watermarked and are being tracked.

BROADCASTERS - An overview of the channels Teletrax is monitoring for you. Use this to check which channels are in the system.

PREFERENCES - Account management, including changing your password.

The Dashboard appears when you first log in. It shows graphics-led summaries of saved reports and refreshes automatically every five minutes. Useful for a newsdesk screen showing live usage data.

Below the navigation tabs are yellow Filter buttons. Clicking these lets you define what you are searching for. Changes you make update results in real time.

The number of rows visible in the portal is limited to 2,000. For larger datasets, use the Export button.

---

PART 3: WHAT IS A REPORT?

A report is a saved query that shows you detection data. You configure it by setting filters for content, channels, and a time period. The report then shows you every time your tracked content was detected within those parameters.

Reports have four sections:

TOOLBAR - Across the top. Shows the report title, save/export buttons, and any action buttons. When the toolbar turns yellow, you have unsaved changes.

FILTERING - Where you define what to look for. Three types of filter:
- Content filters: which assets (stories) to include
- Channel filters: which channels or markets to look at
- Period: the date and time range

GRAPH - A visual summary of the results. Click on a bar or section to drill down further.

DETAILS GRID - The actual rows of data. Each row is typically one detection event.

Creating a new report: Click the Detections tab and select New Report. Start with an empty query, then add filters.

Saving a report: Click on the "Untitled report" text to rename it, then click Save. Saved reports appear in your menu when you hover over the Detections tab.

Sharing a report: Once saved, a Share button appears. You can share it with other users in your organisation.

The cog icon at the top right of the details grid opens column options. You can add or remove columns to show exactly the data you need. You can also tick "Include all assets" to see assets with zero detections, and "Show totals" to get column totals.

---

PART 4: EVERY COLUMN EXPLAINED

These are the columns you will see in reports and exports. Not all columns appear in every report - it depends on your configuration.

SLUG
What it is: A short description of the story, set when the content was registered. At Reuters this would typically be the story slug.
Why it matters: The fastest way to identify which story a detection row belongs to.

ITEM ID (also called Asset: ResourceID in some contexts, or itemid in data)
What it is: A unique identifier for the asset (the tracked piece of content).
Why it matters: Allows you to cross-reference with internal systems or find the asset in the Assets tab.

ASSET: CATEGORY
What it is: A metadata category assigned to the asset, such as News or Entertainment.
Why it matters: Useful for filtering reports by content type.

ASSET: EID
What it is: The Embedder ID - the unique number used when the watermark was embedded in that content.
Why it matters: Identifies exactly which version of a watermarked asset was detected.

ASSET: ENCODATION FACILITY
What it is: The facility where the watermarking was applied.
Why it matters: Useful for tracking workflow - confirms where content was processed.

ASSET: LENGTH
What it is: The running time of the registered video asset. If an asset has multiple encodations, this is the longest.
Why it matters: Lets you compare how long the full story is against how long it was used on air.

ASSET: PERMALINK
What it is: A direct link to a read-only page for the asset in the Teletrax portal.
Why it matters: Useful for sharing a direct reference to a tracked story.

ASSET: ACTIVATION DATE START (UTC) / ACTIVATION DATE STOP (UTC)
What it is: The date and time range when Teletrax started and stopped tracking that asset.
Why it matters: If an asset is not yet active, it will not generate detections even if it airs.

CHANNEL: NAME
What it is: The name of the television channel where the detection happened.
Why it matters: Tells you which broadcaster used your content. For example, BBC World News, Deutsche Welle, Canal 24 Horas.

CHANNEL: TELETRAX NAME
What it is: The internal Teletrax name for the channel, which may differ slightly from the common broadcast name.
Why it matters: Used for precise filtering and API calls.

CHANNEL: RESOURCEID
What it is: The unique Teletrax identifier for that channel, for example CH00435.
Why it matters: Stable identifier that does not change even if a channel's display name changes. Useful for API work.

CHANNEL: AFFILIATION
What it is: For US channels, the network affiliation such as ABC, CBS, NBC, Fox.
Why it matters: Allows you to group detections by network.

CHANNEL: REGION NAME
What it is: The global region the channel belongs to.
Why it matters: Useful for geographic filtering.

CHANNEL KEYWORD
What it is: A user-defined tag assigned to channels in the Preferences tab.
Why it matters: Allows you to create custom groups of channels. For example, you could tag all Spanish-language channels with "Spanish Language" and then filter by that keyword. See Part 8 for more on this.

MARKET: NAME
What it is: The market where the channel operates. Outside the US this is typically the country name. Inside the US it is the city/region (Designated Market Area, or DMA). For example, Spain, International (Germany), Salt Lake City.
Why it matters: Tells you the geographic location of the airing. One market may have multiple channels.

MARKET: STATE
What it is: For US markets, the state.
Why it matters: Allows US-specific geographic breakdown.

MARKET: DMA RANKING
What it is: The Nielsen ranking of the US market by size, where 1 is the largest.
Why it matters: Lets you assess the reach of US airings.

EPG PROGRAM NAME (also called Hit: EPG Program Name)
What it is: The name of the television programme that was airing on that channel when your content was detected, for example Telediario Internacional, BBC News at Six, Journal - Reporter.
Why it matters: Tells you not just that the channel used your content, but specifically which programme it appeared in.

HIT: DETECTION DURATION (also called Virtual Detection)
What it is: The total time of the airing including gaps. If your story ran for 20 seconds, was interrupted by a commercial, then continued for 15 more seconds, the detection duration would cover the whole span including that gap.
Why it matters: Gives a realistic picture of how much of a broadcast slot your content occupied.

HIT: ACTUAL DETECTION LENGTH
What it is: The amount of time that was continuously detected, without gaps.
Why it matters: Tells you the actual seconds of your content that were confirmed on screen.

HIT: ACTUAL/VIRTUAL RATIO
What it is: The ratio between actual detected time and total detection duration.
Why it matters: A low ratio means there were interruptions. A ratio close to 1 means the content played through with minimal breaks.

HIT: UTC DETECTION START / UTC DETECTION STOP
What it is: The exact date and time (in UTC) when the detection began and ended.
Why it matters: UTC is the universal reference time. Use this for cross-timezone comparisons.

HIT: LOCAL DETECTION START / LOCAL DETECTION STOP
What it is: The detection time converted to the local time zone of the channel. For US national channels, this is Eastern Time.
Why it matters: Tells you the local broadcast time for the channel that used your content. More meaningful for editorial assessment.

HIT: ASSET OFFSET START / ASSET OFFSET STOP
What it is: Where in the original asset the detection began and ended. Measured from 00:00:00.
Why it matters: Tells you whether the broadcaster used the beginning, middle, or end of your story.

HIT: EID
What it is: The Embedder ID detected in this specific hit.
Why it matters: Matches the detection back to a specific watermarked version of an asset.

HIT: ACTIVATION DATE START (UTC) / STOP (UTC)
What it is: When the asset associated with this hit was activated in Teletrax.
Why it matters: Confirms the tracking window was active at the time of the airing.

PERIOD: DAY
What it is: The specific calendar date when detections happened.
Why it matters: Allows day-by-day breakdown.

PERIOD: DAY OF WEEK
What it is: Monday, Tuesday, etc.
Why it matters: Useful for identifying patterns, such as whether usage spikes on certain days.

PERIOD: BROADCAST MONTH
What it is: The broadcast industry month (which may differ slightly from the calendar month).
Why it matters: Relevant for monthly reporting and billing cycles.

DETECTION DATE: HOURS
What it is: A single hour of the day, for example 8:00 AM to 9:00 AM.
Why it matters: Allows time-of-day analysis.

DETECTION DATE: HOURS PER DAY
What it is: The number of different hours within a single day during which the asset was detected.
Why it matters: Shows whether content was used in a single block or spread across different dayparts.

METADATA (ALL)
What it is: Any custom metadata fields configured for your organisation, such as notes, genre, campaign, or custom IDs.
Why it matters: User-defined. Adds context specific to Reuters workflows.

---

PART 5: EVERY METRIC EXPLAINED

Metrics are the summary numbers in reports. They count or sum things across your query.

# HITS
What it counts: The number of times your assets were detected. Each time a story is identified on a channel, that is one hit.
Example: If your Gaza story was detected 47 times across all channels in one week, # Hits = 47.
Practical note: This is the headline number for "how many times was this used?"

# CHANNELS
What it counts: The number of individual, distinct channels that aired your content.
Example: If BBC World, Al Jazeera English, and Deutsche Welle all used the story, # Channels = 3, even if each used it multiple times.
Practical note: Tells you breadth of distribution across channels, not number of airings.

# MARKETS
What it counts: The number of distinct markets (geographic areas) where your content aired.
Example: If content aired in Spain, Germany, and the UK, # Markets = 3.
Practical note: Use this to answer "how many countries used this story?"

# DAYS
What it counts: The number of distinct calendar days on which detections occurred.
Example: If a story aired on Tuesday, Wednesday, and Friday, # Days = 3.
Practical note: Shows how long a story stayed in rotation.

# ASSET SECONDS
What it counts: The total seconds of your asset that were used across all detections. Drilling down shows which seconds of the clip were used.
Example: A 90-second package where only the first 30 seconds were used on 10 channels = 300 Asset Seconds.
Practical note: More precise than simple hit counts - tells you not just that content was used but how much of it was used.

# ASSETS
What it counts: The number of distinct assets (registered stories or packages) in the results.
Practical note: Useful when looking at a campaign or date range with multiple stories.

# ASSETS WITH HIT
What it counts: The number of assets that had at least one detection. As distinct from # Assets which counts all assets whether or not they were detected.
Practical note: Use "Include all assets" in the cog to show assets with zero hits and then compare.

# CHANNELS WITH HIT
What it counts: Channels that detected your content at least once, as distinct from total channels monitored.

# REGIONS
What it counts: The number of distinct global regions.

# HOURS
What it counts: The total number of distinct hours during which detections occurred.

# HOURS PER DAY
What it counts: How many different hours per day, on average, your content was detected. One asset detected during the 1 AM, 2 PM, and 9 PM hours in a single day = 3 hours per day.

# ENCODATIONS
What it counts: The number of encodation records (watermarked or fingerprinted versions of an asset).

TOTAL ACTUAL DETECTION LENGTH
What it is: The sum of all actual (non-gap) detection time across all hits.
Example: If 20 hits each had 9 seconds of actual detection, Total Actual Detection Length = 180 seconds (3 minutes).

TOTAL DETECTION DURATION
What it is: The sum of all detection durations including gaps.

WEIGHTED GRP
What it is: Gross Ratings Points weighted by Nielsen audience data for 15-minute increments, US only.
Why it matters: Measures estimated audience reach for US markets.

# BROADCAST MONTHS
What it counts: The number of distinct broadcast months represented in the data.

# DAYS OF WEEK
What it counts: The number of distinct day-of-week types in the data.

# CONTENT KEYWORDS / # CHANNEL KEYWORDS
What it counts: The number of distinct content or channel keyword tags represented in results.

# METADATA (custom)
What it counts: For any custom metadata field, the number of distinct values found.

---

PART 6: READING A DETECTION ROW

Here is a real example from the Teletrax documentation:

    Slug: bar
    Item ID: foo
    Market: Spain
    Channel: Canal 24 Horas
    Channel ResourceID: CH00435
    EPG Program Name: Telediario Internacional
    Detection Duration: 00:00:09
    UTC Detection Start: 2013-04-28 00:00:25
    Local Detection Start: 2013-04-28 02:00:25
    Activation Date Start (UTC): 2012-10-03 11:58:26
    # Hits: 1

What this row tells you:

The story with the slug "bar" was used on Canal 24 Horas in Spain. It appeared in the programme Telediario Internacional. The detection lasted 9 seconds. The broadcast happened at 00:00:25 UTC on 28 April 2013, which was 02:00:25 local time in Spain (UTC+2 in summer). This asset has been tracked since October 2012. This is one detection event.

Second example from the same documentation:

    Channel: Deutsche Welle
    Market: International (Germany)
    EPG Program Name: Journal - Reporter
    Detection Duration: 00:00:05
    UTC Detection Start: 2013-04-28 00:17:28
    Local Detection Start: 2013-04-28 02:17:28

This tells you: Deutsche Welle, broadcasting to an international German-language audience, used 5 seconds of the same story in their Journal - Reporter programme, 17 minutes after Canal 24 Horas used it.

Things to note when reading detection rows:

- The detection duration (9 seconds, 5 seconds) tells you how much of your story they used on air. This may be shorter than the original package.
- "Local detection start" is always more useful for editorial context - it tells you whether the story aired in morning news, prime time, or overnight.
- The EPG program name tells you the specific show - important for understanding editorial context.
- A single asset can have many rows if multiple channels or programmes used it.

---

PART 7: DATE AND TIME - HOW IT WORKS

This is one of the areas that trips people up most. Here is what you need to know.

UTC vs Local Time

UTC (Universal Time Coordinated) is a global reference clock that does not change for daylight saving. It is the same everywhere in the world. Every detection has both a UTC timestamp and a local timestamp.

The UTC detection start is the anchor. It is always accurate and unambiguous.

The local detection start converts that UTC time to the local time of the channel. So if a channel in Spain is at UTC+2, a detection at 00:00 UTC will show as 02:00 local time.

Important: In exported CSV files, there is no timezone label on the date values themselves. You must read the column header to know whether a date is UTC or local. "UTC detection start" is UTC. "Local detection start" is the channel's local time.

For US national channels, local time is reported in Eastern Time regardless of where the channel actually broadcasts.

Fixed vs Relative Periods in Report Configuration

When setting up a report period:

A fixed period is a specific date range, for example 1 June to 30 June 2026. It does not change when you run the report again later. Use this for a defined project period.

A relative period moves with time, for example "last 7 days" or "this week". Use this for ongoing monitoring reports you check regularly.

The timezone you select when running a report determines how the dates are interpreted. If you select "Local" timezone, the report shows hits in each channel's own local time, which means some channels may be on a different calendar day than others depending on where they are in the world.

If you select a specific timezone (for example UTC or Central Europe), the report uses that timezone consistently for all channels. This is usually the right choice for Reuters global reporting, as it gives you a consistent reference frame.

Date Formats in Exports

CSV export: yyyy-mm-dd hh:mm:ss (for example 2013-04-28 00:00:25)
Excel/XLSX export: Dates are formatted as yyyy-mm-dd in date columns. Excel standard functions can reformat these.
Portal display: Follows your browser's locale settings.

Period Offset for Broadcast Days

Some newsrooms define a "broadcast day" as starting at 6:00 AM rather than midnight. Teletrax supports a period offset that shifts the start of the reporting day. This is relevant if you need to match your reports to a specific editorial daypart definition.

---

PART 8: FILTERING AND SEARCHING

How to find specific stories

In the Detections tab, open a report and use the Content Filters to narrow by story. You can filter by Item ID, slug, or other metadata fields. Click inside the filter box to see a dropdown of available options.

You can stack filters. For example: Item ID = "Gaza-Violence" AND Market = "Germany" will show only German channel airings of that specific story.

For negative filters: click "is not" in the dropdown to exclude a value. For example, "Channel Affiliation is not ABC" will exclude ABC affiliates.

Filtering by channel or market

Use the Channel Filters to select specific channels, markets, regions, or affiliations. You can filter by Channel Name, Market Name, Channel Keyword, and more.

Filtering by date and time

Use the date/time selector to set your period. You can type dates directly or click on the calendar. The time range is inclusive, meaning "up to and including" the stop time.

For day-part analysis, use the Day-Part Selector (if activated on your seat) to limit results to specific hours or days of the week. For example, to check prime time usage across a week, set the time slider to 20:00 to 23:00 and select the full week.

Searching for a specific airing time

If you know roughly when a story aired - for example, you heard it was on a Spanish channel around 2 AM local time on 28 April - set the date to 28 April, use Spain as a market filter, and set the time range around 01:00 to 03:00. The Local Detection Start column will show you the exact time.

---

PART 9: EXPORTING DATA

The Export button is at the top of every report. Clicking it transforms into a Download button. Exports are not limited to the 2,000 row portal limit.

CSV Format

Best for: Large datasets, feeding into databases, machine-readable processing, data analysis in Python or R.
Structure: Column headers always present. Optional header block at top showing report date and period. Dates as yyyy-mm-dd hh:mm:ss.
Separator: Configurable - comma, pipe, tab, or any single character. Default is comma.
Key limitation: No timezone label on date values - rely entirely on column headers to know UTC vs local.
When to use: When you need to process the data further, share with a data team, or import into another system.

XLSX Format (Excel)

Best for: Opening directly in Excel, sharing with colleagues who need to filter or pivot the data themselves.
Structure: Two tabs. Tab 1 contains the report results. Tab 2 contains information about the report run (date range, configuration).
Date columns are formatted as proper Excel date/time values (yyyy-mm-dd format).
When to use: Day-to-day sharing with producers, editors, or management who want to browse in Excel.

XML Format

Best for: Automated system integration, feeding into internal content management systems, archiving structured data.
Structure: Report elements with fields and metric datasets. Supports multiple datasets per row.
All times are UTC in ISO 8601 format unless specified otherwise.
When to use: When you have a developer integrating Teletrax data into an internal system or database.

Automated/Scheduled Reports

Teletrax can send reports to you automatically on a schedule - daily, weekly, or at a custom interval. Delivery methods are email, FTP pickup, or HTTP post. Contact your Teletrax client services representative to set this up. Large reports are better delivered via FTP rather than email.

---

PART 10: CHANNEL KEYWORDS

What they are

Channel Keywords are user-defined tags you assign to channels. They are managed in the Preferences tab. Think of them as custom grouping labels.

How they work

You create a keyword - for example "Reuters Tier 1 Partners" or "Spanish Language Channels" or "Asia Pacific" - and assign it to as many channels as you want. Once assigned, you can filter reports by that keyword to see aggregated data for all channels in that group.

This is especially useful for Reuters because your monitoring covers channels across many different countries and languages. Instead of selecting 40 individual channels every time you run a report, you can create a keyword like "APAC Broadcasters" and filter by it.

The metric "# Channel Keywords" counts how many distinct channel keyword groups appear in your results.

How to use them practically

In a report filter, choose "Channel Keyword" from the channel filter dropdown, then select the keyword you want. The report will show only detections on channels that carry that keyword.

---

PART 11: COMMON QUESTIONS PRODUCERS ASK

"How many times was this story used?"

Look at: # Hits metric in any detections report filtered to that story.

Set your content filter to the slug or Item ID of the story. Set your date range to the relevant period. The # Hits number tells you total detections. Drill down to see individual rows for each airing.

"Which channels used it?"

Look at: The Channel: Name column in the details grid, or # Channels metric for a summary count.

In the details grid, every row shows the channel. Sort by Channel Name to group all airings by broadcaster. Or use # Channels to get a count of distinct channels. To see a breakdown by channel, group the report by Channel Name.

"Which markets (countries) used it?"

Look at: The Market: Name column, or # Markets metric.

Each row shows the market. Outside the US, Market Name is the country. Use # Markets for a total count of countries. Group by Market Name to see which countries used the story most.

"What time did they air it?"

Look at: Hit: Local Detection Start for the local broadcast time at each channel.

This is the most useful column for editorial assessment. It tells you whether the story ran in morning news, afternoon, prime time, or overnight - in local time at each channel.

For a UTC reference (for internal timelines or comparing across time zones), use Hit: UTC Detection Start.

"How long did they use?"

Look at: Hit: Actual Detection Length for clean on-air time, or Hit: Detection Duration for the total span including any gaps.

Example: If a 3-minute package was cut to a 25-second news brief, Hit: Actual Detection Length will show 00:00:25. If there was a brief cut-away and the story resumed, Detection Duration covers the whole span.

To get a total across all airings, use the Total Actual Detection Length metric.

"Did anyone air it during prime time in the US?"

Look at: Set a Channel filter to US channels (or use a Channel Keyword for US broadcasters). Set the time range in the period picker to your definition of prime time (for example 20:00 to 23:00 Eastern Time). Set the timezone to Eastern. Run the report.

"How do I see what programmes the story appeared in?"

Look at: Hit: EPG Program Name column.

This shows the name of the show that was airing when the detection happened. This is useful for understanding editorial context - was it used in a straight news bulletin, a documentary programme, a breakfast show?

"I know a specific channel used the story - why is it not showing up?"

Check:
1. Is the channel in the Broadcasters tab and active for monitoring?
2. Is the asset active in Teletrax during the period you are checking? See Asset: Activation Date Start.
3. Is your date range correct, and are you using the right timezone?
4. Detection data takes 30 to 60 minutes to appear after airing. If you are checking very recent airings, wait and refresh.
5. If you want to see assets that had zero detections, tick "Include all assets" in the cog icon menu.

"I want to see which seconds of my package were actually used."

Look at: # Asset Seconds metric with drill-down, combined with Hit: Asset Offset Start and Hit: Asset Offset Stop columns.

Asset Offset shows where in the original video the detection started and stopped. If a 3-minute package shows an asset offset of 00:00:15 to 00:00:40, the broadcaster used seconds 15 through 40 of your original clip.

---

PART 12: PRACTICAL TIPS FOR DAILY USE

Data freshness: Detections appear 30 to 60 minutes after airing. Do not assume absence of data means a story was not used - give it at least an hour.

Row limit: The portal shows maximum 2,000 rows. If your query has more results than that, you will not see all of them on screen. Export to get the full dataset.

Data can change: Teletrax is a dynamic system. A detection from two days ago may be updated if new information comes in (for example, a channel that was cleared for monitoring late, or a watermark matched after an asset was registered). If you need to be certain your data is final, it is best practice to re-export a day's data 24-48 hours after the day in question.

Saving and sharing: Name and save your frequently used reports. Share them with colleagues on the same organisation seat. This ensures everyone is running consistent queries.

Exporting for a senior editors call: Export to Excel (XLSX). It gives a clean two-tab file. Tab 1 has all the data, Tab 2 confirms the report parameters. Sort by Market Name or Channel Name before exporting to make the file easier to read.

Checking a specific broadcast: If you need to verify a specific claimed airing, set your date to that exact day, filter to the channel, and look at Local Detection Start. The EPG Program Name will confirm which show it ran in.

---

GLOSSARY OF KEY TERMS

Asset: A piece of content registered in Teletrax for tracking. At Reuters, this is typically a video story or package that has been fingerprinted.

Detection / Hit: One confirmed instance of your content being identified on a channel.

Encodation: The record created when content is watermarked or fingerprinted. It links the embedded signal to the content's metadata.

EID (Embedder ID): The unique identifier embedded in watermarked content. Every embedder has one or more EIDs.

Fingerprint: A digital signature taken from the video content itself, not embedded but derived from the picture. Used by Teletrax to identify content.

Watermark: An invisible signal embedded into the video signal. Does not change the appearance of the video. Used by Teletrax to identify content.

Market: The geographic broadcast area. Outside the US, this is the country. In the US, this is the Designated Market Area (DMA), a city-region.

Resource ID: A unique identifier assigned by Teletrax to each asset, channel, market, or other object. Format example: AE12345-2012-05-00037 for an asset, CH00435 for a channel.

Roll-up: The process by which Teletrax groups individual detection events into reported hits. Close detections within a threshold period are merged into a single hit.

UTC: Universal Time Coordinated. The global reference clock. All Teletrax UTC timestamps use this. Add the channel's UTC offset to get local time.