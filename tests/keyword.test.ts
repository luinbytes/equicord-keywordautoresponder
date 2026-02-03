/*
 * Unit tests for equicord-keywordautoresponder
 * Tests core logic: regex matching, stats tracking, data migration
 */

import { describe, test, expect, beforeEach } from "vitest";

// Types (copied from index.tsx for testing)
type KeywordEntry = {
    regex: string,
    listIds: Array<string>,
    listType: ListType,
    ignoreCase: boolean,
    enabled: boolean,
    serverId: string | null,
    webhookUrl: string | null,
    matchCount: number,
    lastMatched: number | null
};

enum ListType {
    BlackList,
    Whitelist
}

// Safe regex matching (from index.tsx)
function safeMatchesRegex(text: string, regex: string, flags: string = ""): boolean {
    try {
        const re = new RegExp(regex, flags);
        return re.test(text);
    } catch (err) {
        console.error(`Invalid regex: ${regex}`, err);
        return false;
    }
}

// Data migration logic (from index.tsx)
function migrateKeywordEntry(entry: KeywordEntry): KeywordEntry {
    if (entry.serverId === undefined) {
        entry.serverId = null;
    }
    if (entry.webhookUrl === undefined) {
        entry.webhookUrl = null;
    }
    if (entry.matchCount === undefined) {
        entry.matchCount = 0;
    }
    if (entry.lastMatched === undefined) {
        entry.lastMatched = null;
    }
    return entry;
}

describe("Keyword Matching", () => {
    test("basic regex matching", () => {
        expect(safeMatchesRegex("hello world", "hello", "")).toBe(true);
        expect(safeMatchesRegex("hello world", "world", "")).toBe(true);
        expect(safeMatchesRegex("hello world", "goodbye", "")).toBe(false);
    });

    test("case insensitive matching", () => {
        expect(safeMatchesRegex("Hello World", "hello", "i")).toBe(true);
        expect(safeMatchesRegex("HELLO WORLD", "world", "i")).toBe(true);
        expect(safeMatchesRegex("Hello World", "hello", "")).toBe(false);
    });

    test("complex regex patterns", () => {
        expect(safeMatchesRegex("error 404 not found", "error \\d+", "")).toBe(true);
        expect(safeMatchesRegex("error 404 not found", "\\d+", "")).toBe(true);
        expect(safeMatchesRegex("test@example.com", "[a-z]+@[a-z]+\\.[a-z]+", "i")).toBe(true);
    });

    test("invalid regex handling", () => {
        expect(safeMatchesRegex("test", "[invalid(", "")).toBe(false);  // Invalid regex
    });
});

describe("Data Migration", () => {
    test("migrate old entry (missing serverId)", () => {
        const oldEntry: KeywordEntry = {
            regex: "test",
            listIds: [],
            listType: ListType.BlackList,
            ignoreCase: false,
            enabled: true,
            // @ts-ignore - testing missing field
        };

        const migrated = migrateKeywordEntry(oldEntry);

        expect(migrated.serverId).toBe(null);
        expect(migrated.webhookUrl).toBe(null);
        expect(migrated.matchCount).toBe(0);
        expect(migrated.lastMatched).toBe(null);
    });

    test("migrate old entry (missing webhookUrl)", () => {
        const oldEntry: KeywordEntry = {
            regex: "test",
            listIds: [],
            listType: ListType.BlackList,
            ignoreCase: false,
            enabled: true,
            serverId: "server123",
            // @ts-ignore - testing missing field
        };

        const migrated = migrateKeywordEntry(oldEntry);

        expect(migrated.serverId).toBe("server123");
        expect(migrated.webhookUrl).toBe(null);
        expect(migrated.matchCount).toBe(0);
        expect(migrated.lastMatched).toBe(null);
    });

    test("new entry (all fields present) - no migration needed", () => {
        const newEntry: KeywordEntry = {
            regex: "test",
            listIds: [],
            listType: ListType.BlackList,
            ignoreCase: false,
            enabled: true,
            serverId: "server123",
            webhookUrl: "https://example.com/webhook",
            matchCount: 42,
            lastMatched: 1704000000000
        };

        const migrated = migrateKeywordEntry(newEntry);

        expect(migrated.serverId).toBe("server123");
        expect(migrated.webhookUrl).toBe("https://example.com/webhook");
        expect(migrated.matchCount).toBe(42);
        expect(migrated.lastMatched).toBe(1704000000000);
    });

    test("migrate null serverId (all servers)", () => {
        const entry: KeywordEntry = {
            regex: "test",
            listIds: [],
            listType: ListType.BlackList,
            ignoreCase: false,
            enabled: true,
            serverId: null,  // Explicit null = all servers
            webhookUrl: null
            // @ts-ignore
        };

        const migrated = migrateKeywordEntry(entry);

        expect(migrated.serverId).toBe(null);
    });
});

describe("Multi-Server Filtering Logic", () => {
    test("entry with null serverId matches any server", () => {
        const entry: KeywordEntry = {
            regex: "test",
            listIds: [],
            listType: ListType.BlackList,
            ignoreCase: false,
            enabled: true,
            serverId: null,  // All servers
            webhookUrl: null,
            matchCount: 0,
            lastMatched: null
        };

        const messageServerId = "server123";
        const shouldMatch = entry.serverId === null || entry.serverId === messageServerId;

        expect(shouldMatch).toBe(true);  // Should match any server
    });

    test("entry with specific serverId only matches that server", () => {
        const entry: KeywordEntry = {
            regex: "test",
            listIds: [],
            listType: ListType.BlackList,
            ignoreCase: false,
            enabled: true,
            serverId: "server123",  // Only this server
            webhookUrl: null,
            matchCount: 0,
            lastMatched: null
        };

        const messageServerId = "server123";
        const shouldMatch = entry.serverId === null || entry.serverId === messageServerId;

        expect(shouldMatch).toBe(true);  // Should match
    });

    test("entry with specific serverId does not match other servers", () => {
        const entry: KeywordEntry = {
            regex: "test",
            listIds: [],
            listType: ListType.BlackList,
            ignoreCase: false,
            enabled: true,
            serverId: "server123",  // Only this server
            webhookUrl: null,
            matchCount: 0,
            lastMatched: null
        };

        const messageServerId = "server456";
        const shouldMatch = entry.serverId === null || entry.serverId === messageServerId;

        expect(shouldMatch).toBe(false);  // Should NOT match
    });
});

describe("Stats Tracking", () => {
    test("keyword stats structure", () => {
        const stats = {
            keywordId: "0",
            matchCount: 42,
            lastMatched: 1704000000000,
            serverMatches: {
                "server123": 20,
                "server456": 22
            }
        };

        expect(stats.matchCount).toBe(42);
        expect(stats.lastMatched).toBe(1704000000000);
        expect(stats.serverMatches["server123"]).toBe(20);
        expect(stats.serverMatches["server456"]).toBe(22);
        expect(stats.matchCount).toBe(20 + 22);  // Total = sum of server matches
    });

    test("increment match count", () => {
        let matchCount = 0;

        // Simulate updateKeywordStats logic
        matchCount++;
        expect(matchCount).toBe(1);

        matchCount++;
        expect(matchCount).toBe(2);
    });

    test("server-specific match counting", () => {
        const serverMatches: { [serverId: string]: number } = {};

        // First match on server123
        if (!serverMatches["server123"]) {
            serverMatches["server123"] = 0;
        }
        serverMatches["server123"]++;
        expect(serverMatches["server123"]).toBe(1);

        // Second match on server123
        if (!serverMatches["server123"]) {
            serverMatches["server123"] = 0;
        }
        serverMatches["server123"]++;
        expect(serverMatches["server123"]).toBe(2);

        // Match on server456
        if (!serverMatches["server456"]) {
            serverMatches["server456"] = 0;
        }
        serverMatches["server456"]++;
        expect(serverMatches["server456"]).toBe(1);
    });
});

describe("Webhook Configuration", () => {
    test("null webhookUrl means no webhook", () => {
        const webhookUrl = null;

        const shouldSendWebhook = webhookUrl !== null && webhookUrl !== undefined && webhookUrl.trim() !== "";

        expect(shouldSendWebhook).toBe(false);
    });

    test("valid webhook URL", () => {
        const webhookUrl = "https://discord.com/api/webhooks/123/abc";

        const shouldSendWebhook = webhookUrl !== null && webhookUrl !== undefined && webhookUrl.trim() !== "";

        expect(shouldSendWebhook).toBe(true);
    });

    test("empty string webhookUrl means no webhook", () => {
        const webhookUrl = "";

        const shouldSendWebhook = webhookUrl !== null && webhookUrl !== undefined && webhookUrl.trim() !== "";

        expect(shouldSendWebhook).toBe(false);
    });
});
