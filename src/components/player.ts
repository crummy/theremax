import {Soundfont, SplendidGrandPiano as Piano, CacheStorage} from "smplr";

const storage = new CacheStorage();

function lerp(value: number, sourceRangeMin: number, sourceRangeMax: number, targetRangeMin: number, targetRangeMax: number) {
    const targetRange = targetRangeMax - targetRangeMin;
    const sourceRange = sourceRangeMax - sourceRangeMin;
    return (value - sourceRangeMin) * targetRange / sourceRange + targetRangeMin;
}

export interface Instrument {
    play(x: number, volume: number): void;

    stop(): void;

    getIntervals(): number;
}

export class SplendidGrandPiano implements Instrument {
    private readonly notes = [

        "Mp-11", "Mp-15", "Mp-17", "Mp-19", "Mp-21", "Mp-23", "Mp-25", "Mp-26", "Mp-28", "Mp-29",
        "Mp-31", "Mp-33", "Mp-35", "Mp-36", "Mp-38", "Mp-40", "Mp-41", "Mp-43", "Mp-44", "Mp-45",
        "Mp-46", "Mp-47", "Mp-48", "Mp-50", "Mp-52", "Mp-53", "Mp-55", "Mp-57", "Mp-59", "Mp-60",
        "Mp-62", "Mp-64", "Mp-65", "Mp-67", "Mp-68", "Mp-69", "Mp-70", "Mp-71", "Mp-73", "Mp-74",
        "Mp-75", "Mp-76", "Mp-77", "Mp-78", "Mp-79", "Mp-80", "Mp-81", "Mp-82", "Mp-83", "Mp-84",
        "Mp-85", "Mp-86", "Mp-87", "Mp-89", "Mp-90", "Mp-91", "Mp-92", "Mp-93", "Mp-94",
        "pp-11", "pp-15", "pp-17", "pp-19", "pp-21", "pp-23", "pp-25", "pp-26", "pp-28", "pp-29",
        "pp-31", "pp-33", "pp-35", "pp-36", "pp-38", "pp-40", "pp-41", "pp-43", "pp-44", "pp-45",
        "pp-46", "pp-47", "pp-48", "pp-50", "pp-52", "pp-53", "pp-55", "pp-57", "pp-59", "pp-60",
        "pp-62", "pp-64", "pp-65", "pp-67", "pp-68", "pp-69", "pp-70", "pp-71", "pp-73", "pp-74",
        "pp-75", "pp-77", "pp-78", "pp-79", "pp-80", "pp-81", "pp-82", "pp-83", "pp-84", "pp-85",
        "pp-86", "pp-87", "pp-88", "pp-89", "pp-90", "pp-91", "pp-92", "pp-93", "pp-94", "pp-95",
        "pp-96",
        "FF-11", "FF-15", "FF-17", "FF-19", "FF-21", "FF-23", "FF-25", "FF-26", "FF-28", "FF-29",
        "FF-31", "FF-33", "FF-35", "FF-36", "FF-38", "FF-40", "FF-41", "FF-43", "FF-44",
    ]
    private readonly piano: Piano
    private playingNote: string | null = null
    private isLoaded = false

    constructor(context: AudioContext) {
        this.piano = new Piano(context, {storage})
        this.piano.load.then(() => this.isLoaded = true)
    }

    play(x: number, volume: number): void {
        this.piano.output.setVolume(volume)
        const noteIndex = Math.floor(lerp(x, 0, 1, 0, this.notes.length))
        const note = this.notes[noteIndex];
        if (note == this.playingNote) {
            return
        } else {
            this.piano.start({note})
            this.playingNote = note
        }
    }

    stop() {
        this.piano.stop()
        this.playingNote = null;
    }

    getIntervals() {
        return this.notes.length;
    }
}

export class SoundFont implements Instrument {
    private readonly notes = [
        "C3", "D3", "E3", "F3", "G3", "A3", "B3",
        "C4", "D4", "E4", "F4", "G4", "A4", "B4",
        "C5", "D5", "E5", "F5", "G5", "A5", "B5",
        "C6", "D6", "E6", "F6", "G6", "A6", "B6",
        // "C7", "D7", "E7", "F7", "G7", "A7", "B7",
        // "C8", "D8", "E8", "F8", "G8", "A8", "B8",
    ]
    private readonly marimba: Soundfont
    private playingNote: string | null = null
    private stopLastNote: () => void = () => null

    constructor(context: AudioContext, instrument: string) {
        this.marimba = new Soundfont(context, {instrument, loadLoopData: true});
    }

    play(x: number, volume: number): void {
        this.marimba.output.setVolume(volume)
        const noteIndex = Math.floor(lerp(x, 0, 1, 0, this.notes.length))
        const note = this.notes[noteIndex];
        if (note == this.playingNote) {
            return
        } else {
            this.stopLastNote()
            this.stopLastNote = this.marimba.start({note, loop: true})
            this.playingNote = note
        }
    }

    stop() {
        this.marimba.stop()
        this.playingNote = null;
    }

    getIntervals() {
        return this.notes.length;
    }
}