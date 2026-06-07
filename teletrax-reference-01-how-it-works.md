# Teletrax Complete Reference: How the System Works

---

## Table of Contents

1. What Teletrax Is
2. The Core Concept: Fingerprinting vs Watermarking
3. The Full Flow: From Content Creation to Detection Report
4. Key Terminology
5. How Content Gets Into Teletrax
6. How Detection Works
7. The Data Model
8. Reports: What They Show and How to Read Them
9. Limitations and Gotchas
10. Glossary

---

## 1. What Teletrax Is

Teletrax is a global broadcast monitoring service. Its purpose is simple: to detect when your video content airs on television, anywhere in the world, and to report back to you exactly when, where, and on which channel it appeared.

### The Problem It Solves

When a news agency distributes footage, a broadcaster distributes a TV show, or an advertiser places a commercial, there is no automatic mechanism to confirm whether and when that content actually aired. Teletrax solves this by creating a technical "fingerprint" or invisible "watermark" of your content before distribution, then monitoring TV broadcasts globally to detect when that content appears.

### Who Uses It

Teletrax is used by:
- News agencies distributing video content to broadcasters worldwide
- TV program distributors and studios tracking how their shows air
- Advertisers and advertising agencies verifying commercial airings
- Rights holders monitoring unauthorised use of their content

---

## 2. The Core Concept: Fingerprinting vs Watermarking

Teletrax uses two fundamentally different technologies to identify content. Understanding the difference is essential.

### Video Watermarking

Watermarking modifies the video itself. An invisible signal is inserted into the pixels of every frame during encoding. This signal is perceptible to machines but not to humans — the video looks identical to viewers.

The watermark carries a payload: an EID (Embedder ID) plus a time/date code that increments every second. This means every second of watermarked content has a unique identifier. When Teletrax detects that second of video on a broadcast channel, it can decode the payload and know exactly who watermarked it and when.

Watermarking requires active hardware or software intervention in your workflow. Content must be processed through a Teletrax embedder before distribution. The resulting watermark survives compression, resizing, and most forms of signal degradation.

**Key property of watermarks:** The watermark travels with the content invisibly. Even after multiple re-encodings and broadcasts, the signal persists.

**What a watermark cannot survive:** Being overlaid by another watermark of the same type (see Section 9 for details on this limitation).

### Video Fingerprinting

Fingerprinting does not modify the video. Instead, it analyzes the video's visual content and creates a compact mathematical description — a "fingerprint" — that uniquely represents that content. This fingerprint is stored in Teletrax's database.

When Teletrax monitors a broadcast channel, it continuously analyzes what is on air and compares it against stored fingerprints. If a match is found, a detection is recorded.

Fingerprinting is useful when you cannot or do not want to modify the original video. You provide Teletrax with either the original video file (which they fingerprint on your behalf) or a pre-generated fingerprint file (called a CECO file).

**Key property of fingerprints:** They are read-only — the original content is unchanged. However, fingerprints can fail to match if content is substantially altered (heavy re-editing, significant visual changes).

**What a fingerprint cannot survive well:** Major re-editing, scene reordering beyond configured thresholds, or content too short (under 5 seconds is rejected outright).

### When Each Is Used

In practice, many clients use both. News agencies often use watermarking for live feeds (where content is embedded as it goes out the door) and fingerprinting for pre-produced packages uploaded to a portal. Advertisers typically use watermarking for commercials. Documentaries and TV shows may use fingerprinting.

---

## 3. The Full Flow: From Content Creation to Detection Report

The Teletrax workflow has four distinct stages.

### Stage 1: Embedding / Fingerprinting

Your content is prepared for tracking. This happens one of two ways:

**Watermarking:** A Teletrax embedder (hardware SDI device, or software plugin for Rhozet, Amberfin, Telestream, Digital Rapids, or others) processes your video and invisibly inserts the watermark payload. At the end of this process, an **encodation log** file is produced. This log records the EID used, the timestamps of embedding start and stop, and any metadata you configured.

**Fingerprinting:** Either you upload a video file to Teletrax via FTP (and they generate the fingerprint), or you use the `fptool` command-line tool to generate a CECO file yourself, then upload it via FTP. The CECO file contains the mathematical fingerprint data plus metadata.

### Stage 2: Registration

The encodation log (for watermarks) or CECO file (for fingerprints) is uploaded to Teletrax via FTP (`ftp.teletrax.tv`). Teletrax processes this file and creates an **Asset** in its database. The asset links the technical identification data (watermark payload or fingerprint) to your metadata (title, slug, item ID, etc.).

Files go through states: uploaded to root FTP directory → Processing folder → Archive folder (success) or Error folder (failure). Error files have an accompanying `.errordetails.txt` file explaining what went wrong.

### Stage 3: Broadcast Monitoring and Detection

Teletrax operates a global network of broadcast monitoring stations. These stations continuously record television broadcasts and analyze them for watermark payloads or fingerprint matches. When content is identified:

- The time and date of detection is recorded
- The channel and market are recorded
- The detection is matched against registered encodations in the database

Detection data is available in the portal approximately **30 to 60 minutes** after the content airs.

### Stage 4: Reporting

Matched detections appear in the Teletrax portal under the Detections tab. They can also be retrieved via the REST API. Reports show when, where, and how long your content aired, with full metadata about the channel, market, EPG programme, and detection duration.

---

## 4. Key Terminology

### Asset

An Asset is the central object in Teletrax. It represents a piece of content being tracked. An asset is created when a watermark encodation or fingerprint is registered with the system, and it holds all associated metadata. One asset can have multiple encodations (for example, the same programme distributed in different versions). An asset has a unique Resource ID (e.g. `AE12345-2012-05-00037`).

### Encodation

An encodation is the record of a specific watermarking or fingerprinting event for a piece of content. It stores the technical details: for a watermark, this is the EID, the embedding start and stop timestamps, and embedding quality metrics. For a fingerprint, this includes the fingerprint ID and a base64-encoded CECO. One asset can have multiple encodations. An encodation has its own Resource ID (e.g. `AE12345-2012-05-00037-001`).

### EID (Embedder ID)

The Embedder ID is a unique integer assigned by Teletrax/Civolution to identify a specific embedder. Every Teletrax embedder has one or more EIDs. The watermark payload is constructed from the EID combined with a timestamp. The EID allows Teletrax to identify who watermarked the content and at which facility. EIDs are assigned to clients by Client Services — you cannot change or create your own.

### Watermark Payload

The data carried inside a video watermark. It consists of the EID plus a UTC time/date code that increments every second. Because each second has a unique payload, every second of watermarked content can be individually identified. The payload survives compression and signal degradation.

### Detection / Hit

A detection (also called a "hit") is a confirmed occurrence of your content on a broadcast channel. Each hit records: the channel, the market, the UTC detection start and stop time, the local detection start and stop time, the detection duration, and the EPG programme name at the time of broadcast.

### Generic Hit

The raw detection data that Teletrax's monitoring network produces. Generic hits are not shown directly in the portal. Instead, Teletrax "rolls up" generic hits into reportable hits using configurable rules. For example, if content airs continuously for 40 minutes with short breaks (e.g. commercials), the roll-up logic can merge these into a single reported hit rather than dozens of individual detections.

### Roll-up

The process of aggregating generic hits into reportable hits. Roll-up rules are configured by Teletrax operations in consultation with you. Rules differ depending on whether the content is watermarked and matched (metadata registered) or unmatched (metadata not yet registered). For example, an unmatched detection might use stricter rules that don't merge closely spaced hits, while a matched detection can use more permissive merging rules.

### Channel

A specific television broadcast channel monitored by Teletrax. Channels have a Resource ID (e.g. `CH00002`), a name, a market they belong to, a timezone offset, and optionally metadata like priority or affiliation. For US national channels, channels can have a `channelFeedType` indicating whether it's a unique feed or a time-delayed additional feed.

### Market

A geographic market where a channel broadcasts. Outside the US, market typically corresponds to a country. Inside the US, markets correspond to Nielsen Designated Market Areas (DMAs), which have a DMA code and rank. Each market has a region (e.g. `GBR`, `USA`) and a continent (e.g. `EU`, `NA`).

### Field

A metadata field definition. Fields can be applied to three entities: Assets, Hits, or Channels. Field types include: Numeric, Integer, Text, Video, List, Market, Boolean. Fields have a `fieldName` (used in the API) and a `displayName` (shown in the portal). Some fields are configured as required, meaning they must be populated when preparing content for tracking.

### Resource ID

A string that uniquely identifies any resource within Teletrax. Resource IDs exist for assets, encodations, channels, markets, fields, reports, and modifications. You cannot make assumptions about the format or structure of a Resource ID — it is opaque and should be treated purely as an identifier. Example: `AE12345-2012-05-00037`.

### QI (Quality Indicator)

A score from 1 to 10 that indicates how reliably a watermarked signal is being detected on a broadcast channel. QI is not something you can measure before broadcast — it is only meaningful once content has actually aired and been detected. A QI of 1-3 means detections may be partial. A QI of 6-7 means most content is being found. A QI of 8-10 means excellent detection quality. QI is a statistical measure and always requires interpretation with your Teletrax representative — it is easy to misread.

### Modification

A signal that data for a past day has changed. Teletrax uses a modification API to tell integrations "the data for day X has been updated — you should re-fetch it." This is necessary because detection data is retroactive (see "Retrotracking" below). Modifications have hints indicating why the day changed: `HitChanged`, `AssetMetadataChanged`, `ChannelClearance`, `AudienceUpdate`, `AssetDeleted`, `OutageChange`, etc.

### Retrotracking

The ability of Teletrax to look back in time. If you register an asset today but the content actually aired last week, Teletrax can retroactively match past detections against your newly registered asset. This is powerful but also means detection data can appear or change after the fact, which is why the modification API exists.

### CECO File

A CECO file (extension `.ceco` or `.ce`) is a binary file containing a video fingerprint generated by the `fptool` tool. It is the format used to upload fingerprints to Teletrax. The name CECO refers to the internal format. CECO data is also embedded in encodation XML files as base64-encoded binary data.

### Encodation Log

The file produced by a Teletrax embedder after watermarking. It records the technical details of the watermarking session: EID used, timestamps, embedding parameters, and metadata. This file is uploaded to Teletrax to register the watermark event. The current format is the V2.1 XML format (`.encodation.xml` or `.xml`).

### Configuration File

A file supplied by Civolution that stores all watermark embedding settings, including EID, watermark parameters, and metadata definitions. End users cannot alter this file. It defines how the embedder behaves.

### Prior Watermark

When a Teletrax embedder processes content that already contains a watermark (from a previous watermarking session by any client), this existing watermark is called a prior watermark. The embedder detects prior watermarks and temporarily disables new watermark embedding during those segments to avoid stacking. The `prior_watermark` field in an encodation log records what percentage of the content had a prior watermark detected.

### Mappings

A feature in the V2+ encodation format that records the relationship between old (prior) watermarks and new watermarks in the same content. Mappings allow Teletrax's back end to report detections to multiple owners. Mappings data can be encrypted (AES) in the encodation file.

### Expected Hit

A pre-declared expected airing. Clients can upload a CSV file specifying when and on which channel content is expected to air. Teletrax then compares actual detections against these expectations, allowing you to track delivery compliance.

### EPG

Electronic Programme Guide. The TV schedule data that tells Teletrax what programme was broadcasting on a given channel at the time a detection occurred. The `hitEpgProgramName` field in reports shows the programme name.

### Outage

A registered period when a channel was not being monitored by Teletrax. Outages affect detection data for those periods. The modification system includes `OutageChange` as a hint when an outage is added or changed for a day.

### GRP (Gross Rating Points)

A broadcast advertising metric. Teletrax can include Weighted GRP data (based on Nielsen ratings data, aggregated in 15-minute increments) in reports, giving advertising clients a measure of audience delivery.

---

## 5. How Content Gets Into Teletrax

### Path 1: Watermarking

**Hardware SDI Embedders**

The iGolgi W1000 is a hardware device that sits in the signal chain. SDI video enters, the watermark is invisibly inserted into the pixel data, and watermarked SDI video exits. Audio and ancillary data pass through untouched. Supports SD (PAL/NTSC), HD 720p, HD 1080i/p, 2K resolutions. In the event of embedder failure, the input is passed through to the output unmodified.

**Software Embedders**

For file-based workflows, watermarking integrates with transcoding tools:
- Rhozet Carbon Coder (via Teletrax plugin)
- Amberfin iCR (via Teletrax plugin)
- Telestream, Digital Rapids (via Teletrax Baseband SDK)

The watermark is inserted either before or after transcoding. It is strongly recommended to add it to the target (output) file, not the source, to prevent watermark degradation during transcoding.

**What happens after watermarking:**

The embedder generates an encodation log file. This XML file contains the EID, timestamps, embedding parameters, and metadata. You upload this to Teletrax via FTP. The file is processed and an Asset is created in the database.

For the Rhozet plugin, if no additional metadata is configured, the filename is used as the unique identifier. You can later update metadata via the API using the filename as a lookup key.

### Path 2: Video Fingerprinting

**Option A: FTP Upload of Raw Video**

Upload your video file to the Teletrax FTP server (`ftp.teletrax.tv`). Teletrax generates the fingerprint internally. The video filename becomes the Item ID in the portal. Additional metadata can be added later manually or via the API.

File requirements: under 2GB, less than 8 hours in duration, minimum 24fps, must contain significant movement throughout. Supported formats include MP4, MOV, AVI, Transport Stream, Program Stream, H.264, MPEG-2, WMV, and others. CDXA/MPEG-PS is not supported.

**Option B: Generate CECO Yourself Using fptool**

1. Prepare a metadata XML file in the Teletrax encodation format
2. Run `fptool.exe` with your video file and metadata XML to generate a `.ce` or `.ceco` fingerprint file
3. Upload the CECO file via FTP

The `fptool` can also update the metadata XML embedded in an existing CECO file if metadata changes after the fingerprint is generated.

**Option C: YouTube URL**

If content is on YouTube (no geo-blocking for US, public or unlisted), you can register an asset using just the YouTube URL. Teletrax downloads the video from a US-based server and generates the fingerprint. The asset takes up to 15 minutes to appear after submission.

**Option D: HTTP URL via API**

Submit a POST to the Asset API with a publicly accessible MP4 URL. Teletrax downloads and fingerprints it asynchronously. The API returns HTTP 202 Accepted immediately; asset creation happens in the background.

### Encodation File Format (V2.1 XML)

The current (recommended) format for uploading watermark information is V2.1 XML. The file contains:

```xml
<encodation_import version="1.0">
  <encodations>
    <encodation>
      <client>158212</client>             <!-- Client ID from Civolution -->
      <embeddertype>...</embeddertype>     <!-- Embedder application info -->
      <facility>...</facility>             <!-- Where embedding happened -->
      <clientkey>A3871</clientkey>         <!-- Your unique key for this encodation -->
      <watermark>
        <embeddingid>100</embeddingid>     <!-- EID -->
        <start_time_utc>2010-01-21T09:50:43Z</start_time_utc>
        <stop_time_utc>2010-01-21T10:11:02Z</stop_time_utc>
      </watermark>
      <metadata>
        <field name="itemid">A3871-32</field>
        <field name="slug">The best of...</field>
      </metadata>
    </encodation>
  </encodations>
</encodation_import>
```

Times must be in ISO 8601 format. The `clientkey` field is important: it allows you to update this encodation later by re-importing a file with the same key. Without a `clientkey`, updating an imported encodation is not possible.

---

## 6. How Detection Works

### The Monitoring Network

Teletrax operates monitoring stations at broadcasters or head-end facilities around the world. These stations continuously capture broadcast signals and analyze them.

### Watermark Detection

The detector analyzes the video pixel data to extract the watermark payload. When a valid payload is found:
- The EID is decoded
- The embedded timestamp is extracted
- This is matched against registered encodations in the Teletrax database

When the detected EID + timestamp range falls within a registered encodation's time range, a match is made and a detection is recorded.

### Fingerprint Detection

The detector generates fingerprint data from what is currently broadcasting and compares it against the database of stored fingerprints (CECOs). If a match is found above a confidence threshold, a detection is recorded. The detector runs continuously.

### Processing Timeline

- Detection data appears in the portal approximately **30 to 60 minutes** after content airs
- Retrotracking can apply matches to past days when a new asset is registered
- Modifications can cause data for past days to be updated

### QI Scoring

QI (Quality Indicator) values from 1 to 10 indicate detection quality on a specific channel. Values of 1-3 indicate partial detection — not all content will be found, and you should consider increasing watermark embedding strength. Values of 6-7 indicate good detection. Values of 8-10 indicate optimal quality. QI 9-10 may indicate that watermark strength could even be reduced.

QI is not a measure of watermark embedding quality — it only becomes meaningful after content airs and detections accumulate. QI is also content-dependent: content with lots of movement and detail allows stronger watermarks and better detection.

### The SDI Embedder Input Detector

The hardware SDI Embedder has a built-in detector that monitors the input signal for existing watermarks (prior watermarks). When a prior watermark is detected, the embedder pauses embedding. The detector tab shows detected EIDs and timestamps in real time, with a processing delay of up to 15 seconds.

Delay times before prior watermarks are detected:
- SDI embedders and baseband SDK products (Rhozet, Amberfin, Digital Rapids, Telestream): 4 seconds
- TriMedia SD Embedders: 7 seconds
- After watermarked content ends: 6 seconds before the embedder resumes

### Single Result vs All Results (Fingerprinting)

For fingerprinting, Teletrax offers two detection reporting options:

**Single result:** Teletrax picks the best match from all fingerprint results. Useful when you have compilations — if you've registered both individual clips and a compilation, Teletrax will identify whichever matches best (typically the compilation). Recommended for most use cases.

**All results:** All matches are returned. If multiple assets match the broadcast content, all are reported. This produces a large volume of data requiring client-side analysis. Teletrax advises against this option for most clients.

---

## 7. The Data Model

### How the Objects Relate

```
Market
  └── Channel (belongs to one Market)

Asset
  └── Encodation (one or more per Asset)
        └── videoWatermark details  (if watermarked)
        └── videoFingerprint details  (if fingerprinted, includes CECO)

Asset.metadata (custom key-value pairs)
Channel.metadata (custom key-value pairs)

Field (defines what metadata keys exist and their types, for Asset, Hit, or Channel)

Report (read-only, configured in portal, retrieved via API)
  └── Rows (each row represents a detection with dimensions and metrics)

Modification (flags which days have changed data)
```

### Asset

The Asset is the primary unit. It represents a piece of content being tracked. Key fields:

| Field | Type | Description |
|---|---|---|
| resourceID | ResourceID | Unique identifier (e.g. `AE12345-2012-05-00037`) |
| enabled | Boolean | Whether Teletrax is currently tracking this asset |
| permalink | URL | Read-only view of the asset in the portal |
| lastChangedDateTimeUtc | DateTime | When the asset was last modified |
| metadata | Object | Key-value pairs of custom metadata |
| metadataResourceIds | Object | Maps metadata field names to their Resource IDs |
| encodations | Array | The encodations associated with this asset |

### Encodation

An encodation records one watermarking or fingerprinting event. Key fields:

| Field | Type | Description |
|---|---|---|
| resourceID | ResourceID | Unique identifier (e.g. `AE12345-2012-05-00037-001`) |
| lengthSeconds | Integer | Duration of the encodation |
| processStartDateTimeUtc | DateTime | When the encodation was processed |
| videoFingerprint | Object | Present if fingerprinted: fingerprintID, status, CECO |
| videoWatermark | Object | Present if watermarked: EmbeddingStart, EmbeddingStop, EID, globalDepth, embeddedEnergy, priorWatermarkPercentageDetected |

The `status` field of a fingerprint encodation progresses through: Unknown → Ingesting → Active (or Failed/Inactive).

The `embeddedEnergy` field is important for watermarked encodations: a value of approximately 1.0 or higher is considered good embedding strength.

### Channel

| Field | Type | Description |
|---|---|---|
| resourceID | ResourceID | e.g. `CH00002` |
| name | String | Teletrax name (e.g. "Channel 4") |
| market | Market | The market this channel is part of |
| tzUtcOffsetHours | Number | Timezone offset from UTC |
| tzName | String | TZDB timezone name (e.g. "America/New_York") |
| channelFeedType | Number | 0=Unknown, 1=Unique feed, 2=Additional feed delayed 3 hours |

### Market

| Field | Type | Description |
|---|---|---|
| resourceID | ResourceID | e.g. `MK00115` |
| region | String | e.g. "USA", "GBR" |
| continent | String | e.g. "NA", "EU" |
| dma | Object | US only: DMA code and rank |

### Field (Metadata Field Definition)

Fields define what metadata can be attached to assets, hits, or channels. Supported field types by entity:

| Entity | Numeric | Integer | Text | Video | List | Market | Boolean |
|---|---|---|---|---|---|---|---|
| Hit | Yes | Yes | Yes | No | No | No | Yes |
| Asset | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Channel | Yes | Yes | Yes | No | Yes | No | No |

Fields of type `List` have Options (predefined values to choose from) and can have Rules (logic to auto-populate the field value based on other metadata).

---

## 8. Reports: What They Show and How to Read Them

### What a Report Is

Reports are configured in the Teletrax portal (under the Detections tab) and are read-only once configured. Each report has a Resource ID visible in the portal URL bar. The API retrieves the data from a pre-configured report — you cannot create arbitrary queries via the API; you must configure the report in the portal first.

Reports are cached for at least 5 minutes per API call.

### Report Data Structure

A report response contains:

| Field | Description |
|---|---|
| resourceID | The report's ID |
| executionDateTimeUtc | When this report was last run |
| total | Total rows available |
| start | Pagination offset |
| count | Rows returned in this response |
| rows | Array of row objects |
| metricTotals | Totals for metric columns (if "Show Totals" is enabled) |

Each row contains dimensions (things that describe the detection: channel name, market, asset metadata, detection time) and dataSets containing metrics (counts, durations, GRP values).

### Key Dimensions (v3 API names)

| Portal Name | API JSON Field |
|---|---|
| Hit: UTC detection start | `hitUtcDetectionStart` |
| Hit: Local detection start | `hitLocalDetectionStart` |
| Hit: Detection duration | `hitDetectionDuration` |
| Hit: Actual detection length | `hitActualDetectionLength` |
| Hit: EPG Program name | `hitEpgProgramName` |
| Channel: Name | `channelName` |
| Channel: ResourceID | `channelResourceid` |
| Channel: Region name | `channelRegionName` |
| Market: Name | `marketName` |
| Market: DMA Ranking | `marketDmaRanking` |
| Asset: ResourceID | `assetResourceid` |
| Asset: Length | `assetLength` |
| Asset: Activation date start (UTC) | `assetActivationDateStartUtc` |

Custom metadata fields appear as: `metadataAsset` (for asset-level metadata fields), or directly by the metadata field name.

In the v2 API (deprecated), custom metadata fields were prefixed with `assetMetadata` and camelCased: e.g. field `slug` became `assetMetadataSlug`.

### Key Metrics

| Portal Name | API JSON Field | Meaning |
|---|---|---|
| # Hits | `numberOfHits` | Number of times content was detected |
| # Channels | `numberOfChannels` | Number of distinct channels |
| # Markets | `numberOfMarkets` | Number of distinct markets |
| Total actual detection length | `totalActualDetectionLength` | Sum of continuous detection time |
| Total detection duration | `totalDetectionDuration` | Sum of detection time with gaps filled in |
| Weighted GRP | `weightedGrp` | Nielsen-based audience metric |

### Detection Duration vs Actual Detection Length

This distinction matters. **Actual detection length** is the time content was continuously detected without interruption. **Detection duration** (sometimes called "virtual detection") is the total time with gaps filled in. For example, if a 30-minute news programme airs your clip twice with a commercial break between them, the actual detection might be two separate 2-minute periods, but the detection duration (virtual) would fill the gap between them, producing a larger number. The ratio between actual and virtual is available as `hitActualVirtualRatio`.

### CSV Report Format

CSV exports contain a header block (optional) followed by column headers and data rows. Example:

```
Report date: 2013-04-29 11:28:25 (UTC)
Starting (Detection date UTC): 2013-04-28 00:00:00
Ending (Detection date UTC): 2013-04-29 00:00:00
Slug,Item ID,Market: Name,Channel: Name,Channel: ResourceID,EPG Program name,Detection duration,UTC detection start,Local detection start,Activation date start (UTC),# Hits
bar,foo,Spain,Canal 24 Horas,CH00435,Telediario Internacional,00:00:09,2013-04-28 00:00:25,2013-04-28 02:00:25,2012-10-03 11:58:26,1
```

Column headers always appear. The CSV separator is configurable (comma, pipe, tab, or any single character). Date format is `yyyy-mm-dd hh:mm:ss`. There is no timezone indicator embedded in date values — you must read the column header name to know if a value is UTC or local time.

### XLSX Report Format

XLSX exports have two tabs: Tab 1 is the report results; Tab 2 is metadata about the report run (when it was executed, the date range, etc.). Date/time columns are formatted as `yyyy-mm-dd` for data mining purposes.

### XML Report Format

The XML format follows this structure:

```xml
<report version="2.0">
  <rows>
    <row>
      <detection_start_date_time_utc>2012-08-16 10:53:41</detection_start_date_time_utc>
      <channel_name>KSL</channel_name>
      <market_name>Salt Lake City</market_name>
      <channel_resource_id>CH00326</channel_resource_id>
      <dataset name="A">
        <metric name="numberOfHits">1</metric>
      </dataset>
      <field name="item_id">foo</field>
      <field name="slug">bar</field>
    </row>
  </rows>
  <resource_id>RE16549-00008</resource_id>
  <total>1</total>
</report>
```

### Time Zones in Reports

This is an area of frequent confusion. The report period picker can operate in:

- **Relative mode:** "Today" or "Last week" relative to a selected timezone. Two users in different timezones selecting "today" in the same timezone will see identical results.
- **Fixed mode:** A specific date range, interpreted in the selected timezone.

Available timezone presets include Local (channel's own timezone), Hawaii, Pacific, Central, Eastern, UTC, Britain, Central Europe, and Eastern Europe.

**The "Local" timezone option** is particularly powerful for news agencies: selecting Local means Teletrax reports hits in each channel's own local time. A detection at 6:00 AM London time on BBC and 6:00 AM New York time on CNN will both show as "6:00 AM local" even though those are different UTC moments.

US national channels are reported in Eastern Time by convention.

### The Portal's Row Limit

The portal limits visible rows to 2,000. For larger datasets, use the Export button (produces Excel) or the API with pagination (`limit` and `skip` parameters).

---

## 9. Limitations and Gotchas

### Detection Delay

Detection data is typically available 30 to 60 minutes after airing. It is not real-time. Do not expect to see a detection immediately after broadcast.

### Data Is Dynamic and Can Change

This is one of the most important things to understand about Teletrax. Detection data for past days can change. Reasons include:

- **Retrotracking:** A new asset is registered and Teletrax retroactively finds matches in past broadcasts
- **Channel clearances:** A channel becomes cleared (or un-cleared) for your data, adding or removing detections
- **Hit modification:** Existing detections are merged, split, or updated as more information arrives
- **Asset metadata changes:** If you update asset metadata, all historical detections for that asset may update in reports
- **Outages:** A monitoring outage is registered or corrected for a past period

This means if you are building a data warehouse integration, you cannot simply append new data daily. You must use the **Modifications API** to identify which past days have changed, then re-fetch and overwrite those days' data. The recommended approach is to treat each day as a replaceable unit: when a modification appears for a day, wipe your data for that day and reload it fresh.

### Watermarks Cannot Be Stacked

If you watermark content that is already watermarked, serious problems occur. The Teletrax system detects prior watermarks and pauses embedding, but there is a detection delay:

- 4 seconds delay before a prior watermark is detected (SDI/baseband embedders)
- 7 seconds delay (TriMedia SD embedders)
- 6 seconds after watermarked content ends before embedding resumes

During these windows, a new watermark is applied over the old one. The result:

- If the two watermarked videos have **different aspect ratios:** the detector may find either watermark unpredictably
- If the two watermarked videos have **the same aspect ratio:** most likely, **neither** watermark is detected. Occasionally one is detected. Very rarely, a random mixed payload is detected (fraction of a percent).

**Practical implication for Reuters/TV producers:** If you receive content that has already been watermarked by another party and then re-watermark it before retransmission, you risk losing detectability for both parties. Always check incoming content for prior watermarks using the QC Detector tool.

### Fingerprint Rejection Rules

Fingerprints will be rejected by Teletrax if:
- Content is shorter than 5 seconds
- Content modifications exceed the configured threshold (e.g. a scene insertion/removal greater than 1 minute difference)

The modification threshold is not self-configurable — contact Client Services to adjust it. Content with reordered scenes or compilations is generally allowed if within threshold.

### Video File Restrictions for Fingerprinting

- Maximum file size: 2GB
- Maximum duration: 8 hours
- Minimum frame rate: 24fps
- Content must have significant movement throughout
- MOV files with Apple ProRes codec are NOT supported
- CDXA/MPEG-PS is NOT supported

### YouTube Geo-Blocking

If submitting YouTube URLs for fingerprinting, the video must not be geo-blocked for the US. Teletrax downloads YouTube content from US-based servers. If the video is US geo-blocked, the fingerprint cannot be generated.

### FTP Upload Location Matters

Video files and CECO files must be uploaded to the **root directory** of the FTP server, not to any existing subfolder (Archive, Processing, or Error). If you upload to a subfolder, the fingerprint asset will not be generated. The root directory appears empty at login; the processing folders are created and maintained automatically.

### QI Thresholds and Misinterpretation

QI values are easy to misinterpret without context. A QI of 3 may be completely normal for content with low visual complexity or a channel with heavy signal processing. Always work with your Teletrax representative when evaluating QI values. Do not unilaterally adjust watermark strength based on QI readings.

### Report Caching

API report results are cached for at least 5 minutes. If you make rapid successive API calls, you will receive cached results. For near-real-time data tracking, the modifications API is more appropriate than polling the report API rapidly.

### Channel API Scope

The Channel API only returns channels that have been cleared for your account — not all channels Teletrax monitors globally. The number of channels available to you depends on your contract.

### Asset Must Have at Least One Encodation

You cannot delete the last encodation of an asset. An asset must always retain at least one encodation. If you want to remove an asset entirely, delete the asset itself.

---

## 10. Glossary

An alphabetical reference of all significant terms.

**Activation Date Start/Stop** — The period during which an asset is actively being tracked by Teletrax. Detection data is only generated within this window.

**Amberfin Plugin** — A software plugin for the Amberfin iCR transcoder that enables Teletrax watermark embedding during transcoding.

**Asset** — The central object in Teletrax representing a piece of content being tracked. Contains metadata and one or more encodations.

**Broadcast Month** — A broadcast industry calendar unit used in TV scheduling and ratings measurement.

**CECO File** — A binary file (extension `.ceco` or `.ce`) containing a video fingerprint generated by `fptool`. Uploaded to Teletrax to register a fingerprint asset.

**Channel** — A specific television broadcast channel monitored by Teletrax. Has a Resource ID, name, market, and timezone.

**Channel Clearance** — The administrative process by which a channel is made visible and reportable to a specific client. A modification of type `ChannelClearance` indicates this has changed for a given day.

**channelFeedType** — A field on US national channels indicating feed type: 0=Unknown, 1=Unique feed, 2=Additional feed delayed by 3 hours.

**Configuration File** — A file supplied by Civolution to the client's embedder, containing all watermark settings including EID. Cannot be altered by the client.

**CECO** — See "CECO File."

**Civolution** — The technology company that developed and operates the Teletrax monitoring network. Teletrax is Civolution's brand name for broadcast monitoring.

**clientkey** — A field in the encodation XML format that allows clients to provide their own unique identifier for an encodation, enabling later updates to that encodation by re-submitting a file with the same key.

**Custom Metadata** — User-defined data fields that clients can configure to attach additional information to assets, hits, or channels. Defined on the Metadata page in the portal.

**Data Warehouse Sync** — The recommended approach for integrating Teletrax data into external systems: treat each day as a replaceable unit, use the Modifications API to identify changed days, and re-fetch + overwrite changed days' data.

**Detection** — A confirmed occurrence of tracked content on a broadcast channel. Also called a "hit."

**Detection Duration** — Also called "virtual detection." The total monitored time span of a detection, with gaps (e.g. commercial breaks) filled in.

**DMA (Designated Market Area)** — A Nielsen geographic market classification used in the US. Teletrax markets in the US correspond to DMA areas, each with a numeric code and rank.

**EID (Embedder ID)** — A unique integer identifier assigned by Civolution to a specific Teletrax embedder. Used as part of the watermark payload to identify content ownership.

**Embedded Energy** — A metric in the encodation record indicating the average strength of the watermark inserted into the video. A value of approximately 1.0 or higher is considered good.

**embeddedEnergy** — See "Embedded Energy."

**Embedding Strength** — How strongly the watermark is embedded in the video. Higher strength improves detection reliability (QI) but may slightly affect video quality. Adjustable only with Civolution's assistance.

**Encodation** — The record of a specific watermarking or fingerprinting event. Links technical watermark/fingerprint data to an asset.

**Encodation Log** — The file produced by a Teletrax embedder after watermarking, recording all technical and metadata details of the embedding session.

**EPG (Electronic Programme Guide)** — The TV schedule data. Teletrax uses EPG to record which programme was airing on a channel at the time a detection occurred.

**Expected Hit** — A pre-declared expectation of when content will air on a specific channel, submitted via CSV. Used for delivery compliance tracking.

**Field** — A metadata field definition in Teletrax. Defines what custom data can be attached to assets, hits, or channels.

**Fingerprint** — A mathematical representation of a video's visual content, used for identification without modifying the original video. See also "CECO File."

**flatRegion** — An embedding parameter in the watermark encodation record, relevant to the old watermarking algorithm.

**fptool** — The Teletrax command-line tool for generating CECO fingerprint files from video files. Available for Windows and Linux.

**Generic Hit** — A raw detection produced by the monitoring network before roll-up processing. Not directly visible in the portal.

**globalDepth** — A watermark embedding parameter recorded in the encodation. Part of the embedding settings that affect watermark strength.

**GRP (Gross Rating Points)** — An advertising metric. Weighted GRP in Teletrax reports is based on Nielsen audience data in 15-minute increments.

**Hardware HD-SDI Embedder** — A hardware device (e.g. the iGolgi W1000) that embeds Teletrax watermarks into live SDI video signals.

**Hit** — See "Detection."

**Hit Modification** — A change to an existing detection record. Because detection data is dynamic (merging, splitting, retrotracking), hits can change after initial reporting.

**iGolgi W1000** — A specific hardware SDI embedder model supported by Teletrax.

**Item ID (itemid)** — A standard metadata field for identifying an asset. Used as a key for searching and updating assets via the API.

**JSV Format** — A query format used in some Teletrax API parameters (e.g. `{itemid:a, slug:b}`). Based on ServiceStack's JSV format.

**Market** — A geographic region where broadcast channels operate. Outside the US, typically a country. Inside the US, a Nielsen DMA.

**maxLocalDepth** — A watermark embedding parameter in the encodation record, relevant to the old watermarking algorithm.

**Metadata** — Custom key-value data attached to assets, hits, or channels to describe content. Fields include itemid, slug, description, and any client-defined fields.

**Modification** — An API resource that flags which past days have had their data changed, and provides a hint about why. Used for data warehouse synchronisation.

**Modification Hints** — The reason a day was flagged as modified: `HitChanged`, `AssetMetadataChanged`, `ChannelMetadataChanged`, `ChannelClearance`, `AudienceUpdate`, `AssetDeleted`, `OutageChange`.

**NTP (Network Time Protocol)** — A time synchronisation protocol. Teletrax embedders must have their system clocks synchronised via NTP, because the watermark payload includes a timestamp.

**Outage** — A registered period when Teletrax monitoring was not active for a channel. Affects detection data for that period.

**Permalink** — A stable URL providing a read-only view of an asset in the Teletrax portal.

**Period Offset** — A time offset applied to report periods to support "broadcast day" reporting (e.g. starting the day at 6:00 AM rather than midnight).

**Portal** — The Teletrax web interface at `www.teletrax.com`. Used for viewing detections, managing assets, configuring reports, and setting preferences.

**Prior Watermark** — A watermark already present in content being processed for new watermark embedding. When detected, the embedder pauses to avoid stacking watermarks.

**priorWatermarkPercentageDetected** — A field in watermark encodation records indicating what percentage of the content was already watermarked when the new embedding occurred.

**QC Detector** — A Teletrax desktop application for quality-checking whether a video has been correctly watermarked. Shows a timeline with green (your watermark), yellow (another client's watermark), or red (no watermark) colour coding.

**QI (Quality Indicator)** — A score from 1 to 10 indicating how reliably a watermark signal is detected on a broadcast channel. Only meaningful after content has aired.

**Receipt** — A processing confirmation file written by Teletrax after processing an uploaded file. Format is JSON (`{"state": "success"}` or `{"state": "error", "errorMessage": [...]}`). Must be deleted by the client to acknowledge receipt; auto-deleted after 48 hours if not acknowledged.

**Report** — A configured query in the Teletrax portal that retrieves detection data. Reports are configured in the portal and retrieved as read-only data via the API.

**Resource ID** — A unique string identifier for any resource within Teletrax (asset, encodation, channel, market, report, field, modification). Treat as opaque — make no assumptions about format.

**Retrotracking** — Teletrax's ability to retroactively match detections against newly registered assets for past broadcast periods.

**Rhozet** — A transcoding application (Rhozet Carbon Coder) that supports Teletrax watermark embedding via a plugin.

**Roll-up** — The process of aggregating raw generic hits into reportable hits using configurable grouping rules.

**SDI (Serial Digital Interface)** — The professional broadcast video interface standard. Teletrax hardware embedders operate on SDI signals.

**Slug** — A standard metadata field for describing an asset (e.g. episode title or short description). Analogous to a URL slug.

**Status (Encodation)** — The processing state of a fingerprint encodation: Unknown, Ingesting, Active, Failed, or Inactive.

**Teletrax** — The global broadcast monitoring service operated by Civolution. Uses watermarking and fingerprinting to detect content airings on TV worldwide.

**tzName** — The TZDB canonical timezone name for a channel (e.g. "America/New_York").

**tzUtcOffsetHours** — A channel's timezone offset from UTC in hours. Can be fractional.

**Unmatched Detection** — A detection where the watermark was found but no registered metadata (encodation) has been matched to it yet. Roll-up rules for unmatched detections are typically stricter.

**Video Context / Verification Video** — An optional Teletrax feature providing a short video clip (1 minute before and after a detection) for visual verification that the detected content is correct.

**Virtual Detection** — See "Detection Duration."

**Watermark** — An invisible signal embedded in video pixel data that carries an identification payload (EID + timestamp). Survives compression and signal degradation.

**Watermark Payload** — The data embedded in a video watermark: EID + UTC time/date code. Uniquely identifies each second of watermarked content.

**Weighted GRP** — Gross Rating Points weighted by Nielsen audience data in 15-minute increments. An advertising measurement metric available in Teletrax reports.

**Workflow API** — The Teletrax API endpoint (`/api/v1/workflow/files`) that allows clients to inspect file processing status and upload files programmatically instead of via FTP.