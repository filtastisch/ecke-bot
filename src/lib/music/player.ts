import {
    AudioPlayer,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType,
    VoiceConnection,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel
} from "@discordjs/voice";
import { container } from "@sapphire/framework";
import type { ChildProcess } from "node:child_process";
import type { Guild, VoiceBasedChannel } from "discord.js";
import { config } from "../config";
import { updateMusicPanel } from "./panel";
import { Queue, type Track } from "./queue";
import { spawnAudioStream } from "./stream";

export class GuildPlayer {
    public readonly guild: Guild;
    public readonly queue = new Queue();
    public current: Track | null = null;
    public voiceChannelId: string | null = null;

    private connection: VoiceConnection | null = null;
    private readonly player: AudioPlayer;
    private currentProcess: ChildProcess | null = null;
    private destroyed = false;

    public constructor(guild: Guild) {
        this.guild = guild;
        this.player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

        this.player.on(AudioPlayerStatus.Idle, () => {
            void this.playNext();
        });
        this.player.on("error", (error) => {
            container.logger.error(`[music] Player-Fehler in ${this.guild.id}:`, error.message);
            void this.playNext();
        });
    }

    public get paused(): boolean {
        return this.player.state.status === AudioPlayerStatus.Paused;
    }

    public get playing(): boolean {
        return this.player.state.status === AudioPlayerStatus.Playing || this.player.state.status === AudioPlayerStatus.Buffering;
    }

    public connect(channel: VoiceBasedChannel): void {
        this.voiceChannelId = channel.id;
        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator
        });
        this.connection.subscribe(this.player);

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000)
                ]);
            } catch {
                this.destroy();
            }
        });
    }

    public async addTracks(tracks: Track[], channel: VoiceBasedChannel): Promise<void> {
        if (!this.connection) this.connect(channel);
        this.queue.addMany(tracks);
        if (!this.current) await this.playNext();
        else await updateMusicPanel(this.guild);
    }

    private async playNext(): Promise<void> {
        if (this.destroyed) return;
        if (this.current) this.queue.pushHistory(this.current);

        const next = this.queue.next();
        if (!next) {
            this.current = null;
            await updateMusicPanel(this.guild);
            return;
        }

        await this.startTrack(next);
    }

    private async startTrack(track: Track): Promise<void> {
        try {
            this.killProcess();

            const audio = spawnAudioStream(track.url);
            this.currentProcess = audio.process;

            audio.process.on("error", (error) => {
                container.logger.error(`[music] yt-dlp-Prozessfehler (${track.url}):`, error.message);
            });
            audio.stream.on("error", (error) => {
                container.logger.error(`[music] Stream-Fehler (${track.url}):`, error.message);
            });

            const resource = createAudioResource(audio.stream, { inputType: StreamType.Arbitrary, inlineVolume: true });
            resource.volume?.setVolume(config.music.defaultVolume / 100);
            this.current = track;
            this.player.play(resource);
            await updateMusicPanel(this.guild);
        } catch (error) {
            container.logger.error(`[music] Konnte Track nicht abspielen (${track.url}):`, (error as Error).message);
            await this.playNext();
        }
    }

    private killProcess(): void {
        if (this.currentProcess) {
            this.currentProcess.removeAllListeners();
            this.currentProcess.kill("SIGKILL");
            this.currentProcess = null;
        }
    }

    public async skip(): Promise<void> {
        if (!this.current) return;
        this.player.stop(true);
    }

    public async previous(): Promise<boolean> {
        const last = this.queue.history.pop();
        if (!last) return false;
        if (this.current) this.queue.tracks.unshift(this.current);
        await this.startTrack(last);
        return true;
    }

    public togglePause(): boolean {
        if (this.paused) {
            this.player.unpause();
            return false;
        }
        this.player.pause();
        return true;
    }

    public toggleShuffle(): boolean {
        this.queue.shuffle = !this.queue.shuffle;
        return this.queue.shuffle;
    }

    public destroy(): void {
        this.destroyed = true;
        this.queue.clear();
        this.current = null;
        this.killProcess();
        this.player.stop(true);
        this.connection?.destroy();
        this.connection = null;
        players.delete(this.guild.id);
        void updateMusicPanel(this.guild);
    }
}

const players = new Map<string, GuildPlayer>();

export function getPlayer(guildId: string): GuildPlayer | undefined {
    return players.get(guildId);
}

export function getOrCreatePlayer(guild: Guild): GuildPlayer {
    let player = players.get(guild.id);
    if (!player) {
        player = new GuildPlayer(guild);
        players.set(guild.id, player);
    }
    return player;
}
