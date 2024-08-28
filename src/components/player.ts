import { Soundfont } from "smplr";

function lerp(
	value: number,
	sourceRangeMin: number,
	sourceRangeMax: number,
	targetRangeMin: number,
	targetRangeMax: number,
) {
	const targetRange = targetRangeMax - targetRangeMin;
	const sourceRange = sourceRangeMax - sourceRangeMin;
	return (
		((value - sourceRangeMin) * targetRange) / sourceRange + targetRangeMin
	);
}

export interface Instrument {
	play(x: number, volume: number): void;

	stop(): void;

	getIntervals(): number;
}

export class SoundFont implements Instrument {
	private readonly notes = [
		"C3",
		"D3",
		"E3",
		"F3",
		"G3",
		"A3",
		"B3",
		"C4",
		"D4",
		"E4",
		"F4",
		"G4",
		"A4",
		"B4",
		"C5",
		"D5",
		"E5",
		"F5",
		"G5",
		"A5",
		"B5",
		"C6",
		"D6",
		"E6",
		"F6",
		"G6",
		"A6",
		"B6",
	].filter((_, i) => i % 2 === 0);
	private readonly marimba: Soundfont;
	private playingNote: string | null = null;
	private stopLastNote: () => void = () => null;

	constructor(context: AudioContext, instrument: string) {
		this.marimba = new Soundfont(context, { instrument, loadLoopData: true });
	}

	play(x: number, volume: number): void {
		this.marimba.output.setVolume(volume);
		const noteIndex = Math.floor(lerp(x, 0, 1, 0, this.notes.length));
		const note = this.notes[noteIndex];
		if (note === this.playingNote) {
			return;
		}
		this.stopLastNote();
		this.stopLastNote = this.marimba.start({ note, loop: true });
		this.playingNote = note;
	}

	stop() {
		this.marimba.stop();
		this.playingNote = null;
	}

	getIntervals() {
		return this.notes.length;
	}
}

export const soundFonts = [
	{ name: "church_organ", image: "piano.png" },
	{ name: "alto_sax", image: "sax.png" },
	{ name: "taiko_drum", image: "drum.png" },
	{ name: "cello", image: "violin.png" },
	{ name: "fx_3_crystal", image: "sparkle.png" },
	{ name: "bird_tweet", image: "bird.png" },
	{ name: "seashore", image: "wave.png" },
];
