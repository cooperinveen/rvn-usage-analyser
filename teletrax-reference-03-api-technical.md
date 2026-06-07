# Teletrax API & Technical Reference

---

## 1. API Overview

### Base URL

All requests to the Teletrax REST API use the following root URL:

```
https://api.teletrax.com/api/v1/
```

The Image Watermark API uses a separate base URL:

```
https://watermark.kinetiq.tv
```

### Philosophy

The Teletrax REST API allows programmatic retrieval and update of information about content, and enables receiving events whenever content changes. Because the API is based on open standards, any web development language can be used to access it.

- Request and response format: **JSON**
- All dates: **ISO 8601 format**
- HTTP methods used: GET, POST, DELETE (and PUT)

### API Versioning

The API is versioned as `v1` in the base URL path. Report resources use versioned response payloads (`"version": "3.0"` in v3 report responses).

---

## 2. Authentication

### Obtaining an API Key

An API key must be requested from your Teletrax client services representative. Example API key format:

```
21EC2020-3AEA-1069-A2DD-08002B30309D
```

### Authentication Method

The API uses **HTTP Basic Authentication over HTTPS**. The username is the email address used to log in to Teletrax, and the password is the API key.

HTTPS is required. HTTP connections will not work.

### Credentials Format

```
username: your.name@acme.com
password: 2abf22a3-42e3-71a8-353f-beef532a3145
```

---

## 3. Making Requests

### HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Retrieve resources |
| POST | Create or update resources |
| DELETE | Delete resources |

### Required Headers

For all POST requests:

```
Content-Type: application/json
```

For file upload (Workflow API):

```
Content-Type: multipart/form-data
```

### curl Examples

```bash
# Show API version
curl --user your.name@acme.com:2abf22a3-42e3-71a8-353f-beef532a3145 \
  https://api.teletrax.com/api/v1/version

# Include response headers
curl --user your.name@acme.com:2abf22a3-42e3-71a8-353f-beef532a3145 \
  https://api.teletrax.com/api/v1/version -i

# Query with JSON content type
curl -H "Content-Type: application/json" \
  --user your.name@acme.com:2abf22a3-42e3-71a8-353f-beef532a3145 \
  "https://api.teletrax.com/api/v1/assets?query='{itemid:uniqueid}'"
```

### HTTP Status Codes

- `200 OK` — Normal successful operation
- `202 Accepted` — Asynchronous request accepted (e.g. fingerprint creation from URL)
- `404 Not Found` — Resource does not exist

---

## 4. Resource Types

### 4.1 Asset

An asset represents a piece of content being tracked by Teletrax (a watermarking or fingerprinting event plus metadata).

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the asset |
| enabled | Boolean | Whether this asset is currently being tracked [editable via POST] |
| permalink | URL | Link to an HTML read-only view of the asset |
| lastChangedDateTimeUtc | DateTime | UTC date/time when the asset was last modified |
| metadata | Array of Metadata | The metadata associated with the asset [editable via POST] |
| metadataResourceIds | Array of MetadataResourceIds | Mapping between field name of an option and the resource ID of the metadata field option |
| encodations | Array of Encodations | The encodations associated with the asset [editable via POST] |

**Example:**

```json
{
  "resourceID": "AE12345-2012-05-00037",
  "enabled": true,
  "permalink": "http://www.teletrax.com/r/a4f83z94659365h",
  "lastChangedDateTimeUtc": "2014-07-28T16:06:12",
  "metadata": {
    "itemid": "My Show",
    "slug": "My Show episode 3.14",
    "brand": "Ashley Furniture HomeStore",
    "product": "Ashley Furniture HomeStore",
    "category": "Retail"
  },
  "metadataResourceIds": {
    "brand": "MF16546-001-O02318",
    "product": "MF16546-002-O00067",
    "category": "MF16546-003-O00055"
  },
  "encodations": [{
    "resourceID": "AE12345-2012-05-00037-001",
    "lengthSeconds": 1320,
    "videoFingerprint": {
      "fingerprintID": "81e2b8b8-246e-46d0-bdfe-75ed650310f4",
      "status": "active",
      "ceco": "base-64 encoded complete CECO"
    }
  }]
}
```

---

### 4.2 Channel

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the channel |
| name | String | The Teletrax name of the channel |
| market | Market | The market which the channel is part of |
| metadata | Array of Metadata | The metadata associated with the channel |
| tzUtcOffsetHours | Number | The channel's timezone base offset in hours from UTC (can be fractional) |
| tzName | String | The channel's canonical TZDB timezone name (e.g. "America/New_York") |
| channelFeedType | Number | US national channels feed type: 0=Unknown, 1=Unique feed, 2=Additional feed delayed by 3 hours |

**Example:**

```json
{
  "resourceID": "CH00002",
  "name": "Channel 4",
  "market": {
    "resourceId": "MK00030",
    "region": "GBR",
    "continent": "EU"
  },
  "metadata": {
    "priority": 5
  },
  "tzUtcOffsetHours": 0,
  "tzName": "Etc/GMT",
  "channelFeedType": 1
}
```

---

### 4.3 Encodation

An encodation describes a specific watermarking or fingerprinting event associated with an asset.

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the encodation |
| lengthSeconds | Integer | Duration of the encodation in seconds |
| processStartDateTimeUtc | DateTime | When the encodation was processed |
| videoFingerprint | VFP details | Present when created through video fingerprinting |
| videoWatermark | VWM details | Present when created through video watermarking |

**Video Fingerprinting Sub-fields:**

| Key | Type | Description |
|-----|------|-------------|
| fingerprintID | Guid | Unique GUID describing the fingerprint |
| status | String | Ingestion status: Unknown / Ingesting / Inactive / Active / Failed |
| ceco | String | Base64-encoded representation of the CECO |

**Video Watermarking Sub-fields:**

| Key | Type | Description |
|-----|------|-------------|
| embeddingStart | DateTime | Timestamp when embedding began |
| embeddingStop | DateTime | Timestamp when embedding finished |
| eid | Integer | The embedding ID |
| globalDepth | Double | Embedding setting used during watermark insertion |
| maxLocalDepth | Integer | Embedding setting used during watermark insertion |
| flatRegion | Integer | Embedding setting used during watermark insertion |
| embeddedEnergy | Double | Amount of watermark energy inserted (~1.0 or higher is good) |
| priorWatermarkPercentageDetected | Double | Percentage of video already watermarked |

**Example (fingerprint encodation):**

```json
{
  "resourceID": "AE12345-2012-05-00037-001",
  "lengthSeconds": 1320,
  "videoFingerprint": {
    "fingerprintID": "81e2b8b8-246e-46d0-bdfe-75ed650310f4",
    "status": "active",
    "ceco": "Q0VDTwIAAAMBAA [partly omitted] Tk5XMCX7cjMw+7BXMfuwzw="
  }
}
```

---

### 4.4 Field

A field describes a custom metadata field definition.

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the field |
| type | String | Type of field |
| fieldName | String | The field name as used in the API |
| displayName | String | The field name as shown on the portal |
| description | String | Description of the field |
| defaultValue | String | Default value for this field |
| required | Boolean | Whether the value is required |
| rules | Array of Rules | Calculated value rules (only for entity 'Asset'; only when retrieving a specific field) |
| options | Array of Options | Available options (only for type 'List'; only when retrieving a specific field) |
| includeInEmbedderConfiguration | Boolean | Whether this metadata field is included in embedder configuration (only for entity 'Asset') |

**Supported field types per entity:**

| Entity | Numeric | Integer | Text | Video | List | Market | Boolean |
|--------|---------|---------|------|-------|------|--------|---------|
| Hit | Yes | Yes | Yes | No | No | No | Yes |
| Asset | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Channel | Yes | Yes | Yes | No | Yes | No | No |

**Option sub-object:**

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the option |
| displayName | String | The value of the option |

**Rule sub-object:**

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the rule |
| name | String | The value when the filters match the rule |
| filters | Array of Rule filters | The filters to match the object to |

**Rule filter sub-object:**

| Key | Type | Description |
|-----|------|-------------|
| values | Array of strings | The separate components of the filter |

**Example:**

```json
{
  "resourceID": "MF12345-001",
  "type": "Text",
  "fieldName": "slug",
  "displayName": "Slug",
  "description": "Slug of the asset",
  "defaultValue": null,
  "required": false
}
```

---

### 4.5 File

Describes a file imported via the workflow/FTP system.

| Key | Type | Description |
|-----|------|-------------|
| filename | String | The filename |
| type | String | File type: "ceco", "encodation", "grp", "expectedHits", "video" |
| state | String | Processing state: "found", "success", "failed" |
| found | DateTime | When the file was first found |
| completed | DateTime | When the file completed processing |
| errorText | String | Failure description if state is "failed" |

---

### 4.6 Market

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the market |
| region | String | The region of the market |
| continent | String | The continent of the market |
| dma | Dma | The Nielsen Designated Market Area |

**DMA sub-object:**

| Key | Type | Description |
|-----|------|-------------|
| code | Short | Market code |
| rank | Short | Market rank |

**Example:**

```json
{
  "resourceId": "MK00115",
  "region": "USA",
  "continent": "NA",
  "dma": {
    "code": 765,
    "rank": 91
  }
}
```

---

### 4.7 Metadata Fields

Metadata is a key-value object. Each key is the field name configured in the Teletrax portal. Values are strings.

```json
{
  "itemid": "My Show",
  "slug": "My Show episode 3.14",
  "description": "Bob finds out that Annie has been lying to him about the giant sandwich",
  "title": "Head in the Sandwich"
}
```

---

### 4.8 Modification

| Key | Type | Description |
|-----|------|-------------|
| day | Date | The day a modification happened |
| hint | String | Hint indicating which modification caused the day to be flagged |

**Example:**

```json
{
  "day": "2014-07-28",
  "hint": "AssetMetadataChanged"
}
```

---

### 4.9 Report

Reports are read-only and configured on www.teletrax.com. The report ID can be found in the address bar of the portal.

| Key | Type | Description |
|-----|------|-------------|
| resourceID | ResourceID | The Resource ID of the report |
| executionDateTime | DateTime | When the report finished executing and was made available via cache |
| total | int | Total number of rows in the complete dataset |
| begin | int | Zero-based index where the result set starts |
| count | int | Total number of returned rows in this response |
| rows | Array of rows | Array of key/value objects dependent on report configuration |

The structure of `rows` depends on the report configuration. It is a machine-readable representation of the configured portal report.

---

### 4.10 Resource ID

A Resource ID is a string uniquely identifying a resource within Teletrax.

Example: `AE12345-2012-05-00037`

No assumptions should be made about the content of a Resource ID beyond its use as an identifier.

---

## 5. The Report API

### Retrieving a Report

```
GET https://api.teletrax.com/api/v1/reports/{report id}/data
```

**Request Parameters:**

| Key | Type | Description |
|-----|------|-------------|
| startDate (optional) | Date | Return hits starting on or after this date |
| stopDate (optional) | Date | Return hits starting before this date |
| startTime (optional) | Time | Start of daily time period |
| stopTime (optional) | Time | End of daily time period (hits up to but not including) |
| limit (optional) | Integer | Number of items to return (default 2000) |
| skip (optional) | Integer | Number of items to skip (pagination offset) |

**Important note on time periods:** The time parameters work the same way as on the web portal — the time indicates a duration applied to every day in the date range. This allows requesting data during a specific daily window (e.g. prime time). If no dates/times are provided, the date and time periods configured in the portal are used.

**Caching:** Results are cached for at least 5 minutes.

**Response:**

```json
{
  "report": { ... }
}
```

---

### Pagination

The Report resource uses the following pagination fields:

| Field | Description |
|-------|-------------|
| total | Total number of rows in the complete dataset |
| start / begin | Zero-based index of the first returned row |
| count | Number of rows returned in this response |
| limit (request param) | Maximum rows to return |
| skip (request param) | Number of rows to skip |

**Example paginated request:**

```
GET https://api.teletrax.com/api/v1/reports/RE00020-00033/data?skip=1000&limit=2
```

---

### Report v3 Example (Current)

**Simple response:**

```json
{
  "rows": [
    {
      "hitUtcDetectionStart": "2013-09-04T05:08:00.0000000Z",
      "hitLocalDetectionStart": "2013-09-04T09:08:00.0000000",
      "hitDetectionDuration": "00:40:00",
      "assetResourceid": "AE00020-2013-36-00001",
      "note": "Note Asset A",
      "dataSets": []
    },
    {
      "hitUtcDetectionStart": "2013-09-04T05:08:00.0000000Z",
      "hitLocalDetectionStart": "2013-09-04T13:08:00.0000000",
      "hitDetectionDuration": "00:40:00",
      "assetResourceid": "AE00020-2013-36-00001",
      "note": "Note Asset A",
      "dataSets": []
    }
  ],
  "resourceID": "RE00020-00033",
  "reportTitle": "My report",
  "executionDateTimeUtc": "2013-09-05T19:12:51Z",
  "queryDuration": "00:00:05.7680964",
  "total": 12,
  "metricTotals": [],
  "start": 0,
  "count": 2,
  "version": "3.0"
}
```

Use `"version": "3.0"` in the response to confirm you are working with the v3 API.

**Response with metrics and totals:**

```json
{
  "rows": [
    {
      "slug": "Slug Asset A",
      "assetLength": "00:55:01",
      "dataSets": [
        {
          "name": "Default",
          "metrics": {
            "numberOfHits": { "value": 8 },
            "numberOfMarkets": { "value": 1 }
          }
        }
      ]
    }
  ],
  "resourceID": "RE00020-00033",
  "executionDateTimeUtc": "2013-09-05T20:17:47Z",
  "total": 2,
  "metricTotals": [
    {
      "dataSets": [
        {
          "name": "Default",
          "metrics": {
            "numberOfHits": { "value": 12 },
            "numberOfMarkets": { "value": 1 }
          }
        }
      ]
    }
  ],
  "start": 0,
  "count": 2,
  "version": "3.0"
}
```

---

### Report v3 Dimension Field Names (Report Config Name → JSON Name)

| Report Configuration Name | JSON Field Name |
|---------------------------|-----------------|
| Asset: Description | assetDescription |
| Asset: Length | assetLength |
| Asset: Second | assetSecond |
| Asset: State | assetState |
| Asset: Activation date start (UTC) | assetActivationDateStartUtc |
| Asset: Activation date stop (UTC) | assetActivationDateStopUtc |
| Billing: Start | billingStart |
| Billing: Stop | billingStop |
| Channel: Affiliation | channelAffiliation |
| Channel: Name | channelName |
| Asset: Content keyword | assetContentKeyword |
| Hit: Actual detection length | hitActualDetectionLength |
| Hit: Detection duration | hitDetectionDuration |
| Hit: Actual/Virtual ratio | hitActualVirtualRatio |
| Hit: Local detection start | hitLocalDetectionStart |
| Hit: Local detection stop | hitLocalDetectionStop |
| Hit: UTC detection start | hitUtcDetectionStart |
| Hit: UTC detection stop | hitUtcDetectionStop |
| Hit: Activation date start (UTC) | hitActivationDateStartUtc |
| Hit: Activation date stop (UTC) | hitActivationDateStopUtc |
| Asset: Encodation facility | assetEncodationFacility |
| Encodation: Activation date start (UTC) | encodationActivationDateStartUtc |
| Encodation: Activation date stop (UTC) | encodationActivationDateStopUtc |
| Encodation: EID | encodationEid |
| Expected hit: Airdate (UTC) | expectedHitAirdateUtc |
| Expected hit: Modification date (UTC) | expectedHitModificationDateUtc |
| Expected hit: Status | expectedHitStatus |
| Market: Name | marketName |
| Market: DMA Ranking | marketDmaRanking |
| Market: State | marketState |
| Asset: Category | assetCategory |
| Metadata: Asset | metadataAsset |
| Metadata: Field state | metadataFieldState |
| Period: Broadcast month | periodBroadcastMonth |
| Period: Broadcast year | periodBroadcastYear |
| Period: Day | periodDay |
| Period: Hour | periodHour |
| Period: Month | periodMonth |
| Period: Year | periodYear |
| Hit: EPG Program name | hitEpgProgramName |
| Channel: Region name | channelRegionName |
| Period: Day of week | periodDayOfWeek |
| Interval: Second | intervalSecond |
| Hit: EID | hitEid |
| Asset: EID | assetEid |
| Channel: Channel keyword | channelChannelKeyword |
| Asset: Permalink | assetPermalink |
| Asset: ResourceID | assetResourceid |
| Channel: Teletrax Name | channelTeletraxName |
| Channel: ResourceID | channelResourceid |
| Metadata: Hit | metadataHit |
| Hit: Asset age (days) | hitAssetAgeDays |
| Outage: Start date UTC | outageStartDateUtc |
| Outage: Stop date UTC | outageStopDateUtc |
| Outage: Modification date UTC | outageModificationDateUtc |
| Outage: Reason | outageReason |
| Outage: Status | outageStatus |
| Outage: Type | outageType |
| Outage: Local start date | outageLocalStartDate |
| Outage: Local stop date | outageLocalStopDate |
| Period: Hour per day | periodHourPerDay |
| Market: Continent | marketContinent |
| Market: Geographic location (latitude) | marketGeographicLocationLatitude |
| Market: Geographic location (longitude) | marketGeographicLocationLongitude |
| Metadata: \<metadata field name\> | \<metadata field name\> |

---

### Report v3 Metric Field Names

| Report Configuration Name | JSON Metric Name |
|---------------------------|-----------------|
| # Hits | numberOfHits |
| # Encodations | numberOfEncodations |
| Weighted GRP | weightedGrp |
| # Channels | numberOfChannels |
| # Assets | numberOfAssets |
| # Assets With Hit | numberOfAssetsWithHit |
| # Channels With Hit | numberOfChannelsWithHit |
| # Regions | numberOfRegions |
| # Markets | numberOfMarkets |
| # Expected Hits | numberOfExpectedHits |
| # Content keywords | numberOfContentKeywords |
| # Metadata | numberOfMetadata |
| # Detection Dates | numberOfDetectionDates |
| # Channel keywords | numberOfChannelKeywords |
| Total asset length | totalAssetLength |
| Total actual detection length | totalActualDetectionLength |
| Total detection duration | totalDetectionDuration |
| # Asset seconds | numberOfAssetSeconds |
| # Hit metadata | numberOfHitMetadata |
| # Months | numberOfMonths |
| # Days | numberOfDays |
| # Hours | numberOfHours |
| # Broadcast months | numberOfBroadcastMonths |
| # Days of week | numberOfDaysOfWeek |
| # Hours per day | numberOfHoursPerDay |
| # Metadata: \<metadata field name\> | numberOfMetadata_\<metadata field name\> |

---

### Report v2 (Deprecated)

v2 is obsolete. Use v3. The v2 response wraps rows in a `"data"` array instead of `"rows"`, and custom metadata fields are prefixed with `assetMetadata` and camelCased (e.g. the field `slug` becomes `assetMetadataSlug`).

---

## 6. Report Formats

### 6.1 XML Format (v2.0)

Reports are in XML with root element `<report version="2.0">`.

All times are ISO 8601 in UTC unless otherwise specified. All data between tags is XML-encoded (use `&lt;` instead of `<`). Tags are case-sensitive.

**Complete structure:**

```xml
<?xml encoding="utf-8"?>
<report version="2.0">
  <rows>
    <row>
      <detection_start_date_time_utc>2012-08-16 10:53:41</detection_start_date_time_utc>
      <detection_stop_date_time_utc>2012-08-16 10:53:42</detection_stop_date_time_utc>
      <detection_start_date_time_local>2012-08-16 04:53:41</detection_start_date_time_local>
      <detection_stop_date_time_local>2012-08-16 04:53:42</detection_stop_date_time_local>
      <detection_length>00:00:02</detection_length>
      <program_name>Early Today</program_name>
      <channel_name>KSL</channel_name>
      <region_name>United States</region_name>
      <channel_resource_id>CH00326</channel_resource_id>
      <market_name>Salt Lake City</market_name>
      <dataset name="A">
        <metric name="numberOfAssets">231</metric>
        <metric name="numberOfDay" expectedValue="0">1</metric>
        <metric name="numberOfHits">1</metric>
        <metric name="numberOfMetadataItemID" related_field="item_id">1</metric>
      </dataset>
      <dataset name="B">
        <metric name="numberOfAssets">4557</metric>
        <metric name="numberOfDay" expectedValue="11">23</metric>
        <metric name="numberOfHits">67</metric>
        <metric name="numberOfMetadataItemID" related_field="item_id">5</metric>
      </dataset>
      <field name="item_id">foo</field>
      <field name="slug">bar</field>
    </row>
  </rows>
  <resource_id>RE16549-00008</resource_id>
  <execution_date_time_utc>2013-02-25T10:42:45Z</execution_date_time_utc>
  <total>1</total>
  <start>0</start>
  <count>1</count>
</report>
```

**Report-level fields:**

| Field | Type | Description |
|-------|------|-------------|
| resource_id | String | Report resource ID |
| execution_date_time_utc | DateTime | When the report was executed |
| total | Integer | Total rows in complete dataset |
| start | Integer | Starting index (always 0 in file exports) |
| count | Integer | Total rows in this file |
| rows | Container | List of row elements |

**Row-level fields:**

| Field | Type | Description |
|-------|------|-------------|
| detection_start_date_time_utc | DateTime | Detection start in UTC |
| detection_stop_date_time_utc | DateTime | Detection stop in UTC |
| detection_start_date_time_local | DateTime | Detection start in local channel time |
| detection_stop_date_time_local | DateTime | Detection stop in local channel time |
| detection_length | Duration | Duration in hh:mm:ss |
| program_name | String | EPG program name |
| channel_name | String | Channel name |
| region_name | String | Region/country name |
| channel_resource_id | String | Teletrax channel resource ID |
| market_name | String | Market name |
| dataset | Compound | Metrics dataset; has `name` attribute |
| field | String | Custom metadata field value; has `name` attribute |

**dataset/metric attributes:**

- `dataset name="A"` — Dataset name as configured in report
- `metric name="..."` — The metric identifier
- `metric expectedValue="..."` — Optional expected value for comparison

---

### 6.2 CSV Format

CSV is a hybrid human/machine-readable format. Column headers are in human-readable format (not machine-readable field names).

**With header block:**

```csv
Report date: 2013-04-29 11:28:25 (UTC)
Starting (Detection date UTC): 2013-04-28 00:00:00
Ending (Detection date UTC): 2013-04-29 00:00:00
Slug,Item ID,Market: Name,Channel: Name,Channel: ResourceID,EPG Program name,Detection duration,UTC detection start,Local detection start,Activation date start (UTC),# Hits
bar,foo,Spain,Canal 24 Horas,CH00435,Telediario Internacional,00:00:09,2013-04-28 00:00:25,2013-04-28 02:00:25,2012-10-03 11:58:26,1
```

**Without header block:**

```csv
Slug,Item ID,Market: Name,Channel: Name,Channel: ResourceID,EPG Program name,Detection duration,UTC detection start,Local detection start,Activation date start (UTC),# Hits
bar,foo,Spain,Canal 24 Horas,CH00435,Telediario Internacional,00:00:09,2013-04-28 00:00:25,2013-04-28 02:00:25,2012-10-03 11:58:26,1
```

**Column definitions:**

| Column | Description |
|--------|-------------|
| Slug | Asset slug identifier |
| Item ID | Asset item ID |
| Market: Name | Market name (e.g. "Spain", "International (Germany)") |
| Channel: Name | Channel name |
| Channel: ResourceID | Teletrax channel resource ID (e.g. CH00435) |
| EPG Program name | Programme name at time of detection |
| Detection duration | Detection duration in hh:mm:ss |
| UTC detection start | Detection start in UTC (yyyy-mm-dd hh:mm:ss) |
| Local detection start | Detection start in channel's local timezone |
| Activation date start (UTC) | Asset activation time in UTC |
| # Hits | Number of detections |

**Key notes:**
- Column headers are always present and cannot be omitted
- Date format: `yyyy-mm-dd hh:mm:ss` (parts omitted if not applicable)
- No timezone label is embedded in date values — use the column header to determine UTC vs local
- CSV separator is configurable: `,` (comma), `|` (pipe), tab, or any single character

---

### 6.3 XLSX Format

XLSX is readable by Microsoft Excel. The report contains two tabs:

- **Tab 1:** Report results (the detection data)
- **Tab 2:** Additional metadata about the report run (report configuration, date ranges, etc.)

When exported from the portal, date/time columns are formatted as `yyyy-mm-dd` datetime columns suitable for Excel data analysis functions.

---

## 7. Asset and Encodation API Requests

### Retrieving a List of Assets

```
GET https://api.teletrax.com/api/v1/assets/
```

| Parameter | Type | Description |
|-----------|------|-------------|
| limit (optional) | Integer | Items to return (default 10, max 100) |
| skip (optional) | Integer | Items to skip |
| query (optional) | String | JSV key/value filter on metadata fields. Example: `{itemid:a, slug:b}` |
| modifiedSince (optional) | DateTime | Only return assets changed since this datetime (ISO 8601). Example: `2013-01-08T12:00:00.000Z` |
| start (optional) | DateTime | Only return assets with activation start date on or after this datetime |
| stop (optional) | DateTime | Only return assets with activation start date before this datetime |

**Response:**

```json
{
  "assets": [ { ... }, { ... }, { ... } ]
}
```

---

### Retrieving a Single Asset

```
GET https://api.teletrax.com/api/v1/assets/{assetID}
```

**Response:**

```json
{
  "asset": { ... }
}
```

---

### Creating an Asset (Watermark)

```
POST https://api.teletrax.com/api/v1/assets
```

Synchronous for watermark assets — created asset is returned immediately.

**Request body example:**

```json
{
  "asset": {
    "enabled": true,
    "metadata": {
      "itemid": "S123"
    },
    "encodations": [
      {
        "lengthSeconds": 10,
        "videoWatermark": {
          "embeddingStart": "2014-05-07T16:48:50Z",
          "embeddingStop": "2014-05-07T16:48:59Z",
          "eid": 10
        }
      }
    ]
  }
}
```

**Response:** `200 OK` with created asset.

---

### Creating an Asset (Fingerprint via URL)

```
POST https://api.teletrax.com/api/v1/assets
```

Asynchronous for fingerprint assets. Downloading, fingerprint generation, and asset creation happen in the background.

**Request body example:**

```json
{
  "asset": {
    "enabled": true,
    "metadata": {
      "itemid": "S123"
    },
    "encodations": [
      {
        "lengthSeconds": 10,
        "videoFingerprint": {
          "videoUrl": "https://www.youtube.com/watch?v=FS1JfTMO1PU"
        }
      }
    ]
  }
}
```

**Response:** `202 Accepted` — request accepted; no guarantee of future success or failure.

Supported URL targets: HTTP/HTTPS video URLs, YouTube video URLs. Most video formats are supported.

---

### Updating an Asset

```
POST https://api.teletrax.com/api/v1/assets/{assetID}
```

Only editable fields (`enabled`, `metadata`, `encodations`) may be updated. For encodation updates, include only the encodations to be changed and their resource IDs.

**Response:** `200 OK` with updated asset.

---

### Deleting an Asset

```
DELETE https://api.teletrax.com/api/v1/assets/{assetID}
```

**Response:** `200 OK`

---

### Retrieving Encodations for an Asset

```
GET https://api.teletrax.com/api/v1/assets/{assetID}/encodations
```

Note: As of documentation time, this endpoint is specified but not implemented.

| Parameter | Type | Description |
|-----------|------|-------------|
| limit (optional) | Integer | Items to return (default 10) |
| skip (optional) | Integer | Items to skip |

---

### Retrieving a Specific Encodation

```
GET https://api.teletrax.com/api/v1/assets/{assetID}/encodations/{encodationID}
```

---

### Updating a Specific Encodation

```
POST https://api.teletrax.com/api/v1/assets/{assetID}/encodations/{encodationID}
```

---

### Adding an Encodation to an Asset

```
POST https://api.teletrax.com/api/v1/assets/{assetID}/encodations/
```

Do not include an encodation resource ID in the body.

---

### Deleting an Encodation

```
DELETE https://api.teletrax.com/api/v1/assets/{assetID}/encodations/{encodationID}
```

**Constraint:** An asset must always have at least one encodation. The last encodation cannot be deleted.

**Response:** `200 OK`

---

## 8. Channel API Requests

The channel API operates only on your cleared channels, not all channels in Teletrax.

### Retrieving a List of Channels

```
GET https://api.teletrax.com/api/v1/channels/
```

| Parameter | Type | Description |
|-----------|------|-------------|
| limit (optional) | Integer | Items to return (default 10, max 100) |
| skip (optional) | Integer | Items to skip |

**Response:**

```json
{
  "channels": [ { ... }, { ... }, { ... } ]
}
```

---

### Retrieving a Single Channel

```
GET https://api.teletrax.com/api/v1/channels/{channelID}
```

---

### Updating a Single Channel

```
POST https://api.teletrax.com/api/v1/channels/{channelID}
```

**curl examples:**

```bash
# Update single field
curl -X POST -H "Content-Type: application/json" \
  -d '{channel:{metadata:{"[fieldname]":"new value"}}}' \
  --user your.name@acme.com:2abf22a3-42e3-71a8-353f-beef532a3145 \
  https://api.teletrax.com/api/v1/channels/{channelID}

# Update multiple fields
curl -X POST -H "Content-Type: application/json" \
  -d '{channel:{metadata:{"[fieldname]":"new value","[otherfieldname]":"new value"}}}' \
  --user your.name@acme.com:2abf22a3-42e3-71a8-353f-beef532a3145 \
  https://api.teletrax.com/api/v1/channels/{channelID}
```

**Response:** `200 OK`

---

## 9. Metadata (Field) API Requests

### Retrieving a List of Fields

```
GET https://api.teletrax.com/api/v1/metadata
GET https://api.teletrax.com/api/v1/metadata/{entity}
```

Replace `{entity}` with `hit`, `asset`, or `channel`.

**Response:** `{ "fields": [ ... ] }`

---

### Retrieving a Single Metadata Field

```
GET https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}
```

---

### Creating a Metadata Field

```
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields
```

**Example body:**

```json
{
  "field": {
    "displayName": "New field",
    "fieldName": "new_field"
  }
}
```

---

### Updating a Metadata Field

```
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}
```

---

### Deleting a Metadata Field

```
DELETE https://api.teletrax.com/api/v1/metadata/asset/fields/MF12345-002
```

**Response:** `200 OK`

---

### Field Ordering

```
GET  https://api.teletrax.com/api/v1/metadata/{entity}/fields/sort
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields/sort
```

Request/response body for POST: `{ "fields": ["resourceID1", "resourceID2", ...] }`

---

### List Field Options (type 'List' only)

```
GET https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options
GET https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options/{option_resourceID}
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options/{option_resourceID}
DELETE https://api.teletrax.com/api/v1/metadata/asset/fields/MF12345-002/options/MF12345-002-O00001
```

Pagination for list: `$top` (default 10, max 100), `$skip`.

---

### Rules (Asset entity only)

```
GET  https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules
GET  https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules/{rule_resourceID}
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules/{rule_resourceID}
DELETE https://api.teletrax.com/api/v1/metadata/asset/fields/MF12345-002/rules/MF12345-002-R00001

# Rule ordering
GET  https://api.teletrax.com/api/v1/metadata/{entity}/fields/{field_or_resourceID}/rules/sort
POST https://api.teletrax.com/api/v1/metadata/{entity}/fields/{field_or_resourceID}/rules/sort
```

---

## 10. Data Modifications API

Because Teletrax is highly dynamic (retrotracking, channel clearances, outages), the Modifications API allows you to identify which days have changed data. The recommended synchronization approach is to treat data as time-slot-based: retrieve the full data for any dirty slot, wipe it, and reload.

### Retrieving Modifications for a Day

```
GET https://api.teletrax.com/api/v1/modifications/{day}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| day (optional) | Date | UTC day to query. Defaults to current UTC day if omitted |

**Response:**

```json
{
  "modifications": [
    { "day": "2014-07-28", "hint": "AssetMetadataChanged" },
    { "day": "2014-07-28", "hint": "ChannelCleared" }
  ]
}
```

---

### Retrieving Supported Modification Hints

```
GET https://api.teletrax.com/api/v1/modifications/hints/
```

**Response:**

```json
{
  "hints": [
    "AudienceUpdate",
    "AssetDeleted"
  ]
}
```

---

### Modification Hint Reference

| Hint | Description |
|------|-------------|
| HitChanged | A detection changed: new, retrotracked, or new watermark asset registered (matched to unmatched) |
| AssetMetadataChanged | Asset metadata changed — resync all days if asset metadata is included in your report |
| ChannelMetadataChanged | Channel metadata changed — resync if report contains custom channel metadata |
| ChannelClearance | More or fewer channels are visible during this day |
| AudienceUpdate | A hit has an audience update |
| AssetDeleted | An asset was deleted (creates unmatched hits for watermarking, removes detections for fingerprinting) |
| OutageChange | A registered or updated outage modified this day |

---

## 11. Workflow API Requests

The Workflow API allows inspection of file processing status and programmatic upload of files.

### Retrieving a List of Imported Files

```
GET https://api.teletrax.com/api/v1/workflow/files
```

| Parameter | Type | Description |
|-----------|------|-------------|
| start | DateTime | Start of time range (file found or finished) |
| stop | DateTime | End of time range |
| limit (optional) | Integer | Items to return (default 10, max 100) |
| skip (optional) | Integer | Items to skip |
| query (optional) | String | JSV filter. Available filter keys: `filename` (wildcards allowed, e.g. `day*.txt`), `state` (found/success/failed), `type` (ceco/encodation/grp/expectedHits/video). Example: `{state: success, type: ceco}` |

**Response:** `{ "files": [ ... ] }`

---

### Uploading a File

```
POST https://api.teletrax.com/api/v1/workflow/files
```

Content type: `multipart/form-data`

| Key | Type | Description |
|-----|------|-------------|
| type | String | File type: "Ceco", "Encodation", or "Video" |
| content | Binary | File content (include filename in request) |

**Response:** `200 OK` — `{"success":true}`

**Example request:**

```
POST https://api.teletrax.com/api/v1/workflow/files HTTP/1.1
Content-Type: multipart/form-data; boundary=--------------------------823294092021958208657215

----------------------------823294092021958208657215
Content-Disposition: form-data; name="type"

Encodation
----------------------------823294092021958208657215
Content-Disposition: form-data; name="content"; filename="test.encodation.xml"
Content-Type: application/xml

<?xml version="1.0" encoding="utf-8"?>
<encodation_import xmlns:fo="http://www.w3.org/1999/XSL/Format" version="1.0">
  <encodations>
    <encodation>
      <client>123</client>
      <watermark>
        <embeddingid>135</embeddingid>
        <start_time_utc>2018-12-06T20:59:29Z</start_time_utc>
        <stop_time_utc>2018-12-07T21:00:18Z</stop_time_utc>
      </watermark>
      <entertainment>
        <item_id>ItemID string</item_id>
        <slug>Slug string</slug>
        <description>Description string</description>
      </entertainment>
    </encodation>
  </encodations>
</encodation_import>
```

---

## 12. API Events (Webhooks)

Events are configured on the API overview page of the Teletrax portal. When an event occurs, Teletrax makes an HTTP request to a URL you configure.

**Acknowledgement:** Your endpoint must respond with HTTP `200 OK` and the body text `OK`. If Teletrax does not receive this response, it will retry up to 5 times before discarding the event.

### Event: Asset Created or Updated

```
POST http://www.yoururl.com/assets/{resourceID}
```

**Request body:**

```json
{
  "asset": {
    "resourceID": "AE12345-2012-05-00037",
    "enabled": true,
    "permalink": "http://www.teletrax.com/r/a4f83z94659365h",
    "metadata": {
      "itemid": "My Show",
      "slug": "My Show episode 3.14"
    },
    "encodations": [{
      "resourceID": "AE12345-2012-05-00037-001",
      "lengthSeconds": 1320,
      "videoFingerprint": {
        "fingerprintID": "81e2b8b8-246e-46d0-bdfe-75ed650310f4",
        "status": "active"
      }
    }]
  }
}
```

---

### Event: Asset Deleted

```
DELETE http://www.yoururl.com/assets/{resourceID}
```

No request body.

---

### Event: Encodation Created or Updated

```
POST http://www.yoururl.com/assets/{resourceID}/encodations/{resourceID}
```

**Request body:**

```json
{
  "encodation": {
    "resourceID": "AE12345-2012-05-00037-001",
    "lengthSeconds": 1320,
    "videoFingerprint": {
      "fingerprintID": "81e2b8b8-246e-46d0-bdfe-75ed650310f4",
      "status": "active",
      "ceco": "Q0VDTwIAAAMBAA [partly omitted] Tk5XMCX7cjMw+7BXMfuwzw="
    }
  }
}
```

---

### Event: Encodation Deleted

```
DELETE http://www.yoururl.com/assets/{resourceID}/encodations/{resourceID}
```

No request body.

---

## 13. Image Watermark API

Base URL: `https://watermark.kinetiq.tv`

Authentication: Basic Authentication over HTTPS (same email/API key as main API).

### Embed a Watermark in an Image

```
POST https://watermark.kinetiq.tv/image/api/v1/embed
```

Content type: `multipart/form-data`

| Key | Type | Description |
|-----|------|-------------|
| image | File | Image file (JPG, PNG, or GIF) |
| slug (optional) | String | Metadata information (e.g. campaign name) |
| cpp (optional) | String | Zero-based index of embedder CPP program to use. Default: 1 |
| stub (optional) | String | 1 to embed visible stub for testing, 0 for production. Default: 0 |

**Response:** Binary image with content type `image/jpeg`, `image/png`, or `image/gif` matching input. Encodation is automatically uploaded to the Teletrax database.

A still image on screen for at least 2.5 seconds can be detected by Teletrax.

---

### Detect a Watermark in an Image

```
POST https://watermark.kinetiq.tv/image/api/v1/detect
```

Content type: `multipart/form-data`

| Key | Type | Description |
|-----|------|-------------|
| image | File | Image file (JPG, PNG, or GIF) |

**Response:**

| Key | Type | Description |
|-----|------|-------------|
| input_filename | String | Name of the input image |
| watermarked | Boolean | True if watermark found |
| embeddingid | Integer (optional) | Embedding ID used |
| start_time_utc | Time (optional) | Embedding start time |
| stop_time_utc | Time (optional) | Embedding stop time |
| embedded_energy | Double (optional) | Average QF factor |
| asset_filename | String (optional) | Name of the associated asset |
| slug | String (optional) | Slug passed during embedding |

Optional fields are only present when a watermark was found, belongs to the client, and is continuous.

**Example response:**

```json
{
  "input_filename": "2022DaysAbove_Local_albanyga_en_title_lg_WM_CPP1.jpg",
  "slug": "Weather2022",
  "watermarked": true,
  "embeddingid": "4050",
  "start_time_utc": "2022-06-28T18:32:49Z",
  "stop_time_utc": "2022-06-28T18:32:50Z",
  "embedded_energy": "41.4446"
}
```

---

## 14. Encodation Import XML Format (V2.1)

Used for importing watermark/fingerprint encodation records into Teletrax. File extension: `.encodation.xml` or `.xml`.

Times must be in ISO 8601 format relative to UTC. All data between XML tags must be XML-encoded.

### Document Structure

```xml
<?xml version="1.0" encoding="utf-8"?>
<encodation_import version="1.0">
  <encodations>
    <encodation>
      <client></client>
      <embeddertype></embeddertype>
      <facility></facility>
      <permalink></permalink>
      <cfgcrc></cfgcrc>
      <clientkey></clientkey>
      <watermark>
        <embeddingid></embeddingid>
        <start_time_utc></start_time_utc>
        <stop_time_utc></stop_time_utc>
        <global_depth></global_depth>
        <max_local_depth></max_local_depth>
        <flat_region></flat_region>
        <embedded_energy></embedded_energy>
        <prior_watermark></prior_watermark>
      </watermark>
      <fingerprint>
        <ceco>
          <file></file>
          <data></data>
        </ceco>
        <id></id>
      </fingerprint>
      <process>
        <start_time_utc></start_time_utc>
        <stop_time_utc></stop_time_utc>
      </process>
      <metadata category="">
        <field name=""></field>
      </metadata>
    </encodation>
  </encodations>
  <mappings mode=""></mappings>
</encodation_import>
```

### Encodation Fields

| Field | Type | Description |
|-------|------|-------------|
| client | Integer (optional) | Client identifier number from Client Services |
| embeddertype | String (optional) | Embedding application build info |
| facility | String (optional) | Name of the facility that did the embedding |
| permalink | String/Boolean (optional) | If true, a permalink is generated for this asset |
| cfgcrc | String (optional) | CRC used in the configuration file |
| clientkey | String (optional) | Unique client-assigned key to identify encodation; required to update an encodation after first import |
| watermark | Compound | Watermark information |
| fingerprint | Compound | Fingerprint information |
| process | Compound | Metadata about creation of this encodation |
| metadata | Compound | Metadata information |

### Watermark Fields

| Field | Type | Description |
|-------|------|-------------|
| embeddingid | Integer | The EID used to watermark content |
| start_time_utc | Time | Embedding start datetime (UTC, ISO 8601) |
| stop_time_utc | Time | Embedding stop datetime (UTC, ISO 8601) |
| global_depth | Double (optional) | GlobalDepth used for embedding |
| max_local_depth | Integer (optional) | MaxLocalDepth for old algorithm; omitted if new algorithm used |
| flat_region | Integer (optional) | 1 if flat region embedding enabled for old algorithm |
| embedded_energy | Double (optional) | Average embedded watermark energy, or QF factor |
| prior_watermark | Integer (optional) | Proportion of content pre-watermarked (0-100) |

### Fingerprint Fields

| Field | Type | Description |
|-------|------|-------------|
| ceco | Compound (optional) | CECO data |
| id | String | Reference ID (usually a GUID) used by mediahedge |

### CECO Fields

| Field | Type | Description |
|-------|------|-------------|
| file | String | Filename of the ceco file |
| data | Binary base64 | CECO data as base64 (use either file or data, not both) |

### Process Fields

| Field | Type | Description |
|-------|------|-------------|
| start_time_utc | Time | Actual datetime embedding or fingerprint generation started |
| stop_time_utc | Time | Actual datetime embedding or fingerprint generation ended |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| field | String | Custom field value; `name` attribute specifies the field identifier |

The `metadata` element has an optional `category` attribute for categorization.

### Mappings

`<mappings>` is an optional container (outside `<encodations>`) for prior watermark information. Two modes:

- `mode="clear"`: Contains `<mapping>` elements with 7 space-separated values:
  1. EID of new watermark
  2. First timestamp of new watermark
  3. Last timestamp of new watermark
  4. EID of old watermark
  5. First timestamp of old watermark
  6. Last timestamp of old watermark
  7. `1` if watermark was overwritten; `0` if embedder was disabled

  Example: `1609 20131031010203 20131031010207 42 20131029010203 20131029010207 1`

- `mode="encrypted"`: AES-encrypted base64 string; when decrypted, contains clear `<mappings>` content.

Note: `<mappings>` is aggregated across all encodations in the file. Individual mappings may span multiple encodations.

---

## 15. Fields and Custom Metadata

Custom metadata allows clients to store additional information about content (genre, identification ID, notes, campaign, advertiser, etc.) in Teletrax for use in reports.

Metadata fields are managed on the Metadata page in the Teletrax portal. When a metadata definition changes, the database is updated in the background — during this short transition period, artifacts may appear in reports.

### Using Metadata in API Calls

In asset queries, use JSV format:

```
GET https://api.teletrax.com/api/v1/assets/?query={itemid:MyShow, slug:episode3}
```

In report v3 responses, custom metadata fields appear directly by their `fieldName` in the row object:

```json
{
  "itemid": "My Show",
  "slug": "My Show episode 3.14"
}
```

In report v2 responses (deprecated), custom metadata fields are prefixed with `assetMetadata` and camelCased:

- Field `slug` becomes `assetMetadataSlug`
- Field `item_id` becomes `assetMetadataItemId`

---

## 16. Rate Limits and Pagination

No explicit rate limits are documented. The following pagination controls are documented across endpoints:

| Endpoint | Default limit | Max limit | Parameters |
|----------|--------------|-----------|------------|
| Assets | 10 | 100 | `limit`, `skip` |
| Channels | 10 | 100 | `limit`, `skip` |
| Report data | 2000 | Not documented | `limit`, `skip` |
| Workflow files | 10 | 100 | `limit`, `skip` |
| Encodations (per asset) | 10 | Not documented | `limit`, `skip` |
| Field options | 10 | 100 | `$top`, `$skip` |

Report results are **cached for at least 5 minutes**. Detection data is available on the portal approximately 30 to 60 minutes after airing.

---

## 17. Error Handling

### HTTP Status Codes

- `200 OK` — Success
- `202 Accepted` — Asynchronous request accepted (fingerprint from URL)
- `404 Not Found` — Resource does not exist

### FTP File Processing Errors

When a file upload fails, the file is moved to the error folder and a corresponding `<filename>.errordetails.txt` file is created explaining why the file could not be processed.

### Processing Receipts (JSON)

When receipts are enabled, Teletrax writes a `<filename>_receipt.txt` after processing:

**Success:**
```json
{ "state": "success" }
```

**Error:**
```json
{
  "state": "error",
  "errorMessage": ["CRC Check failed, re-upload the file"]
}
```

**Zip file receipt:**
```json
{
  "files": [
    { "filename": "zippedfile_1", "state": "error", "errorMessage": ["Error message"] },
    { "filename": "zippedfile_2", "state": "success" }
  ]
}
```

Receipts must be deleted within 48 hours to acknowledge receipt; otherwise they are auto-removed.

### Known Error States for Files

| State | Meaning |
|-------|---------|
| found | File located, awaiting processing |
| success | File successfully processed |
| failed | File rejected; see errordetails.txt |

### Fingerprint Rejection Rules

Teletrax rejects fingerprint content that is:
- **Shorter than 5 seconds** — rejected
- **Compilations / reordered content** — allowed
- **Modified beyond threshold** — rejected if modification exceeds the configured duration threshold (threshold is set by client services, not configurable by the client)

### API Event Retry Behavior

If your webhook endpoint does not return `200 OK` with body `OK`, Teletrax retries up to **5 times** before discarding the event.

---

## 18. Troubleshooting

For debugging HTTP API interactions, the following tools are recommended:

- **Windows:** Fiddler (http://fiddler2.com/)
- **Mac:** WireShark or Charles (http://www.charlesproxy.com/)
- **Linux:** Java tools listed at StackOverflow
- **Browser:** FireBug for Firefox
- **General:** Postman for Chrome

When filing a bug report or support request, include the full HTTP request and response pair.

---

## 19. Quick Reference: Complete Endpoint List

```
# Version
GET  /api/v1/version

# Assets
GET  /api/v1/assets/
GET  /api/v1/assets/{assetID}
POST /api/v1/assets
POST /api/v1/assets/{assetID}
DELETE /api/v1/assets/{assetID}

# Encodations
GET  /api/v1/assets/{assetID}/encodations
GET  /api/v1/assets/{assetID}/encodations/{encodationID}
POST /api/v1/assets/{assetID}/encodations/
POST /api/v1/assets/{assetID}/encodations/{encodationID}
DELETE /api/v1/assets/{assetID}/encodations/{encodationID}

# Reports
GET  /api/v1/reports/{reportID}/data

# Channels
GET  /api/v1/channels/
GET  /api/v1/channels/{channelID}
POST /api/v1/channels/{channelID}

# Modifications
GET  /api/v1/modifications/{day}
GET  /api/v1/modifications/hints/

# Workflow
GET  /api/v1/workflow/files
POST /api/v1/workflow/files

# Metadata Fields
GET  /api/v1/metadata
GET  /api/v1/metadata/{entity}
GET  /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}
POST /api/v1/metadata/{entity}/fields
POST /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}
DELETE /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}
GET  /api/v1/metadata/{entity}/fields/sort
POST /api/v1/metadata/{entity}/fields/sort

# Field Options (List type only)
GET  /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options
GET  /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options/{option_resourceID}
POST /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options
POST /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options/{option_resourceID}
DELETE /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/options/{option_resourceID}

# Rules (Asset entity only)
GET  /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules
GET  /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules/{rule_resourceID}
POST /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules
POST /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules/{rule_resourceID}
DELETE /api/v1/metadata/{entity}/fields/{fieldname_or_resourceID}/rules/{rule_resourceID}
GET  /api/v1/metadata/{entity}/fields/{field_or_resourceID}/rules/sort
POST /api/v1/metadata/{entity}/fields/{field_or_resourceID}/rules/sort

# Image Watermark (separate base URL: https://watermark.kinetiq.tv)
POST /image/api/v1/embed
POST /image/api/v1/detect
```