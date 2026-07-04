import play, { type YouTubeVideo } from "play-dl";
import { config } from "../config";
import type { Track } from "./queue";

function toTrack(video: YouTubeVideo, requestedBy: string): Track {
    return {
        title: video.title ?? "Unbekannter Titel",
        url: video.url,
        durationSec: video.durationInSec,
        durationRaw: video.durationRaw || formatSeconds(video.durationInSec),
        author: video.channel?.name ?? "Unbekannt",
        thumbnail: video.thumbnails[0]?.url,
        requestedBy
    };
}

export function formatSeconds(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "LIVE";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const pad = (value: number) => value.toString().padStart(2, "0");
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export async function resolveInput(query: string, requestedBy: string): Promise<Track[]> {
    const trimmed = query.trim();
    const type = await play.validate(trimmed);

    if (type === "yt_playlist") {
        const playlist = await play.playlist_info(trimmed, { incomplete: true });
        const videos = await playlist.all_videos();
        return videos.slice(0, config.music.maxQueueSize).map((video) => toTrack(video, requestedBy));
    }

    if (type === "yt_video") {
        const info = await play.video_info(trimmed);
        return [toTrack(info.video_details, requestedBy)];
    }

    const results = await play.search(trimmed, { source: { youtube: "video" }, limit: 1 });
    if (results.length === 0) return [];
    return [toTrack(results[0], requestedBy)];
}
