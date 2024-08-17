import {BinarySearchTree} from "./Tree.ts";
import {Timer} from "./Timer.ts";
import type {Instrument} from "./player.ts";
import * as Tone from "tone";

class Recording {
    notes: BinarySearchTree<{
        millis: number,
        x: number,
        y: number
    }> = new BinarySearchTree((a, b) => a.millis - b.millis);
    length: number | undefined = undefined;

    constructor(public id: number, public instrument: Instrument) {
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
        this.timer.reset();
        recording.notes.insert({millis: this.timer.getElapsedMs(), x, y});
    }

    moveDraw(x: number, y: number) {
        const recording = this.recordings[this.recordingId];
        recording.notes.insert({millis: this.timer.getElapsedMs(), x, y});
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
        const isRecording = this.recordings.some(r => r.length === undefined);
        if (!isRecording && this.timer.getElapsedMs() > maxRecording) {
            this.timer.reset();
            this.vis.clearLines();
        }
        for (let recording of this.recordings) {
            const now = this.timer.getElapsedMs();
            const nearest = recording.notes.search({millis: now});
            const stillRecording = recording.length === undefined;
            const stillReplaying = recording.length !== undefined && now < recording.length;
            if (nearest && (stillRecording || stillReplaying)) {
                this.playScaled(nearest.data.x, nearest.data.y, recording.instrument);
                this.vis.drawPoint(nearest.data.x, nearest.data.y, recording.id);
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