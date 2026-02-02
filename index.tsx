/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated, camila314, and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Heading, HeadingTertiary } from "@components/Heading";
import { DeleteIcon } from "@components/Icons";
import { EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { findByCodeLazy, findByPropsLazy } from "@webpack";
import { Button, ChannelStore, FluxDispatcher, Select, SelectedChannelStore, TabBar, TextInput, Tooltip, UserStore, useState } from "@webpack/common";
import type { JSX, PropsWithChildren } from "react";

type IconProps = JSX.IntrinsicElements["svg"];
type KeywordEntry = {
    regex: string,
    listIds: Array<string>,
    listType: ListType,
    ignoreCase: boolean,
    enabled: boolean,
    serverId: string | null,  // null = all servers, otherwise specific guild ID
    webhookUrl: string | null,  // optional webhook URL for notifications
    matchCount: number,  // stats: how many times this keyword matched
    lastMatched: number | null  // stats: timestamp of last match (Unix ms)
};

// Stats entry for tracking matches per server/guild
type KeywordStats = {
    keywordId: string,  // unique identifier (index in keywordEntries)
    matchCount: number,
    lastMatched: number | null,
    serverMatches: { [serverId: string]: number },  // matches per server
};

let keywordEntries: Array<KeywordEntry> = [];
let keywordLog: Array<any> = [];
let interceptor: (e: any) => void;

const recentMentionsPopoutClass = findByPropsLazy("recentMentionsPopout");
const tabClass = findByPropsLazy("inboxTitle", "tab");
const buttonClass = findByPropsLazy("size36");
const Popout = findByCodeLazy("getProTip", "canCloseAllMessages:");
const createMessageRecord = findByCodeLazy(".createFromServer(", ".isBlockedForMessage", "messageReference:");
const KEYWORD_ENTRIES_KEY = "KeywordNotify_keywordEntries";
const KEYWORD_LOG_KEY = "KeywordNotify_log";
const KEYWORD_STATS_KEY = "KeywordNotify_stats";  // New: stats tracking

const cl = classNameFactory("vc-keywordnotify-");

// Stats tracking
let keywordStats: { [index: number]: KeywordStats } = {};

async function addKeywordEntry(forceUpdate: () => void) {
    keywordEntries.push({
        regex: "",
        listIds: [],
        listType: ListType.BlackList,
        ignoreCase: false,
        enabled: true,
        serverId: null,  // Default: all servers
        webhookUrl: null,  // Default: no webhook
        matchCount: 0,  // Default: no matches
        lastMatched: null  // Default: never matched
    });
    await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
    forceUpdate();
}

async function removeKeywordEntry(idx: number, forceUpdate: () => void) {
    keywordEntries.splice(idx, 1);
    // Also remove stats for this entry
    delete keywordStats[idx];
    await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
    await DataStore.set(KEYWORD_STATS_KEY, keywordStats);
    forceUpdate();
}

async function duplicateKeywordEntry(idx: number, forceUpdate: () => void) {
    const original = keywordEntries[idx];
    keywordEntries.splice(idx + 1, 0, {
        regex: original.regex,
        listIds: [...original.listIds],
        listType: original.listType,
        ignoreCase: original.ignoreCase,
        enabled: original.enabled,
        serverId: original.serverId,
        webhookUrl: original.webhookUrl,
        matchCount: 0,  // Reset stats for duplicate
        lastMatched: null
    });
    await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
    forceUpdate();
}

// Update keyword match stats
async function updateKeywordStats(entryIndex: number, serverId: string) {
    // Update in-memory stats
    if (!keywordStats[entryIndex]) {
        keywordStats[entryIndex] = {
            keywordId: entryIndex.toString(),
            matchCount: 0,
            lastMatched: null,
            serverMatches: {}
        };
    }

    const stats = keywordStats[entryIndex];
    stats.matchCount++;
    stats.lastMatched = Date.now();

    if (!stats.serverMatches[serverId]) {
        stats.serverMatches[serverId] = 0;
    }
    stats.serverMatches[serverId]++;

    // Update keyword entry stats for display
    keywordEntries[entryIndex].matchCount = stats.matchCount;
    keywordEntries[entryIndex].lastMatched = stats.lastMatched;

    // Persist to DataStore
    await DataStore.set(KEYWORD_STATS_KEY, keywordStats);
}

// Export keyword entries to JSON
function exportKeywordEntries() {
    const data = JSON.stringify(keywordEntries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-entries-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import keyword entries from JSON
function importKeywordEntries(update: () => void) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const imported = JSON.parse(text) as Array<KeywordEntry>;

            // Validate imported data
            if (!Array.isArray(imported)) {
                throw new Error('Invalid format: expected array');
            }

            for (const entry of imported) {
                if (!entry.regex || !entry.listType || !Array.isArray(entry.listIds)) {
                    throw new Error('Invalid entry format');
                }
            }

            // Merge with existing entries
            keywordEntries = [...keywordEntries, ...imported];
            await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
            update();
        } catch (err) {
            alert(`Failed to import keyword entries: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };
    input.click();
}

// Send webhook notification for keyword match
async function sendWebhookNotification(webhookUrl: string, message: Message, matchedKeyword: string, entry: KeywordEntry) {
    if (!webhookUrl) return;

    const channel = ChannelStore.getChannel(message.channel_id);
    const guildName = channel?.guild_id ? ChannelStore.getGuild(channel.guild_id)?.name : "DM";
    const channelName = channel?.name ?? "Unknown Channel";
    const authorName = message.author?.username ?? "Unknown User";
    const timestamp = new Date(message.timestamp).toLocaleString();

    const payload = {
        username: "KeywordNotify",
        avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
        embeds: [{
            title: "🔔 Keyword Match Detected",
            color: 0x00ff00,
            fields: [
                { name: "Keyword", value: `\`${matchedKeyword}\``, inline: true },
                { name: "Server", value: guildName, inline: true },
                { name: "Channel", value: `<#${message.channel_id}>`, inline: true },
                { name: "Author", value: `<@${message.author.id}>`, inline: true },
                { name: "Time", value: timestamp, inline: true },
            ],
            description: message.content?.substring(0, 500) || "*No content*",
            url: `https://discord.com/channels/${channel?.guild_id}/${message.channel_id}/${message.id}`,
            footer: {
                text: `KeywordNotify • Match #${entry.matchCount}`
            }
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`[KeywordNotify] Webhook failed: ${response.status} ${response.statusText}`);
        }
    } catch (err) {
        console.error(`[KeywordNotify] Webhook error:`, err);
    }
}

function safeMatchesRegex(str: string, regex: string, flags: string) {
    try {
        return str.match(new RegExp(regex, flags));
    } catch {
        return false;
    }
}

enum ListType {
    BlackList = "BlackList",
    Whitelist = "Whitelist"
}

interface BaseIconProps extends IconProps {
    viewBox: string;
}

function highlightKeywords(str: string, entries: Array<KeywordEntry>) {
    let regexes: Array<RegExp>;
    try {
        regexes = entries.map(e => new RegExp(e.regex, "g" + (e.ignoreCase ? "i" : "")));
    } catch (err) {
        return [str];
    }

    const matches = regexes.map(r => str.match(r)).flat().filter(e => e != null) as Array<string>;
    if (matches.length === 0) {
        return [str];
    }

    const idx = str.indexOf(matches[0]);

    return [
        <>
            <span>{str.substring(0, idx)}</span>,
            <span className="highlight">{matches[0]}</span>,
            <span>{str.substring(idx + matches[0].length)}</span>
        </>
    ];
}

function Collapsible({ title, children }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <Button
                onClick={() => setIsOpen(!isOpen)}
                look={Button.Looks.FILLED}
                size={Button.Sizes.SMALL}
                className={cl("collapsible")}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{
                        marginLeft: "auto",
                        color: "var(--text-muted)",
                        paddingRight: "5px"
                    }}>{isOpen ? "▼" : "▶"}</div>
                    <HeadingTertiary>{title}</HeadingTertiary>
                </div>
            </Button>
            {isOpen && children}
        </div>
    );
}

function ListedIds({ listIds, setListIds }) {
    const update = useForceUpdater();
    const [values] = useState(listIds);

    async function onChange(e: string, index: number) {
        values[index] = e.trim();
        setListIds(values);
        update();
    }

    const elements = values.map((currentValue: string, index: number) => {
        return (
            <>
                <Flex flexDirection="row" style={{ marginBottom: "5px" }}>
                    <div style={{ flexGrow: 1 }}>
                        <TextInput
                            placeholder="ID"
                            spellCheck={false}
                            value={currentValue}
                            onChange={e => onChange(e, index)}
                        />
                    </div>
                    <Button
                        onClick={() => {
                            values.splice(index, 1);
                            setListIds(values);
                            update();
                        }}
                        look={Button.Looks.FILLED}
                        size={Button.Sizes.SMALL}
                        className={cl("delete")}>
                        <DeleteIcon />
                    </Button>
                </Flex>
            </>
        );
    });

    return (
        <>
            {elements}
        </>
    );
}

function ListTypeSelector({ listType, setListType }: { listType: ListType, setListType: (v: ListType) => void; }) {
    return (
        <Select
            options={[
                { label: "Whitelist", value: ListType.Whitelist },
                { label: "Blacklist", value: ListType.BlackList }
            ]}
            placeholder={"Select a list type"}
            isSelected={v => v === listType}
            closeOnSelect={true}
            select={setListType}
            serialize={v => v}
        />
    );
}

function KeywordEntries() {
    const update = useForceUpdater();
    const [values] = useState(keywordEntries);

    async function setRegex(index: number, value: string) {
        keywordEntries[index].regex = value;
        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        update();
    }

    async function setListType(index: number, value: ListType) {
        keywordEntries[index].listType = value;
        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        update();
    }

    async function setListIds(index: number, value: Array<string>) {
        keywordEntries[index].listIds = value ?? [];
        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        update();
    }

    async function setIgnoreCase(index: number, value: boolean) {
        keywordEntries[index].ignoreCase = value;
        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        update();
    }

    async function setEnabled(index: number, value: boolean) {
        keywordEntries[index].enabled = value;
        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        update();
    }

    async function setServerId(index: number, value: string) {
        keywordEntries[index].serverId = value || null;  // Empty string = null (all servers)
        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        update();
    }

    async function setWebhookUrl(index: number, value: string) {
        keywordEntries[index].webhookUrl = value || null;  // Empty string = null (no webhook)
        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        update();
    }

    // Get list of user's guilds for server selection
    function getGuildList() {
        const guilds = UserStore.getGuilds();
        return Object.values(guilds).map((guild: any) => ({
            label: guild.name,
            value: guild.id
        }));
    }

    const elements = keywordEntries.map((entry, i) => {
        return (
            <>
                <Collapsible title={`Keyword Entry ${i + 1} ${!values[i].enabled ? '(Disabled)' : ''}`}>
                    <Flex flexDirection="row">
                        <div style={{ flexGrow: 1 }}>
                            <TextInput
                                placeholder="example|regex"
                                spellCheck={false}
                                value={values[i].regex}
                                onChange={e => setRegex(i, e)}
                                disabled={!values[i].enabled}
                            />
                        </div>
                        <Button
                            onClick={() => duplicateKeywordEntry(i, update)}
                            look={Button.Looks.FILLED}
                            size={Button.Sizes.SMALL}
                            style={{ marginRight: '4px' }}
                            title="Duplicate Entry">
                            📋
                        </Button>
                        <Button
                            onClick={() => removeKeywordEntry(i, update)}
                            look={Button.Looks.FILLED}
                            size={Button.Sizes.SMALL}
                            className={cl("delete")}>
                            <DeleteIcon />
                        </Button>
                    </Flex>
                    <FormSwitch
                        title="Enabled"
                        className={cl("switch")}
                        value={values[i].enabled}
                        onChange={() => {
                            setEnabled(i, !values[i].enabled);
                        }}
                    />
                    <FormSwitch
                        title="Ignore Case"
                        className={cl("switch")}
                        value={values[i].ignoreCase}
                        disabled={!values[i].enabled}
                        onChange={() => {
                            setIgnoreCase(i, !values[i].ignoreCase);
                        }}
                    />
                    <Heading>Server</Heading>
                    <Flex flexDirection="row" style={{ marginBottom: '8px' }}>
                        <div style={{ flexGrow: 1 }}>
                            <Select
                                options={[
                                    { label: "All Servers", value: "" },
                                    ...getGuildList()
                                ]}
                                placeholder="Select Server"
                                isSelected={v => v === (values[i].serverId ?? "")}
                                closeOnSelect={true}
                                select={v => setServerId(i, v)}
                                serialize={v => v}
                                disabled={!values[i].enabled}
                            />
                        </div>
                    </Flex>
                    <Heading>Webhook Notifications</Heading>
                    <Flex flexDirection="row" style={{ marginBottom: '8px' }}>
                        <div style={{ flexGrow: 1 }}>
                            <TextInput
                                placeholder="https://discord.com/api/webhooks/..."
                                spellCheck={false}
                                value={values[i].webhookUrl ?? ""}
                                onChange={e => setWebhookUrl(i, e)}
                                disabled={!values[i].enabled}
                            />
                        </div>
                    </Flex>
                    <Heading>Stats</Heading>
                    <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '8px' }}>
                        <div style={{ marginBottom: '4px' }}>🎯 Total Matches: <strong>{values[i].matchCount}</strong></div>
                        <div style={{ marginBottom: '4px' }}>📊 Last Matched: <strong>{values[i].lastMatched ? new Date(values[i].lastMatched).toLocaleString() : "Never"}</strong></div>
                    </div>
                    <Heading>Whitelist/Blacklist</Heading>
                    <Flex flexDirection="row">
                        <div style={{ flexGrow: 1 }}>
                            <ListedIds listIds={values[i].listIds} setListIds={e => setListIds(i, e)} />
                        </div>
                    </Flex>
                    <div className={[Margins.top8, Margins.bottom8].join(" ")} />
                    <Flex flexDirection="row">
                        <Button onClick={() => {
                            values[i].listIds.push("");
                            update();
                        }}>Add ID</Button>
                        <div style={{ flexGrow: 1 }}>
                            <ListTypeSelector listType={values[i].listType} setListType={e => setListType(i, e)} />
                        </div>
                    </Flex>
                </Collapsible>
            </>
        );
    });

    return (
        <>
            {elements}
            <div><Button onClick={() => addKeywordEntry(update)}>Add Keyword Entry</Button></div>
            <div style={{ marginTop: '8px' }}>
                <Flex flexDirection="row" style={{ gap: '8px' }}>
                    <Button onClick={exportKeywordEntries} look={Button.Looks.OUTLINED}>
                        Export Keywords
                    </Button>
                    <Button onClick={() => importKeywordEntries(update)} look={Button.Looks.OUTLINED}>
                        Import Keywords
                    </Button>
                    <Button onClick={() => {
                        if (keywordEntries.length === 0 || confirm('Clear all keyword entries?')) {
                            keywordEntries = [];
                            DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
                            update();
                        }
                    }} look={Button.Looks.OUTLINED} color={Button.Colors.RED}>
                        Clear All
                    </Button>
                </Flex>
            </div>
        </>
    );
}

function Icon({ height = 24, width = 24, className, children, viewBox, ...svgProps }: PropsWithChildren<BaseIconProps>) {
    return (
        <svg
            className={classes(className, "vc-icon")}
            role="img"
            width={width}
            height={height}
            viewBox={viewBox}
            {...svgProps}
        >
            {children}
        </svg>
    );
}

// Ideally I would just add this to Icons.tsx, but I cannot as this is a user-plugin :/
function DoubleCheckmarkIcon(props: IconProps) {
    // noinspection TypeScriptValidateTypes
    return (
        <Icon
            {...props}
            className={classes(props.className, "vc-double-checkmark-icon")}
            viewBox="0 0 24 24"
            width={16}
            height={16}
        >
            <path fill="currentColor"
                d="M16.7 8.7a1 1 0 0 0-1.4-1.4l-3.26 3.24a1 1 0 0 0 1.42 1.42L16.7 8.7ZM3.7 11.3a1 1 0 0 0-1.4 1.4l4.5 4.5a1 1 0 0 0 1.4-1.4l-4.5-4.5Z"
            />
            <path fill="currentColor"
                d="M21.7 9.7a1 1 0 0 0-1.4-1.4L13 15.58l-3.3-3.3a1 1 0 0 0-1.4 1.42l4 4a1 1 0 0 0 1.4 0l8-8Z"
            />
        </Icon>
    );
}

const settings = definePluginSettings({
    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "Ignore messages from bots",
        default: true
    },
    amountToKeep: {
        type: OptionType.NUMBER,
        description: "Amount of messages to keep in the log",
        default: 50
    },
    keywords: {
        type: OptionType.COMPONENT,
        description: "Manage keywords",
        component: () => <KeywordEntries />
    }
});

export default definePlugin({
    name: "KeywordNotify",
    authors: [EquicordDevs.camila314, EquicordDevs.x3rt],
    description: "Sends a notification if a given message matches certain keywords or regexes",
    settings,
    patches: [
        {
            find: "#{intl::UNREADS_TAB_LABEL})}",
            replacement: [
                {
                    match: /,(\i\?\(0,\i\.jsxs?\)\(\i\.\i\i\.Item)/,
                    replace: ",$self.keywordTabBar()$&"
                },
                {
                    match: /:(\i)===\i\.\i\.MENTIONS\?/,
                    replace: ": $1 === 8 ? $self.keywordClearButton() $&"
                }
            ]
        },
        {
            find: ".MENTIONS)});",
            replacement: {
                match: /:(\i)===\i\.\i\.MENTIONS\?\(0,.+?onJump:(\i)}\)/,
                replace: ": $1 === 8 ? $self.tryKeywordMenu($2) $&"
            }
        },
        {
            find: ".guildFilter:null",
            replacement: [
                {
                    match: /function (\i)\(\i\){let{message:\i,gotoMessage/,
                    replace: "$self.renderMsg = $1; $&"
                },
                {
                    match: /onClick:\(\)=>(\i\.\i\.deleteRecentMention\((\i)\.id\))/,
                    replace: "onClick: () => $2._keyword ? $self.deleteKeyword($2.id) : $1"
                }
            ]
        },
    ],

    async start() {
        this.onUpdate = () => null;
        keywordEntries = await DataStore.get(KEYWORD_ENTRIES_KEY) ?? [];
        keywordStats = await DataStore.get(KEYWORD_STATS_KEY) ?? {};

        // Migrate old entries (add new fields if missing)
        for (let i = 0; i < keywordEntries.length; i++) {
            if (keywordEntries[i].serverId === undefined) {
                keywordEntries[i].serverId = null;
            }
            if (keywordEntries[i].webhookUrl === undefined) {
                keywordEntries[i].webhookUrl = null;
            }
            if (keywordEntries[i].matchCount === undefined) {
                keywordEntries[i].matchCount = keywordStats[i]?.matchCount ?? 0;
            }
            if (keywordEntries[i].lastMatched === undefined) {
                keywordEntries[i].lastMatched = keywordStats[i]?.lastMatched ?? null;
            }
        }

        await DataStore.set(KEYWORD_ENTRIES_KEY, keywordEntries);
        await DataStore.set(KEYWORD_STATS_KEY, keywordStats);
        (await DataStore.get(KEYWORD_LOG_KEY) ?? []).map(e => JSON.parse(e)).forEach(e => {
            try {
                this.addToLog(e);
            } catch (err) {
                console.error(err);
            }
        });

        interceptor = (e: any) => {
            return this.modify(e);
        };
        FluxDispatcher.addInterceptor(interceptor);
    },

    stop() {
        const index = FluxDispatcher._interceptors.indexOf(interceptor);
        if (index > -1) {
            FluxDispatcher._interceptors.splice(index, 1);
        }
    },

    applyKeywordEntries(m: Message) {
        let matches = false;
        let matchedEntryIndex = -1;  // Track which entry matched

        // Get message server ID
        const channel = ChannelStore.getChannel(m.channel_id);
        const messageServerId = channel?.guild_id ?? null;

        for (let idx = 0; idx < keywordEntries.length; idx++) {
            const entry = keywordEntries[idx];
            if (entry.regex === "") {
                continue;
            }

            if (!entry.enabled) {
                continue;
            }

            // Server filtering
            if (entry.serverId !== null && entry.serverId !== messageServerId) {
                continue;  // Skip if server doesn't match
            }

            let listed = entry.listIds.some(id => id.trim() === m.channel_id || id === m.author.id);
            if (!listed) {
                if (channel != null) {
                    listed = entry.listIds.some(id => id.trim() === channel.guild_id);
                }
            }

            const whitelistMode = entry.listType === ListType.Whitelist;

            if (!whitelistMode && listed) {
                continue;
            }
            if (whitelistMode && !listed) {
                continue;
            }

            if (settings.store.ignoreBots && m.author.bot && (!whitelistMode || !entry.listIds.includes(m.author.id))) {
                continue;
            }

            const flags = entry.ignoreCase ? "i" : "";
            if (safeMatchesRegex(m.content, entry.regex, flags)) {
                matches = true;
                matchedEntryIndex = idx;
            } else {
                for (const embed of m.embeds as any) {
                    if (safeMatchesRegex(embed.description, entry.regex, flags) || safeMatchesRegex(embed.title, entry.regex, flags)) {
                        matches = true;
                        matchedEntryIndex = idx;
                        break;
                    } else if (embed.fields != null) {
                        for (const field of embed.fields as Array<{ name: string, value: string; }>) {
                            if (safeMatchesRegex(field.value, entry.regex, flags) || safeMatchesRegex(field.name, entry.regex, flags)) {
                                matches = true;
                                matchedEntryIndex = idx;
                                break;
                            }
                        }
                    }
                }
            }

            if (matches) break;  // Stop after first match
        }

        if (matches && matchedEntryIndex >= 0) {
            const id = UserStore.getCurrentUser()?.id;
            if (id !== null) {
                // @ts-ignore
                m.mentions.push({ id: id });
            }

            if (m.author.id !== id) {
                const entry = keywordEntries[matchedEntryIndex];
                const serverId = channel?.guild_id ?? "unknown";

                // Track stats
                updateKeywordStats(matchedEntryIndex, serverId);

                // Send webhook notification if configured
                if (entry.webhookUrl) {
                    sendWebhookNotification(entry.webhookUrl, m, entry.regex, entry);
                }

                this.storeMessage(m);
                this.addToLog(m);
            }
        }
    },
    storeMessage(m: Message) {
        if (m == null)
            return;

        DataStore.get(KEYWORD_LOG_KEY).then(log => {
            log = log ? log.map((e: string) => JSON.parse(e)) : [];

            log.push(m);
            if (log.length > settings.store.amountToKeep) {
                log = log.slice(-settings.store.amountToKeep);
            }

            DataStore.set(KEYWORD_LOG_KEY, log.map(e => JSON.stringify(e)));
        });
    },
    addToLog(m: Message) {
        if (m == null || keywordLog.some(e => e.id === m.id))
            return;

        let messageRecord: any;
        try {
            messageRecord = createMessageRecord(m);
        } catch (err) {
            return;
        }

        keywordLog.push(messageRecord);
        keywordLog.sort((a, b) => b.timestamp - a.timestamp);

        while (keywordLog.length > settings.store.amountToKeep) {
            keywordLog.pop();
        }

        this.onUpdate();
    },

    deleteKeyword(id) {
        keywordLog = keywordLog.filter(e => e.id !== id);
        this.onUpdate();
    },

    keywordTabBar() {
        return (
            <TabBar.Item className={classes(tabClass.tab, tabClass.expanded)} id={8}>
                Keywords
            </TabBar.Item>
        );
    },

    keywordClearButton() {
        return (
            <Tooltip text="Clear All">
                {({ onMouseLeave, onMouseEnter }) => (
                    <div
                        className={classes(tabClass.controlButton, buttonClass.button, buttonClass.tertiary, buttonClass.size32)}
                        onMouseLeave={onMouseLeave}
                        onMouseEnter={onMouseEnter}
                        onClick={() => {
                            keywordLog = [];
                            DataStore.set(KEYWORD_LOG_KEY, []);
                            this.onUpdate();
                        }}>
                        <DoubleCheckmarkIcon />
                    </div>
                )}
            </Tooltip>
        );
    },

    tryKeywordMenu(onJump) {
        const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());

        const [tempLogs, setKeywordLog] = useState(keywordLog);
        this.onUpdate = () => {
            const newLog = Array.from(keywordLog);
            setKeywordLog(newLog);
        };

        const messageRender = (e, t) => {
            e._keyword = true;

            e.customRenderedContent = {
                content: highlightKeywords(e.content, keywordEntries)
            };

            const msg = this.renderMsg({
                message: e,
                gotoMessage: t,
                dismissible: true
            });

            return [msg];
        };

        return (
            <>
                <Popout
                    className={classes(recentMentionsPopoutClass.recentMentionsPopout)}
                    renderHeader={() => null}
                    renderMessage={messageRender}
                    channel={channel}
                    onJump={onJump}
                    onFetch={() => null}
                    onCloseMessage={this.deleteKeyword}
                    loadMore={() => null}
                    messages={tempLogs}
                    renderEmptyState={() => null}
                    canCloseAllMessages={true}
                />
            </>
        );
    },

    modify(e) {
        if (e.type === "MESSAGE_CREATE" || e.type === "MESSAGE_UPDATE") {
            this.applyKeywordEntries(e.message);
        } else if (e.type === "LOAD_MESSAGES_SUCCESS") {
            for (let msg = 0; msg < e.messages.length; ++msg) {
                this.applyKeywordEntries(e.messages[msg]);
            }
        }
    }
});
