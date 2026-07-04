import { PermissionFlagsBits, type GuildMember } from "discord.js";
import { config, isConfigured } from "./config";

export function isAdmin(member: GuildMember): boolean {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    return config.roles.admin.some((roleId) => isConfigured(roleId) && member.roles.cache.has(roleId));
}

export function isModerator(member: GuildMember): boolean {
    if (isAdmin(member)) return true;
    return config.roles.moderator.some((roleId) => isConfigured(roleId) && member.roles.cache.has(roleId));
}
