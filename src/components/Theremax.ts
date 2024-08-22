import {Timer} from "./Timer.ts";
import type {Instrument} from "./player.ts";
import * as Tone from "tone";

interface Instant {
    millis: number
    x: number
    y: number
    next: Instant | undefined
}


class Recording {
    start: Instant
    lastPlayed: Instant | undefined
    end: Instant
    activelyRecording = true

    constructor(public id: number, public instrument: Instrument, x: number, y: number, millis: number) {
        this.start = { millis, x, y, next: undefined }
        this.end = this.start
    }

    addNote(x: number, y: number, millis: number) {
        const end = {millis, x, y, next: undefined};
        this.end.next = end
        this.end = end
    }
}

function lerp(value: number, sourceRangeMin: number, sourceRangeMax: number, targetRangeMin: number, targetRangeMax: number) {
    const targetRange = targetRangeMax - targetRangeMin;
    const sourceRange = sourceRangeMax - sourceRangeMin;
    return (value - sourceRangeMin) * targetRange / sourceRange + targetRangeMin;
}


export interface TheremaxVisualization {
    clearLines(): void

    drawPoint(x: number, y: number, recordingId: number): void

    getDimensions(): { width: number, height: number }
}

export class Theremax {
    private recordingId = 0;
    private recordings: Recording[] = []
    private timer = new Timer();
    private isInitialized = false;
    private readonly volume = {min: -40, max: 0}

    constructor(private vis: TheremaxVisualization) {
        Tone.start().then(() => this.isInitialized = true);
    }

    beginDraw(x: number, y: number, instrument: Instrument) {
        if (this.recordingId == 0) {
            this.timer.reset();
        }
        const millis = this.timer.getElapsedMs();
        this.recordings[this.recordingId] = new Recording(this.recordingId, instrument, x, y, millis);
    }

    moveDraw(x: number, y: number) {
        const recording = this.recordings[this.recordingId];
        const millis = this.timer.getElapsedMs();
        recording.addNote(x, y, millis);
    }

    getIntervals() {
        return this.recordings[this.recordingId]?.instrument.getIntervals()
    }

    endDraw() {
        this.recordings[this.recordingId].activelyRecording = false;
        this.recordingId++;
    }

    tick() {
        if (this.recordings.length === 0 || !this.isInitialized) {
            return
        }
        const allRecordingsFinished = this.recordings.every(r => !r.activelyRecording);
        const allPlaybackFinished = this.recordings.every(r => r.lastPlayed === r.end);
        if (allRecordingsFinished && allPlaybackFinished) {
            this.timer.reset();
            this.vis.clearLines();
            for (let recording of this.recordings) {
                recording.lastPlayed = undefined;
                recording.instrument.stop()
            }
        }
        const now = this.timer.getElapsedMs();
        for (let recording of this.recordings) {
            if (recording.lastPlayed === undefined && recording.start.millis <= now) {
                const { x, y } = recording.start
                this.playScaled(x, y, recording.instrument);
                this.vis.drawPoint(x, y, recording.id);
                recording.lastPlayed = recording.start
            }
            while (recording.lastPlayed?.next !== undefined && recording.lastPlayed.millis < now) {
                const { x, y } = recording.lastPlayed
                this.playScaled(x, y, recording.instrument);
                this.vis.drawPoint(x, y, recording.id);
                recording.lastPlayed = recording.lastPlayed.next;
            }
        }
    }

    private playScaled(x: number, y: number, instrument: Instrument) {
        const {width, height} = this.vis.getDimensions();
        const note = x / width;
        const vol = lerp(y, 0, height, this.volume.min, this.volume.max)
        instrument.play(note, vol);
    }
}