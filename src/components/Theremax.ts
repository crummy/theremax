import {Timer} from "./Timer.ts";
import type {Instrument} from "./player.ts";
import * as Tone from "tone";

class Recording {
    notes: { [millis: number]: { x: number, y: number } } = {};
    length: number | undefined = undefined;
    lastPlayed: { x: number, y: number } | undefined = undefined;

    constructor(public id: number, public instrument: Instrument) {
    }

    addNote(x: number, y: number, millis: number) {
        const note = {x, y};
        this.notes[millis] = note;
        this.lastPlayed = note;
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
        const recording = new Recording(this.recordingId, instrument);
        this.recordings[this.recordingId] = recording;
        if (this.recordingId == 0) {
            this.timer.reset();
        }
        const millis = this.timer.getElapsedMs();
        recording.addNote(x, y, millis);
    }

    moveDraw(x: number, y: number) {
        const recording = this.recordings[this.recordingId];
        const millis = this.timer.getElapsedMs();
        recording.addNote(x, y, millis);
    }

    endDraw() {
        const recording = this.recordings[this.recordingId];
        recording.length = this.timer.getElapsedMs();
        this.recordingId++;
    }

    tick() {
        if (this.recordings.length === 0 || !this.isInitialized) {
            return
        }
        const maxRecording = Math.max(...this.recordings.map(r => r.length ?? 0));
        const activeRecording = this.recordings.find(r => r.length === undefined);
        if (!activeRecording && this.timer.getElapsedMs() > maxRecording) {
            this.timer.reset();
            this.vis.clearLines();
        }
        for (let recording of this.recordings) {
            const now = this.timer.getElapsedMs();
            const stillRecording = recording.length === undefined;
            let dot: { x: number, y: number } | undefined;
            if (stillRecording) {
                dot = recording.lastPlayed
            } else {
                const closestNextDot = Object.entries(recording.notes)
                    .filter(([millis, _]) => Math.abs(Number.parseInt(millis) - now) < 16) // so we don't show ones in the future
                    .find(([millis, _]) => Number.parseInt(millis) >= now)
                dot = closestNextDot?.[1]
            }
            const stillReplaying = recording.length !== undefined && now < recording.length;
            if (dot && (stillRecording || stillReplaying)) {
                this.playScaled(dot.x, dot.y, recording.instrument);
                this.vis.drawPoint(dot.x, dot.y, recording.id);
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