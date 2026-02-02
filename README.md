# KeywordNotify - Vencord/Equicord Plugin

A Vencord/Equicord Discord client plugin that monitors messages for user-defined keywords and sends notifications when matches are found. Never miss important messages again!

## Features

- **Keyword Monitoring**: Set custom regex patterns to watch for specific words or phrases
- **Flexible Filtering**: 
  - Blacklist mode: Match everywhere except specific channels/guilds/users
  - Whitelist mode: Only match in specific channels/guilds/users
- **Case Sensitivity**: Toggle case-insensitive matching per keyword
- **Bot Control**: Option to ignore bot messages or whitelist specific bots
- **Persistent Log**: Maintains history of matched messages (configurable size)
- **Keyword Highlighting**: Highlights matched keywords in notification messages
- **Custom UI**: Adds "Keywords" tab to Discord inbox for easy management

## Installation

### Requirements
- [Vencord](https://vencord.dev/) or [Equicord](https://equicord.com/) Discord client mod
- Discord Desktop or Web

### Manual Installation

1. **Download the plugin**:
   ```bash
   git clone https://github.com/luinbytes/equicord-keywordautoresponder.git
   ```
   or download the `index.tsx` and `style.css` files directly

2. **Add plugin to Vencord/Equicord**:
   - Open Discord with Vencord/Equicord installed
   - Go to **Settings → Vencord → Plugins**
   - Click "Open Plugins Folder" or navigate to the plugins directory
   - Copy `index.tsx` and `style.css` to the plugins folder
   - Restart Discord or reload plugins

3. **Enable the plugin**:
   - In Discord Settings, go to **Vencord → Plugins**
   - Find "KeywordNotify" and toggle it on

## Usage

### Setting Up Keywords

1. **Open Settings**:
   - Navigate to **Settings → Vencord → Plugins → KeywordNotify**
   - Or click the new "Keywords" tab in your Discord inbox

2. **Add a Keyword**:
   - Click "Add Keyword Entry"
   - Enter a regex pattern in the "Regex" field
   - Examples:
     - `urgent` - matches exact word
     - `\b(meeting|call|important)\b` - matches multiple words
     - `@everyone|ping` - matches mentions or the word "ping"

3. **Configure Filters**:
   - **List Type**: Choose BlackList (match everywhere except) or Whitelist (only match in)
   - **List IDs**: Add channel, guild, or user IDs to filter by
     - Channel ID: Right-click channel → Copy Link → extract ID
     - Guild ID: Right-click server icon → Copy Link → extract ID
     - User ID: Right-click user → Copy ID
   - **Ignore Case**: Toggle for case-insensitive matching

4. **Global Settings**:
   - **Amount to Keep**: Number of matched messages to store in history
   - **Ignore Bots**: Toggle to ignore messages from bots globally

### Viewing Matches

- Click the "Keywords" tab in your Discord inbox (next to Mentions)
- Browse all matched messages with timestamps
- Click any message to jump to it in Discord
- Use "Clear All" to clear your match history

## Examples

### Use Case 1: Team Coordination
Monitor for important team mentions:
- Regex: `\b(meeting|standup|sprint|deploy)\b`
- List Type: Whitelist
- List IDs: Your team channel IDs
- Ignore Case: On

### Use Case 2: Customer Support
Track customer support keywords in all channels:
- Regex: `\b(help|support|issue|bug)\b`
- List Type: BlackList
- List IDs: Bot channel IDs (exclude)
- Ignore Case: On

### Use Case 3: Server Announcements
Never miss official announcements:
- Regex: `\b(announcement|update|maintenance|important)\b`
- List Type: Whitelist
- List IDs: Announcements channel IDs
- Ignore Case: On

## Advanced Regex Tips

- **Word boundaries**: Use `\b` to match whole words only
  - `\btest\b` matches "test" but not "testing"
- **Multiple patterns**: Use `|` for OR
  - `(urgent|important|critical)`
- **Character classes**: Use `[]` for any character in the set
  - `[Cc]at` matches "cat" or "Cat"
- **Escape special chars**: Use `\` for regex special characters
  - `hello!` becomes `hello\!`

## Troubleshooting

### Plugin not showing in Vencord settings
- Ensure you've copied both `index.tsx` and `style.css` to the plugins folder
- Try restarting Discord completely

### Keywords not matching
- Verify your regex pattern is valid (test at [regex101.com](https://regex101.com/))
- Check if the channel/user is filtered by blacklist/whitelist
- Ensure the message hasn't exceeded the "Amount to Keep" limit

### Notifications not appearing
- Check Discord notification settings (system and app)
- Verify the Keywords tab is enabled in your inbox
- Try reloading Discord

### Keywords tab missing from inbox
- Restart Discord
- Make sure the plugin is enabled in Vencord settings
- Check Vencord/Equicord is up to date

## Screenshots

*Screenshots coming soon!*

## Development

This is a single-file plugin designed for the Vencord/Equicord plugin system. It uses:
- Vencord's webpack patching system
- React for UI components
- DataStore for persistent settings and logs

For development guidance, see [CLAUDE.md](CLAUDE.md).

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This plugin is part of the Vencord project and follows the GPL-3.0-or-later license.

## Credits

Built on top of [Vencord](https://vencord.dev/) and [Equicord](https://equicord.com/).

Original Vencord copyright (c) 2023 Vendicated, camila314, and contributors.

## Support

For issues specific to this plugin:
- Open an issue on [GitHub](https://github.com/luinbytes/equicord-keywordautoresponder/issues)

For Vencord/Equicord support:
- [Vencord Discord](https://discord.gg/vencord)
- [Equicord Discord](https://discord.gg/equicord)
