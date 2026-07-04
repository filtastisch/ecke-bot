import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export interface ReactionRoleOption {
    emoji: string;
    roleId: string;
    label: string;
}

export interface ReactionRolePanel {
    title: string;
    description: string;
    color?: number;
    options: ReactionRoleOption[];
}

export interface BotConfig {
    prefix: string;
    guildId: string;
    channels: {
        welcome: string;
        modLog: string;
        memberLog: string;
        messageLog: string;
        music: string;
        autoBan: string;
    };
    roles: {
        visitor: string;
        moderator: string[];
        admin: string[];
    };
    reactionRoles: {
        games: ReactionRolePanel;
        colors: ReactionRolePanel;
    };
    music: {
        defaultVolume: number;
        maxQueueSize: number;
    };
    moderation: {
        maxWarns: number;
        muteRoleId: string;
        autoBanEnabled: boolean;
    };
    features: {
        joinRole: boolean;
        welcomeMessage: boolean;
        memberLog: boolean;
        modLog: boolean;
        autoMod: boolean;
    };
    messages: {
        welcome: string;
        leave: string;
    };
}

export interface SetupReference {
    channelId: string;
    messageId: string;
}

export interface BotData {
    reactionRoles: {
        games?: SetupReference;
        colors?: SetupReference;
    };
    music?: SetupReference;
}

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const CONFIG_PATH = process.env.CONFIG_PATH || join(process.cwd(), "config.json");
const DATA_PATH = join(DATA_DIR, "data.json");

function loadConfig(): BotConfig {
    if (!existsSync(CONFIG_PATH)) {
        throw new Error(`config.json nicht gefunden unter ${CONFIG_PATH}. Kopiere config.example.json und passe sie an.`);
    }
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as BotConfig;
}

export const config: BotConfig = loadConfig();

const PLACEHOLDER_VALUES = new Set(["DEINE_GUILD_ID", "CHANNEL_ID", "ROLE_ID", ""]);

export function isConfigured(value: string | undefined | null): value is string {
    return typeof value === "string" && !PLACEHOLDER_VALUES.has(value);
}

export function validateConfig(): string[] {
    const warnings: string[] = [];
    if (!isConfigured(config.guildId)) warnings.push("guildId ist nicht gesetzt.");
    if (config.features.joinRole && !isConfigured(config.roles.visitor)) {
        warnings.push("features.joinRole ist aktiv, aber roles.visitor ist nicht gesetzt.");
    }
    if (config.features.welcomeMessage && !isConfigured(config.channels.welcome)) {
        warnings.push("features.welcomeMessage ist aktiv, aber channels.welcome ist nicht gesetzt.");
    }
    if (config.moderation.autoBanEnabled && !isConfigured(config.channels.autoBan)) {
        warnings.push("moderation.autoBanEnabled ist aktiv, aber channels.autoBan ist nicht gesetzt.");
    }
    return warnings;
}

let data: BotData = loadData();

function loadData(): BotData {
    if (!existsSync(DATA_PATH)) {
        return { reactionRoles: {} };
    }
    try {
        const raw = readFileSync(DATA_PATH, "utf-8");
        const parsed = JSON.parse(raw) as BotData;
        if (!parsed.reactionRoles) parsed.reactionRoles = {};
        return parsed;
    } catch {
        return { reactionRoles: {} };
    }
}

export function getData(): BotData {
    return data;
}

export function saveData(next: BotData): void {
    data = next;
    mkdirSync(dirname(DATA_PATH), { recursive: true });
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function setReactionRoleReference(panel: "games" | "colors", ref: SetupReference): void {
    data.reactionRoles[panel] = ref;
    saveData(data);
}

export function setMusicReference(ref: SetupReference): void {
    data.music = ref;
    saveData(data);
}
