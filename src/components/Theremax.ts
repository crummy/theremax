import {Timer} from "./Timer.ts";
import type {Instrument} from "./player.ts";
import {lerp} from "./lerp.ts";

interface Note {
    millis: number
    x: number
    y: number
    next: Note | undefined
}


let recordingIdCount = 0;

class Recording {
    start: Note
    lastPlayed: Note | undefined
    end: Note
    activelyRecording = true
    id = recordingIdCount++

    constructor(public instrument: Instrument, x: number, y: number, millis: number, public pointerId: number) {
        this.start = {millis, x, y, next: undefined}
        this.end = this.start
    }

    addNote(x: number, y: number, millis: number) {
        const end = {millis, x, y, next: undefined};
        this.end.next = end
        this.end = end
    }
}

export interface TheremaxVisualization {
    clearLines(): void

    createLine(x: number, y: number, recordingId: number): void

    getDimensions(): { width: number, height: number }

    connectPoints(points: { x: number, y: number}[], recordingId: number): void
}

export class Theremax {
    private recordings: Recording[] = []
    private timer = new Timer();
    private isInitialized = false;
    private readonly volume = {min: -30, max: 100}
    private readonly loopTimeMs = 10 * 1000;
    private context: AudioContext | undefined

    constructor(private vis: TheremaxVisualization) {
    }

    getContext() {
        if (!this.context) {
            this.context  = new AudioContext();
        }
        return this.context
    }


    async init() {
        await this.getContext().resume()
        this.isInitialized = true
    }

    reset() {
        this.timer.reset();
        this.recordings.forEach(r => r.instrument.stop())
        this.recordings = [];
        this.vis.clearLines();
    }

    beginDraw(x: number, y: number, pointerId: number, instrument: Instrument) {
        if (this.recordings.length == 0) {
            this.timer.start()
        }
        const millis = this.timer.getElapsedMs();
        const recording = new Recording(instrument, x, y, millis, pointerId);
        this.recordings.push(recording);
        return { recordingId: recording.id }
    }

    moveDraw(x: number, y: number, pointerId: number) {
        const recording = this.recordings.find(r => r.pointerId === pointerId && r.activelyRecording)
        if (!recording) {
            throw new Error(`No active recording found for pointerId ${pointerId}`)
        }
        const millis = this.timer.getElapsedMs();
        recording.addNote(x, y, millis);
    }

    getIntervals() {
        // now that we have multitouch support, in theory you might be able to have multiple instruments per finger,
        // so this isn't guaranteed accurate (if somehow each finger has a different instrument)
        return this.recordings.find(r => r.activelyRecording)?.instrument.getIntervals()
    }

    getPercentComplete() {
        return this.timer.getElapsedMs() / this.loopTimeMs;
    }

    endDraw(pointerId: number) {
        const recording = this.recordings.find(r => r.pointerId === pointerId && r.activelyRecording);
        if (!recording) {
            throw new Error(`No recording found to stop with pointerId ${pointerId}`)
        }
        recording.activelyRecording = false;
    }

    tick(): { x: number; y: number }[][] {
        if (!this.isInitialized) {
            return []
        }
        const now = this.timer.getElapsedMs();
        if (now > this.loopTimeMs) {
            this.timer.reset();
            this.vis.clearLines();
            for (let recording of this.recordings) {
                recording.lastPlayed = undefined;
                recording.instrument.stop()
            }
            return []
        }
        for (let recording of this.recordings) {
            let noteToPlay: Note | undefined = undefined
            // If we are ready to begin playing, set up initial state
            if (recording.lastPlayed === undefined && recording.start.millis <= now) {
                noteToPlay = recording.start
                recording.lastPlayed = recording.start
            }
            // Then find the most recent note we are ready to play
            while (recording.lastPlayed?.next !== undefined && recording.lastPlayed.millis <= now) {
                noteToPlay = recording.lastPlayed
                recording.lastPlayed = recording.lastPlayed.next;
            }
            // If we're past the end of the notes, stop the instrument (as it'll loop forever otherwise)
            if (recording.end.millis < now && !recording.activelyRecording) {
                recording.instrument.stop()
            } else if (noteToPlay !== undefined) {
                this.playScaled(noteToPlay.x, noteToPlay.y, recording.instrument);
            }
        }
        const newPoints: { x: number, y: number }[][] = []
        for (let recording of this.recordings) {
            const recordingPoints: { x: number, y: number}[] = []
            let point: Note | undefined = recording.lastPlayed
            let priorPoint: Note | undefined
            while (point !== undefined) {
                // deduplicate points
                if (point.x !== priorPoint?.x || point.y !== priorPoint?.y) {
                    recordingPoints.push(point)
                }
                priorPoint = point
                point = point.next
            }
            newPoints[recording.id] = recordingPoints
        }
        return newPoints
    }

    private playScaled(x: number, y: number, instrument: Instrument) {
        const {width, height} = this.vis.getDimensions();
        const note = x / width;
        const vol = lerp(y, 0, height, this.volume.min, this.volume.max)
        try {
            instrument.play(note, vol);
        } catch (e) {
            // can't figure out "Start time must be strictly greater than previous start time" error, just ignore it
            console.error(e)
        }
    }
}