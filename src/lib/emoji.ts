const CUSTOM_EMOJI_REGEX = /^<?(a)?:?(\w{2,32}):(\d{17,20})>?$/;

export interface ParsedCustomEmoji {
    custom: true;
    animated: boolean;
    name: string;
    id: string;
}

export interface ParsedUnicodeEmoji {
    custom: false;
    unicode: string;
}

export type ParsedEmoji = ParsedCustomEmoji | ParsedUnicodeEmoji;

export function parseConfigEmoji(input: string): ParsedEmoji {
    const match = CUSTOM_EMOJI_REGEX.exec(input.trim());
    if (match) {
        return { custom: true, animated: Boolean(match[1]), name: match[2], id: match[3] };
    }
    return { custom: false, unicode: input.trim() };
}

export function emojiForReact(input: string): string {
    const parsed = parseConfigEmoji(input);
    return parsed.custom ? `${parsed.name}:${parsed.id}` : parsed.unicode;
}

export function emojiForDisplay(input: string): string {
    const parsed = parseConfigEmoji(input);
    return parsed.custom ? `<${parsed.animated ? "a" : ""}:${parsed.name}:${parsed.id}>` : parsed.unicode;
}

export function emojiMatches(configEmoji: string, reaction: { id: string | null; name: string | null }): boolean {
    const parsed = parseConfigEmoji(configEmoji);
    if (parsed.custom) return reaction.id === parsed.id;
    return reaction.name === parsed.unicode;
}
