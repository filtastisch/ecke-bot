export interface Track {
    title: string;
    url: string;
    durationSec: number;
    durationRaw: string;
    author: string;
    thumbnail?: string;
    requestedBy: string;
}

export class Queue {
    public tracks: Track[] = [];
    public history: Track[] = [];
    public shuffle = false;

    public get size(): number {
        return this.tracks.length;
    }

    public add(track: Track): void {
        this.tracks.push(track);
    }

    public addMany(tracks: Track[]): void {
        this.tracks.push(...tracks);
    }

    public next(): Track | undefined {
        if (this.tracks.length === 0) return undefined;
        if (this.shuffle) {
            const index = Math.floor(Math.random() * this.tracks.length);
            return this.tracks.splice(index, 1)[0];
        }
        return this.tracks.shift();
    }

    public pushHistory(track: Track): void {
        this.history.push(track);
        if (this.history.length > 10) this.history.shift();
    }

    public clear(): void {
        this.tracks = [];
        this.history = [];
    }
}
