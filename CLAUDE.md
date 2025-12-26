# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Vencord/Equicord Discord client plugin** called "KeywordNotify". It's a single-file plugin that monitors Discord messages for user-defined keywords/regexes and sends notifications when matches are found.

**Important**: This is a standalone plugin file that gets loaded into the Vencord/Equicord plugin system. It is not a standalone application and has no build/test commands of its own.

## Architecture

### Plugin Structure
- **Single-file architecture**: All code lives in `index.tsx` with styles in `style.css`
- **No build system**: This plugin is loaded directly into Vencord/Equicord as-is
- **Vencord plugin API**: Uses `definePlugin`, `definePluginSettings`, and Vencord's webpack patching system

### Core Components

**Data Flow**:
1. FluxDispatcher interceptor catches all Discord messages (`MESSAGE_CREATE`, `MESSAGE_UPDATE`, `LOAD_MESSAGES_SUCCESS`)
2. `applyKeywordEntries()` matches messages against user-defined keyword entries
3. Matched messages are added to both in-memory log (`keywordLog`) and persistent storage (`DataStore`)
4. UI updates via React hooks (`useForceUpdater`) when log changes

**Key Data Structures**:
- `KeywordEntry`: Contains regex pattern, whitelist/blacklist IDs, list type, and case sensitivity
- `keywordLog`: In-memory array of matched messages (limited by `amountToKeep` setting)
- `keywordEntries`: Array of keyword rules loaded from DataStore

**Webpack Patching**: The plugin patches Discord's UI to inject:
- Custom "Keywords" tab in the inbox menu
- Clear all button for keyword notifications
- Custom message rendering with highlighted keywords

### State Management
- **DataStore keys**: `KeywordNotify_keywordEntries` (rules), `KeywordNotify_log` (message history)
- **React state**: Components use `useState` + `useForceUpdater()` for reactive UI
- **Global state**: `keywordEntries` and `keywordLog` arrays maintained at module level

### Message Matching Logic
Located in `applyKeywordEntries()` (index.tsx:387-448):
- Supports regex patterns with optional case-insensitive matching
- Whitelist mode: only match in specified channels/guilds/users
- Blacklist mode: match everywhere except specified channels/guilds/users
- Searches message content, embed titles, descriptions, and field values
- Bot messages can be ignored globally or whitelisted individually

## Development Context

### Vencord Plugin API Usage
- `@api/DataStore`: Persistent storage for settings and message logs
- `@api/Settings`: Plugin settings UI framework
- `@webpack`: Dynamic module finding utilities (`findByPropsLazy`, `findByCodeLazy`)
- `@webpack/common`: React components (Button, TextInput, Select, etc.)
- Patches use find-replace regex matching on webpack module code

### React Patterns
- Functional components with hooks throughout
- `useForceUpdater()`: Custom hook for triggering re-renders after imperative updates
- Async state updates: All DataStore writes are async, state updates follow immediately

### Styling
- BEM-like class naming via `classNameFactory("vc-keywordnotify-")`
- CSS custom properties for theming (e.g., `var(--text-muted)`, `var(--status-danger)`)
- Classes defined in `style.css` with `.vc-keywordnotify-` prefix

## Important Constraints

1. **No standalone execution**: This plugin only works when loaded into Vencord/Equicord
2. **No package.json**: This is intentional - not a standalone npm package
3. **Webpack patching fragility**: The `patches` array depends on Discord's internal code structure and may break with Discord updates
4. **DataStore is async**: All reads/writes to DataStore must use async/await
5. **Message record creation can fail**: `createMessageRecord()` is wrapped in try-catch because Discord's internal API may throw

## Code Modification Guidelines

When modifying this plugin:
- Maintain the single-file structure (index.tsx + style.css)
- Keep DataStore operations async with proper error handling
- Update both in-memory state and DataStore when persisting data
- Follow the existing React patterns (functional components, hooks)
- Test regex patterns with `safeMatchesRegex()` to catch invalid regexes
- Preserve the class name prefix convention for styling
