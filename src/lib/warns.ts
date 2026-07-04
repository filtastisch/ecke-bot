import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface WarnEntry {
    id: string;
    moderatorId: string;
    reason: string;
    timestamp: number;
}

type WarnStore = Record<string, WarnEntry[]>;

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
const WARNS_PATH = join(DATA_DIR, "warns.json");

function loadStore(): WarnStore {
    if (!existsSync(WARNS_PATH)) return {};
    try {
        return JSON.parse(readFileSync(WARNS_PATH, "utf-8")) as WarnStore;
    } catch {
        return {};
    }
}

function saveStore(store: WarnStore): void {
    mkdirSync(dirname(WARNS_PATH), { recursive: true });
    writeFileSync(WARNS_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function addWarn(userId: string, moderatorId: string, reason: string): WarnEntry {
    const store = loadStore();
    const entry: WarnEntry = {
        id: Date.now().toString(36),
        moderatorId,
        reason,
        timestamp: Date.now()
    };
    store[userId] = [...(store[userId] ?? []), entry];
    saveStore(store);
    return entry;
}

export function getWarns(userId: string): WarnEntry[] {
    return loadStore()[userId] ?? [];
}

export function clearWarns(userId: string): number {
    const store = loadStore();
    const count = store[userId]?.length ?? 0;
    delete store[userId];
    saveStore(store);
    return count;
}
