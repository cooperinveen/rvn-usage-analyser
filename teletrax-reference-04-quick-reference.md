TELETRAX QUICK REFERENCE FOR REUTERS PRODUCERS

---

SECTION 1: IN ONE PAGE — WHAT TELETRAX TELLS YOU

Teletrax tracks whether your video content aired on television, where, when, and for how long. The six most important things it tells you:

1. WHERE it aired — which channel, in which market (country or US city), on which continent
2. WHEN it aired — exact UTC timestamp and local channel time of every detection
3. HOW LONG — both the actual detected duration and the "detection duration" (with gaps filled)
4. WHAT PROGRAMME — the EPG programme name the content aired inside
5. HOW MANY TIMES — the # Hits count across any time range or channel set
6. HOW RELIABLY — the QI score, which tells you how confidently the watermark was read back

---

SECTION 2: KEY TERMS AT A GLANCE

| Term | One-line definition |
|---|---|
| Asset | A piece of tracked content registered in Teletrax (your story, package, or clip) |
| Encodation | The record linking a watermark or fingerprint to an asset's metadata |
| Watermark | An invisible signal embedded into video pixels to identify the content |
| Fingerprint (CECO) | A unique "audio-visual signature" extracted from the video without altering it |
| EID (Embedding ID) | The unique number identifying which Teletrax embedder watermarked the content |
| Detection / Hit | One confirmed airing of your content on a monitored channel |
| Market | The broadcast territory where a channel operates (country outside US; DMA city inside US) |
| DMA | Nielsen Designated Market Area — the US regional TV market (e.g. Salt Lake City) |
| EPG Program Name | The TV guide programme title that was airing when your content was detected |
| UTC Detection Start | Exact moment the detection began, in universal time (no daylight saving) |
| Local Detection Start | Same moment converted to the channel's own time zone |
| Detection Duration | Total reported airtime including short gaps (e.g. a cut-away) — the "virtual" length |
| Actual Detection Length | Only the continuously detected seconds, with no gap-filling |
| QI (Quality Indicator) | Score 1–10 rating how clearly the watermark was read back from broadcast |
| Roll-up | How Teletrax merges many individual detection fragments into one reported hit |
| Generic Hit | A raw, unmerged detection fragment — not shown on the portal |
| ResourceID | Teletrax's unique alphanumeric ID for any object (asset, channel, report, etc.) |
| Retrotracking | Teletrax matching a detection backwards in time once metadata arrives late |
| Modification | A flag that historical data for a day has changed and may need re-syncing |
| Permalink | A permanent read-only URL for a specific asset's details page |

---

SECTION 3: METRICS QUICK REFERENCE

| Metric | Plain-English meaning |
|---|---|
| # Hits | Number of individual detection events (each airing = one hit) |
| # Assets | Number of distinct pieces of content that were detected |
| # Channels | Number of distinct channels that carried your content |
| # Markets | Number of distinct markets (territories) where detections occurred |
| # Regions | Number of distinct countries/regions |
| # Days | Number of calendar days on which detections occurred |
| # Hours | Number of distinct clock-hours in which detections occurred |
| # Hours per day | How many different hours of the day (on average) your content appeared |
| # Encodations | Number of encodation records matched to detections |
| # Broadcast months | Number of broadcast calendar months covered |
| # Days of Week | Number of distinct days-of-week (Mon, Tue, etc.) with detections |
| Total Actual Detection Length | Sum of all continuously detected seconds across all hits |
| Total Detection Duration | Sum of all detection durations (gap-filled) across all hits |
| # Asset Seconds | Which specific seconds of the asset were detected (for partial airing analysis) |
| Weighted GRP | Nielsen Gross Rating Points for detected airings (US only, 15-min increments) |
| # Metadata | Count of records matching a custom metadata value |

---

SECTION 4: COLUMN QUICK REFERENCE

| Column | What it tells you |
|---|---|
| Slug | Your internal story/package label for the asset |
| Item ID | Your unique content identifier for the asset |
| Market: Name | The territory name (e.g. "Spain", "Salt Lake City") |
| Market: DMA Ranking | US market size ranking (lower = bigger market) |
| Market: State | US state the market is in |
| Channel: Name | The TV channel that aired your content |
| Channel: Teletrax Name | Teletrax's canonical name for that channel |
| Channel: ResourceID | Teletrax's internal code for the channel (e.g. CH00435) |
| Channel: Affiliation | US network parent (ABC, CBS, Fox, NBC, CW) |
| Channel: Region Name | Geographic region of the channel |
| EPG Program Name | TV programme playing when your content was detected |
| UTC detection start | Detection start time in UTC (no time zone ambiguity) |
| UTC detection stop | Detection end time in UTC |
| Local detection start | Detection start in the channel's local time zone |
| Local detection stop | Detection end in the channel's local time zone |
| Hit: Detection Duration | Total reported airtime with gaps filled (virtual length) |
| Hit: Actual Detection Length | Continuously detected time only (no gap-filling) |
| Hit: Actual/Virtual Ratio | How much of the reported duration was truly continuous |
| Hit: Asset offset start | How far into your asset the detection begins |
| Hit: Asset offset stop | Where in your asset the detection ends |
| Hit: EID | The embedding ID used to watermark this specific hit |
| Asset: Activation date start (UTC) | When Teletrax started tracking this asset |
| Asset: Activation date stop (UTC) | When Teletrax stopped tracking this asset |
| Asset: Length | Running time of the asset |
| Asset: ResourceID | Teletrax's unique ID for the asset |
| Asset: Permalink | Link to the asset's read-only detail page |
| Asset: EID | Embedding ID associated with the asset |
| Asset: Encodation Facility | Where the watermark was embedded |
| Period: Day | Specific calendar date of the detection |
| Period: Day of Week | Day name (Monday, Tuesday, etc.) |
| Period: Broadcast Month | Broadcast calendar month of the detection |
| # Hits | Count of detection events in that row's grouping |

---

SECTION 5: UNDERSTANDING A DETECTION — ANNOTATED EXAMPLE

From the CSV documentation, here is a real detection:

Slug: bar | Item ID: foo | Market: Spain | Channel: Canal 24 Horas | EPG: Telediario Internacional | Detection duration: 00:00:09 | UTC detection start: 2013-04-28 00:00:25 | Local detection start: 2013-04-28 02:00:25 | Activation date start: 2012-10-03 11:58:26 | # Hits: 1

What each field means:

- "bar / foo" — your internal story label and ID. This is what you registered in Teletrax when you uploaded the content.
- "Spain" — the content aired in the Spain market.
- "Canal 24 Horas" — the specific channel. ResourceID CH00435 is Teletrax's internal code for it.
- "Telediario Internacional" — the EPG programme that was on air when your content was detected.
- "00:00:09" — nine seconds of your content were detected (this is detection duration, gap-filled).
- "2013-04-28 00:00:25 UTC" — the detection started just after midnight UTC on 28 April 2013.
- "2013-04-28 02:00:25 Local" — the same moment in Madrid local time (UTC+2 in summer). The two-hour difference shows Canal 24 Horas is in the UTC+2 zone.
- "Activation date: 2012-10-03" — you registered this asset with Teletrax back in October 2012, giving it a long tracking window.
- "# Hits: 1" — this row represents a single detection event.

Key takeaway: UTC time is always stable and safe for archiving. Local time is useful for understanding what time of day the audience saw your content.

---

SECTION 6: COMMON GOTCHAS

1. TWO TIME COLUMNS, EASY TO CONFUSE. "UTC detection start" and "Local detection start" show the same moment. UTC never changes with seasons. Local time reflects the channel's time zone and shifts with daylight saving. The CSV has no time zone label in the value — you must read the column header to know which you are looking at.

2. DETECTION DATA ARRIVES 30–60 MINUTES LATE. Teletrax processes broadcast and makes detections available approximately 30 to 60 minutes after air time. If you are searching for a story that just aired, it may not be in the portal yet.

3. HISTORICAL DATA CHANGES (RETROTRACKING). Teletrax can match detections backwards in time once metadata arrives late. A story registered today may generate detections in yesterday's data. If you are building a data pull, always check the Modifications API for days that have changed.

4. THE PORTAL CAPS AT 2,000 ROWS. The portal view is limited to 2,000 rows. If your query returns more, use the Export button to get the full data in Excel. Do not assume the portal is showing you everything.

5. "LOCAL" TIME ZONE IN REPORTS MEANS EACH CHANNEL'S OWN ZONE. When you select "Local" in the time zone picker, Teletrax uses each channel's own local time — not your computer's local time. A report set to "Local, Today" will exclude channels that are still technically yesterday in their time zone.

6. DETECTION DURATION VS ACTUAL DETECTION LENGTH. These are not the same. Detection Duration (virtual) fills in short gaps, such as a commercial break during your content. Actual Detection Length counts only the genuinely continuous seconds. For editorial verification, use Actual; for rights/licensing calculations, confirm which your team should use.

7. QI SCORES REQUIRE CONTEXT. A QI of 3 does not mean something went wrong — it means some partials are expected. Always assess QI in consultation with Teletrax/Client Services rather than in isolation.

8. US NATIONAL CHANNELS REPORT IN EASTERN TIME. For US national channels, Local Detection Start is shown in Eastern Time regardless of the viewer's actual time zone.

9. DATA FOR A DAY CAN BE REPROCESSED MULTIPLE TIMES. Channel clearances, outages, and late-arriving asset registrations all trigger data modifications. The Modification "hint" field tells you why a day was flagged (e.g. ChannelClearance, HitChanged, AssetDeleted).

10. WATERMARKS CANNOT BE STACKED. If your content already contains a Teletrax watermark and is re-watermarked, the embedder pauses for 4–6 seconds. The overlapping section may not be detected for either owner. Do not re-watermark already-watermarked Reuters material.

---

SECTION 7: HOW TO READ "# HITS"

"# Hits" is the count of individual detection events within the scope of your report query.

One hit = one continuous (or gap-filled rolled-up) airing on one channel in one time window.

Examples of what # Hits means in practice:

| Scenario | # Hits |
|---|---|
| Your package aired once on BBC World at 14:00 UTC | 1 |
| Same package aired twice on BBC World (14:00 and 18:00) | 2 |
| Package aired once on BBC World and once on CNN International | 2 |
| Package aired 15 times across 10 channels over a week | 15 |

What # Hits does NOT tell you:
- It does not tell you the audience size (use Weighted GRP for that, US only)
- It does not tell you how long the content aired (use Total Detection Duration for that)
- It does not tell you how many different channels aired it (use # Channels for that)
- A hit with Detection Duration of 00:00:09 and a hit with Detection Duration of 00:22:00 both count as 1 hit each

When drilling down in the portal, you can click a # Hits value to see the individual detection rows behind it.

---

SECTION 8: QI SCORE GUIDE

QI = Quality Indicator. It measures how clearly the Teletrax watermark was read back from the broadcast signal. Scale is 1 to 10.

| QI | What it means | What to expect |
|---|---|---|
| 1 | Borderline | Detection possible but expect many partial hits and misses; consider increasing watermark strength |
| 2–3 | Low | Some detections, but partial hits are common; full story may not always be captured |
| 4–5 | Acceptable | Fewer partials; most airings captured but occasional gaps |
| 6–7 | Good | Most content found as aired; reliable for routine monitoring |
| 8 | Very good | High confidence; nearly all watermarkable content is detected |
| 9–10 | Excellent | Maximum confidence; watermark strength could be reduced if video quality requires it |

Important notes on QI:
- QI is measured on the broadcast signal, not on your original file. Compression, uplink, and re-encoding all affect the score.
- QI is an output, not a setting. You cannot set a target QI before broadcasting.
- A QI of 1–3 does not mean Teletrax failed — it means the signal conditions were difficult. Partials may still be reported.
- Do not interpret QI scores in isolation. Always work with your Teletrax/Client Services representative if scores are consistently low.
- QI is separate from # Hits. A story can have many hits at a low QI (short detections, many partials) or few hits at a high QI (one clean full-length detection).