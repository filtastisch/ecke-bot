import { spawn, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import youtubedl from "youtube-dl-exec";

const YT_DLP_PATH = (youtubedl as unknown as { constants: { YOUTUBE_DL_PATH: string } }).constants.YOUTUBE_DL_PATH;

export interface AudioProcess {
    process: ChildProcessByStdio<null, Readable, Readable>;
    stream: Readable;
}

export function spawnAudioStream(url: string): AudioProcess {
    const child = spawn(
        YT_DLP_PATH,
        [
            url,
            "-o",
            "-",
            "-f",
            "bestaudio[ext=webm]/bestaudio/best",
            "--no-playlist",
            "--quiet",
            "--no-warnings",
            "--no-part",
            "--no-cache-dir"
        ],
        { stdio: ["ignore", "pipe", "pipe"] }
    );

    return { process: child, stream: child.stdout };
}
