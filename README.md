# KeywordNotify - Multi-Server Configuration

A Vencord/Equicord Discord plugin that monitors messages for keywords/regexes and sends notifications.

## New Features (Multi-Server Update)

### 1. Per-Server Configuration

- Each keyword entry can be scoped to a specific Discord server (guild)
- Select "All Servers" (default) for global keywords
- Select specific server to monitor only in that server

### 2. Webhook Notifications

- Optional Discord webhook URL for each keyword entry
- Sends rich embed notifications when keyword matches
- Includes: keyword, server, channel, author, time, and message preview
- Webhook format:
  - Username: KeywordNotify
  - Color: Green (0x00ff00)
  - Fields: Keyword, Server, Channel, Author, Time
  - Description: Message preview (up to 500 chars)
  - Footer: Match count

### 3. Keyword Statistics

- **Total Matches**: How many times this keyword matched
- **Last Matched**: Timestamp of most recent match
- Stats displayed in keyword entry UI
- Automatically updated on each match
- Persistent across sessions

## Configuration

### Settings

- **Ignore Bots**: Skip messages from bot accounts
- **Amount to Keep**: Number of matched messages to log
- **Keywords**: Manage keyword entries

### Keyword Entry Fields

1. **Regex Pattern**: The regex to match in messages
2. **Enabled**: Toggle this keyword entry on/off
3. **Ignore Case**: Case-insensitive regex matching
4. **Server**: Select specific server or "All Servers"
5. **Webhook URL**: Optional Discord webhook for notifications
6. **Whitelist/Blacklist**:
   - **Whitelist**: Only match in listed channels/users/guilds
   - **Blacklist**: Match everywhere except listed
7. **List IDs**: Channel/user/guild IDs for whitelist/blacklist

### Stats Display

- **Total Matches**: Cumulative match count
- **Last Matched**: Date/time of most recent match

## Usage

### Basic Setup

1. Open Discord settings → Vencord → Plugins → KeywordNotify
2. Click "Add Keyword Entry"
3. Enter regex pattern (e.g., `urgent|important`)
4. Configure options:
   - Server: Select "All Servers" or specific server
   - Ignore Case: Enable for case-insensitive matching
   - Whitelist/Blacklist: Define where to look for matches
5. Click "Enabled" to activate

### Webhook Setup

1. Create a Discord webhook in your target server
2. Copy the webhook URL
3. Paste into "Webhook URL" field in keyword entry
4. Keyword matches will now send notifications to webhook

### Stats Monitoring

Stats are displayed in each keyword entry:
- **🎯 Total Matches**: How many times this keyword triggered
- **📊 Last Matched**: When this keyword last matched

## Data Migration

The plugin automatically migrates existing keyword entries:
- Old entries: Work as before (all servers, no webhook)
- New fields: Added with default values on startup
- Stats: Preserved if previously tracked

## Data Storage

- **Keyword Entries**: `KeywordNotify_keywordEntries`
- **Message Log**: `KeywordNotify_log`
- **Stats**: `KeywordNotify_stats`

## Import/Export

- **Export Keywords**: Download all keyword entries as JSON
- **Import Keywords**: Load keyword entries from JSON file
- **Clear All**: Delete all keyword entries (with confirmation)

## Examples

### Server-Specific Keyword

```
Regex: "deploy|production"
Server: "Dev Team Server"
Enabled: ✓
```
Only matches in "Dev Team Server"

### Webhook Alert

```
Regex: "error|critical|exception"
Webhook URL: https://discord.com/api/webhooks/...
Enabled: ✓
```
Sends webhook alerts for error keywords

### Whitelist Mode

```
Regex: "meeting"
List Type: Whitelist
List IDs: [channel_id_1, channel_id_2]
Enabled: ✓
```
Only matches in specified channels

### Stats Monitoring

After running for a while:
- **Total Matches**: 42
- **Last Matched**: 2026-02-02 04:30:15
- Shows keyword is actively triggering

## Technical Details

### Message Matching

- Searches message content
- Searches embed titles, descriptions, and fields
- Supports regex patterns
- Case-sensitive (unless "Ignore Case" enabled)
- Thread-safe parallel processing

### Server Filtering

- Messages are filtered by `guild_id`
- DMs have `guild_id = null`
- Entries with `serverId = null` match everywhere
- Entries with specific `serverId` only match that server

### Webhook Notifications

- Sent via `fetch()` to Discord webhook URL
- Rich embed format
- Silent on failure (logs to console)
- No rate limiting (Discord handles webhook rate limits)

### Stats Tracking

- Updated on every keyword match
- Stored in `keywordStats` object
- Persisted to DataStore
- Includes per-server match counts

## Troubleshooting

### Keywords Not Matching

- Check that keyword entry is **Enabled**
- Verify regex pattern is valid
- Check server filter (matches current server?)
- Review whitelist/blacklist settings
- Ensure bot is not being ignored (if applicable)

### Webhook Not Working

- Verify webhook URL is correct
- Check webhook permissions in Discord
- Check console for error messages
- Test webhook with curl:
  ```bash
  curl -X POST -H "Content-Type: application/json" \
    -d '{"content":"test"}' \
    WEBHOOK_URL
  ```

### Stats Not Updating

- Check keyword entry is **Enabled**
- Verify matches are occurring
- Check DataStore is working
- Reload plugin (restart Discord)

## Credits

- Original authors: camila314, x3rt
- Multi-server update: Lumi (Lu's AI Assistant)
- Vencord framework
