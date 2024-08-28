import p5 from "p5";
import { soundFonts } from "./player.ts";

export const screenPadding = 16;
export const colours = [
	0xc401db, 0xfe14bb, 0x8aff00, 0x10fee2, 0x6715ff, 0xffb700, 0xff3e3e,
	0x1affd5, 0xff66cc, 0x33ff57, 0x9900ff, 0xffaa00,
];

export const VisualizationP5 = (p: p5, element: HTMLElement) => {
	let lines: { [recordingId: number]: { x: number; y: number }[] } = {};

	let isInitialized = false;
	let drawListener: (x: number, y: number, pointerId: number) => void = () =>
		null;
	let newClickListener: (
		x: number,
		y: number,
		pointerId: number,
		instrumentName: string,
	) => void = () => null;
	let clickStopListener: (pointerId: number) => void = () => null;
	let tickListener: () => void = () => null;
	let resetListener: () => void = () => null;
	let progress = 0;
	let resetIcon: p5.Image;
	let instrumentIcons: Map<string, p5.Image>;
	const resetButton = {
		x: screenPadding,
		y: screenPadding,
		width: 64,
		height: 64,
	};
	const instruments = soundFonts.map((sf, i) => ({
		x: screenPadding,
		y: screenPadding + 82 + 82 * i,
		width: 64,
		height: 64,
		name: sf.name,
	}));
	let selectedInstrument =
		soundFonts[Math.floor(Math.random() * soundFonts.length)].name;

	let touchEffects: SplashEffects;

	p.setup = () => {
		p.resizeCanvas(element.clientWidth, element.clientHeight);
		p.fill(200, 200, 200);
		p.rect(p.width / 2 - 200, p.height / 2 - 40, 400, 80, 10);
		p.fill(100, 100, 100);
		p.textAlign(p.CENTER, p.CENTER);
		p.textSize(32);
		p.text(
			"Welcome to the Theremax.\nClick anywhere to start",
			p.width / 2,
			p.height / 2,
		);
		touchEffects = new SplashEffects(p);
	};

	p.preload = () => {
		resetIcon = p.loadImage("/theremax/reset.png");
		instrumentIcons = new Map(
			soundFonts.map((s) => [s.name, p.loadImage(`/theremax/${s.image}`)]),
		);
	};

	p.draw = () => {
		if (!isInitialized) {
			return;
		}
		p.background("black");
		touchEffects.draw(p);
		for (const [recordingId, line] of Object.entries(lines)) {
			const colour = colours[Number.parseInt(recordingId) % colours.length];
			const red = (colour >> 16) & 0xff;
			const green = (colour >> 8) & 0xff;
			const blue = colour & 0xff;
			p.stroke(red, green, blue);
			p.strokeWeight(8);
			let from = line[0];
			for (let j = 1; j < line.length; j++) {
				const to = line[j];
				p.line(from.x, from.y, to.x, to.y);
				from = to;
			}
		}

		p.image(
			resetIcon,
			resetButton.x,
			resetButton.y,
			resetButton.width,
			resetButton.height,
		);
		p.textSize(32);
		p.textAlign(p.CENTER);
		for (const instrument of instruments) {
			const icon = instrumentIcons.get(instrument.name);
			if (!icon) {
				throw new Error(`No icon found for ${instrument.name}`);
			}
			const padding = 4;
			if (selectedInstrument === instrument.name) {
				p.fill(59, 98, 227);
				p.noStroke();
			} else {
				p.noStroke();
				p.fill(100, 100, 100);
			}
			p.rect(
				instrument.x - padding,
				instrument.y - padding,
				instrument.width + padding * 2,
				instrument.height + padding * 2,
				4,
			);
			p.image(
				icon,
				instrument.x,
				instrument.y,
				instrument.width,
				instrument.height,
			);
		}
		p.stroke("white");
		p.line(
			screenPadding,
			p.height - screenPadding,
			(p.width - screenPadding) * progress,
			p.height - screenPadding,
		);
		tickListener();
	};

	function didClick(button: {
		x: number;
		width: number;
		y: number;
		height: number;
	}) {
		return (
			p.mouseX >= button.x &&
			p.mouseX <= button.x + button.width &&
			p.mouseY >= button.y &&
			p.mouseY <= button.y + button.height
		);
	}

	function handleUI() {
		if (!isInitialized) {
			isInitialized = true;
			return true;
		}
		if (didClick(resetButton)) {
			resetListener();
			return true;
		}
		for (const instrument of instruments) {
			if (didClick(instrument)) {
				selectedInstrument = instrument.name;
				return true;
			}
		}
	}

	p.mousePressed = () => {
		if (handleUI()) {
			return;
		}
		newClickListener(p.mouseX, p.mouseY, 0, selectedInstrument);
	};

	p.touchStarted = (event) => {
		// todo: should we go fullscreen?
		if (handleUI()) {
			return;
		}
		if (event instanceof TouchEvent) {
			for (const touch of event.changedTouches) {
				newClickListener(
					touch.clientX,
					touch.clientY,
					touch.identifier,
					selectedInstrument,
				);
			}
		}
	};

	p.touchEnded = (event) => {
		if (event instanceof TouchEvent) {
			for (const touch of event.changedTouches) {
				clickStopListener(touch.identifier);
			}
		}
	};

	p.mouseReleased = () => {
		clickStopListener(0);
	};

	p.touchMoved = (event) => {
		if (!isInitialized) {
			return;
		}
		if (event instanceof TouchEvent) {
			for (const touch of event.changedTouches) {
				drawListener(touch.clientX, touch.clientY, touch.identifier);
				touchEffects.add(touch.clientX, touch.clientY);
			}
		}
	};

	p.mouseDragged = () => {
		if (!isInitialized) {
			return;
		}
		drawListener(p.mouseX, p.mouseY, 0);
		touchEffects.add(p.mouseX, p.mouseY);
	};

	function clearLines() {
		lines = {};
	}

	function createLine(x: number, y: number, recordingId: number) {
		lines[recordingId] = [];
		lines[recordingId].push({ x, y });
	}

	function getDimensions(): { width: number; height: number } {
		return { width: p.width, height: p.height };
	}

	function addPoints(points: { x: number; y: number }[], recordingId: number) {
		let line = lines[recordingId];
		if (!line) {
			line = [];
			lines[recordingId] = line;
		}
		line.push(...points);
	}

	function onDraw(callback: (x: number, y: number, pointerId: number) => void) {
		drawListener = callback;
	}

	function onNewClick(
		callback: (
			x: number,
			y: number,
			pointerId: number,
			instrumentName: string,
		) => void,
	) {
		newClickListener = callback;
	}

	function onClickStop(callback: (pointerId: number) => void) {
		clickStopListener = callback;
	}

	function onTick(callback: () => void) {
		tickListener = callback;
	}

	function onReset(callback: () => void) {
		resetListener = callback;
	}

	function updateColumnCount(columns: number) {
		if (columns) {
			// columns.count = columns
		}
	}

	function updateProgress(percent: number) {
		progress = percent;
	}

	return {
		clearLines,
		createLine,
		getDimensions,
		addPoints,
		onDraw,
		onNewClick,
		onClickStop,
		onTick,
		onReset,
		updateColumnCount,
		updateProgress,
	};
};

class SplashEffects {
	private readonly maxAgeMs = 100;
	private splashes: {
		x: number;
		y: number;
		timestamp: number;
		direction: number;
	}[] = [];
	private readonly pg: p5.Graphics;

	constructor(p: p5) {
		this.pg = p.createGraphics(p.width, p.height);
		this.pg.background("black");
	}

	add(x: number, y: number) {
		const now = Date.now();
		const direction = Math.random() * 2 * Math.PI;
		this.splashes.push({ x, y, timestamp: now, direction });
	}

	draw(p: p5) {
		this.pg.noStroke();
		this.pg.background(0, 0, 0, 20);
		const now = Date.now();
		this.splashes = this.splashes.filter(
			(r) => now - r.timestamp <= this.maxAgeMs,
		);
		this.pg.stroke("white");
		this.pg.noFill();
		for (const splash of this.splashes) {
			const ageMs = now - splash.timestamp;
			this.pg.fill("white");
			this.pg.noStroke();
			const position = new p5.Vector(splash.x, splash.y);
			const offset = p5.Vector.fromAngle(splash.direction).mult(ageMs);
			const newPosition = position.add(offset);
			const scale = this.pg.map(ageMs, 0, this.maxAgeMs, 20, 1);
			this.pg.circle(newPosition.x, newPosition.y, scale);
		}
		p.image(this.pg, 0, 0);
	}
}
