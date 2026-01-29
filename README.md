# KeywordNotify - Vencord/Equicord Plugin

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://opensource.org/licenses/GPL-3.0)

A powerful keyword monitoring plugin for Vencord/Equicord that notifies you when specific keywords or regex patterns appear in Discord messages.

## ✨ Features

### 🎯 Keyword Matching
- **Regex Support**: Full regular expression support for flexible pattern matching
- **Multiple Keywords**: Create unlimited keyword entries
- **Case Insensitive Option**: Toggle case sensitivity per keyword
- **Smart Matching**: Searches message content, embed titles, descriptions, and field values

### 🔒 Filtering Controls
- **Blacklist Mode**: Match messages everywhere except specified channels/guilds/users
- **Whitelist Mode**: Only match in specific channels/guilds/users
- **Bot Filtering**: Option to ignore bot messages globally or whitelist specific bots
- **Flexible IDs**: Filter by channel IDs, guild IDs, or user IDs

### 📊 Notification System
- **Custom Inbox Tab**: Keyword notifications appear in their own tab in Discord's inbox
- **Message History**: Persistent log of all keyword matches
- **Configurable Limit**: Control how many matches to keep in history
- **Quick Actions**: Clear all notifications with one click

### 🎨 User Interface
- **Highlighting**: Matched keywords are highlighted in message content
- **Preview**: See message previews directly in notification list
- **Easy Management**: Add, remove, and edit keywords with a clean UI
- **Responsive**: Works seamlessly with Discord's UI

### 💾 Data Persistence
- **Local Storage**: All keyword rules and logs stored using Vencord's DataStore
- **Survives Restarts**: Your configuration persists between Discord restarts
- **Export Ready**: Data can be exported if needed

## 🚀 Installation

### Prerequisites
1. **Vencord** or **Equicord** installed on your Discord client
2. Discord Desktop or web app (plugin doesn't work on mobile)

### Installing the Plugin

#### Option 1: Manual Installation
1. Download `index.tsx` and `style.css` from this repository
2. Copy both files to your Vencord plugins folder:
   - **Windows**: `%appdata%\Vencord\plugins\`
   - **Linux/Mac**: `~/.config/Vencord/plugins/`
3. Restart Discord
4. Open Discord Settings → Vencord → Plugins
5. Enable "KeywordNotify"

#### Option 2: From Source
```bash
# Clone the repository
git clone https://github.com/luinbytes/equicord-keywordautoresponder.git

# Copy the files to your Vencord plugins directory
cp equicord-keywordautoresponder/index.tsx ~/.config/Vencord/plugins/
cp equicord-keywordautoresponder/style.css ~/.config/Vencord/plugins/

# Restart Discord
```

## 📖 Usage

### Setting Up Keywords

1. Open Discord Settings → Vencord → Plugins → KeywordNotify
2. Click "Add Keyword Entry"
3. Configure your keyword:
   - **Regex**: Enter the regex pattern to match (e.g., `@me`, `hello.*world`, `https?://example\.com`)
   - **List Type**: Choose Blacklist (match everywhere except) or Whitelist (only match in)
   - **List IDs**: Add channel IDs, guild IDs, or user IDs to filter (one per line)
   - **Ignore Case**: Toggle to make matching case-insensitive
4. Click "Add" to save

### Viewing Notifications

1. Open Discord's inbox (mailbox icon near the bottom)
2. Click on the "Keywords" tab
3. View all keyword matches with message previews
4. Click a notification to jump to the message

### Managing Notifications

- **Clear All**: Click the "Clear All" button to remove all notifications
- **Configurable History**: Adjust "Amount to Keep" in settings (default: 50)
- **Ignore Bots**: Enable "Ignore Bot Messages" to skip bot messages globally

## 🔧 Configuration

### Keyword Entry Options

| Setting | Description |
|---------|-------------|
| **Regex** | Regular expression pattern to search for in messages |
| **List Type** | BlackList (match everywhere except IDs) or Whitelist (only match in IDs) |
| **List IDs** | Comma-separated or line-separated list of channel/guild/user IDs |
| **Ignore Case** | Whether matching should be case-insensitive |

### Plugin Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Amount to Keep** | Number of keyword matches to keep in history | 50 |
| **Ignore Bot Messages** | Skip messages from bots globally | false |

### Finding IDs

To get channel/guild/user IDs:
1. Enable Developer Mode in Discord Settings → Advanced
2. Right-click on a channel, server, or user
3. Copy ID

### Regex Examples

| Pattern | Matches | Case Insensitive |
|---------|---------|------------------|
| `@me` | Exact "@me" | "at me", "@Me", "@ME" |
| `hello.*world` | "hello" followed by anything then "world" | "Hello there, world!" |
| `\b(price|cost)\b` | Word "price" or "cost" | "What's the Price?" |
| `https?://github\.com/[^/]+` | GitHub profile links | "HTTPS://GITHUB.COM/USER" |
| `\berror\b` | Word "error" (not "terror") | "An ERROR occurred" |

## 🏗️ Architecture

### How It Works

1. **Message Interception**: Plugin hooks into Discord's FluxDispatcher
2. **Pattern Matching**: Each message is checked against all keyword entries
3. **Filtering**: Messages are filtered by whitelist/blacklist rules
4. **Notification Creation**: Matched messages are added to notification log
5. **UI Updates**: Custom inbox tab displays notifications with highlighted keywords

### Technical Details

- **Webpack Patching**: Patches Discord's UI to inject custom inbox tab
- **FluxDispatcher Hooks**: Intercepts MESSAGE_CREATE, MESSAGE_UPDATE, LOAD_MESSAGES_SUCCESS
- **DataStore**: Vencord's persistent storage API
- **React Components**: Uses Vencord's React components and hooks

### File Structure

```
equicord-keywordautoresponder/
├── index.tsx          # Main plugin code
├── style.css          # Plugin styles
├── CLAUDE.md          # Developer documentation (for AI assistants)
└── README.md          # This file
```

## 🐛 Troubleshooting

### Plugin Not Showing in Vencord
- Ensure both `index.tsx` and `style.css` are in the plugins folder
- Restart Discord completely (close and reopen)
- Check Vencord console for errors (Ctrl+Shift+I → Console)

### Keywords Not Matching
- Verify regex syntax is correct (use regex101.com to test)
- Check that List Type and List IDs are set correctly
- Ensure "Ignore Bot Messages" isn't blocking matches you want
- Try enabling "Ignore Case" if case might be the issue

### Notifications Not Appearing
- Check that Discord's inbox is enabled
- Click the "Keywords" tab explicitly (doesn't auto-select)
- Verify "Amount to Keep" isn't set to 0
- Check DataStore has data (plugin should persist correctly)

### Invalid Regex Errors
- Plugin catches invalid regex and prevents crashes
- Double-check your regex patterns for syntax errors
- Escape special characters properly (e.g., `\.` instead of `.`)

## 🔒 Privacy

- All data is stored **locally** on your machine
- No data is sent to external servers
- No analytics or tracking
- Keyword rules and logs persist only in your Vencord DataStore

## 💡 Tips & Tricks

1. **Use Specific Patterns**: Avoid overly broad regex that matches too much
2. **Leverage Filters**: Use blacklist to exclude spammy channels
3. **Test Regex First**: Use regex101.com to test patterns before adding
4. **Clean Up Regularly**: Periodically clear old notifications to keep things tidy
5. **Profile Your Needs**: Create multiple keyword entries for different purposes

## 🤝 Contributing

This plugin is open to contributions! Areas for improvement:
- Better regex validation UI
- Sound notifications for keyword matches
- Export/import configuration
- Keyword statistics and analytics
- Mobile support (when available in Vencord)

### Development

See `CLAUDE.md` for detailed development context and architecture documentation.

## 📄 License

This project is licensed under GPL-3.0 - see the LICENSE file for details.

This plugin is built on top of Vencord, which is also GPL-3.0 licensed.

## 🙏 Acknowledgments

- **Vencord/Equicord**: The amazing Discord client mod framework
- **Discord**: For the platform this plugin enhances
- **Community**: For feedback and feature suggestions

## 📧 Support

- **Issues**: [Report bugs or request features](https://github.com/luinbytes/equicord-keywordautoresponder/issues)
- **Discord**: Join the Vencord Discord for community support
- **Documentation**: Check CLAUDE.md for developer documentation

---

Made with 💜 by luinbytes

🌟 Star this repo if you find it useful!
