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
	const visButton = {
		x: screenPadding,
		y: element.clientHeight - screenPadding - 64,
		width: 64,
		height: 64,
	};
	let selectedInstrument =
		soundFonts[Math.floor(Math.random() * soundFonts.length)].name;
	let selectedVis: "splash" | "ripple" | "grid" | "match" = "splash";

	let touchEffects: SplashEffects;
	let rippleGrid: RippleGrid;
	let grid: Grid;
	let match: Match;

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
		rippleGrid = new RippleGrid(p);
		grid = new Grid(p);
		match = new Match(p);
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
		if (selectedVis === "splash") {
			touchEffects.draw(p);
		} else if (selectedVis === "ripple") {
			rippleGrid.draw(p);
		} else if (selectedVis === "grid") {
			grid.draw(p);
		} else if (selectedVis === "match") {
			match.draw(p);
		}

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
		p.text("vis", visButton.x, visButton.y, visButton.width, visButton.height);
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
		if (didClick(visButton)) {
			switch (selectedVis) {
				case "splash":
					selectedVis = "ripple";
					break;
				case "ripple":
					selectedVis = "grid";
					break;
				case "grid":
					selectedVis = "match";
					break;
				case "match":
					selectedVis = "splash";
					break;
			}
			console.log(selectedVis);
			return true;
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
				rippleGrid.touched(touch.clientX, touch.clientY);
				grid.touched(touch.clientX, touch.clientY);
				match.add(touch.clientX, touch.clientY);
			}
		}
	};

	p.mouseDragged = () => {
		if (!isInitialized) {
			return;
		}
		drawListener(p.mouseX, p.mouseY, 0);
		touchEffects.add(p.mouseX, p.mouseY);
		rippleGrid.touched(p.mouseX, p.mouseY);
		grid.touched(p.mouseX, p.mouseY);
		match.add(p.mouseX, p.mouseY);
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
	private readonly maxAgeMs = 50;
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

class Grid {
	private readonly distanceBetweenPoints = 32;
	private readonly pg: p5.Graphics;
	private readonly originalPositions: p5.Vector[][] = [];
	private readonly points: p5.Vector[][] = [];
	private readonly velocities: p5.Vector[][] = [];
	private readonly maxVelocity = 1;

	constructor(p: p5) {
		this.pg = p.createGraphics(p.width, p.height);
		for (let y = 0; y < p.height; y += this.distanceBetweenPoints) {
			const row: p5.Vector[] = [];
			const velocityRow: p5.Vector[] = [];
			const originalPositionRow: p5.Vector[] = [];
			for (let x = 0; x < p.width; x += this.distanceBetweenPoints) {
				row.push(new p5.Vector(x, y));
				velocityRow.push(new p5.Vector(0, 0));
				originalPositionRow.push(new p5.Vector(x, y));
			}
			this.points.push(row);
			this.velocities.push(velocityRow);
			this.originalPositions.push(originalPositionRow);
		}
	}

	touched(x: number, y: number) {
		const touchPoint = new p5.Vector(x, y);
		for (let j = 0; j < this.points.length; j++) {
			for (let i = 0; i < this.points[j].length; i++) {
				const point = this.points[j][i];
				const velocity = this.velocities[j][i];
				const boost = point
					.copy()
					.sub(touchPoint)
					.mult(10 / point.dist(touchPoint))
					.limit(this.maxVelocity);
				velocity.add(boost);
			}
		}
	}

	draw(p: p5) {
		this.pg.background("black");
		this.pg.stroke("#444");
		this.pg.strokeWeight(1);
		for (let j = 0; j < this.points.length; j++) {
			const row = this.points[j];
			for (let i = 0; i < row.length; i++) {
				const point = row[i];
				const velocity = this.velocities[j][i];
				const originalPosition = this.originalPositions[j][i];
				const toOriginalPosition = originalPosition
					.copy()
					.sub(point)
					.mult(
						point.dist(originalPosition) * point.dist(originalPosition) * 0.001,
					);
				velocity.add(toOriginalPosition);
				point.add(velocity);
				velocity.mult(0.8);

				const right = row[i + 1];
				const below = this.points[j + 1]?.[i];
				if (right) {
					this.pg.line(point.x, point.y, right.x, right.y);
				}
				if (below) {
					this.pg.line(point.x, point.y, below.x, below.y);
				}
			}
		}
		p.image(this.pg, 0, 0);
	}
}

class RippleGrid {
	private readonly distanceBetweenPoints = 16;
	private readonly pg: p5.Graphics;
	private points: p5.Vector[][] = [];
	private oldPoints: p5.Vector[][] = [];
	private readonly dampening = 0.9;
	private readonly circleSize = 2;
	private lastPoint: p5.Vector | undefined;
	private distanceBetweenDrops = 64;

	constructor(p: p5) {
		this.pg = p.createGraphics(p.width, p.height);
		for (let y = 0; y < p.height; y += this.distanceBetweenPoints) {
			const row: p5.Vector[] = [];
			const oldRow: p5.Vector[] = [];
			for (let x = 0; x < p.width; x += this.distanceBetweenPoints) {
				row.push(new p5.Vector(x, y));
				oldRow.push(new p5.Vector(0, 0));
			}
			this.points.push(row);
			this.oldPoints.push(oldRow);
		}
	}

	touched(x: number, y: number) {
		const touchPoint = new p5.Vector(x, y);
		if (!this.lastPoint) {
			this.lastPoint = touchPoint;
		} else {
			if (this.lastPoint.dist(touchPoint) < this.distanceBetweenDrops) {
				return;
			}
			this.lastPoint = touchPoint;
		}
		for (let j = 0; j < this.points.length; j++) {
			for (let i = 0; i < this.points[j].length; i++) {
				const point = this.points[j][i];
				const distanceToTouch = point.dist(touchPoint);
				point.z =
					(this.distanceBetweenPoints / distanceToTouch / 2) * this.circleSize;
			}
		}
	}

	draw(p: p5) {
		this.pg.background("black");
		this.pg.stroke("#444");
		this.pg.strokeWeight(1);
		this.pg.fill("white");
		for (let j = 0; j < this.points.length; j++) {
			for (let i = 0; i < this.points[j].length; i++) {
				const point = this.points[j][i];
				const left = this.points[j][i - 1]?.z ?? 0;
				const right = this.points[j][i + 1]?.z ?? 0;
				const top = this.points[j + 1]?.[i]?.z ?? 0;
				const bottom = this.points[j - 1]?.[i]?.z ?? 0;
				this.oldPoints[j][i].z =
					(left + right + top + bottom) / 2 - this.oldPoints[j][i].z;
				this.oldPoints[j][i].z *= this.dampening;
				this.oldPoints[j][i].z *= p.min(this.dampening, this.circleSize);
				this.pg.noStroke();
				this.pg.circle(
					point.x,
					point.y,
					(this.distanceBetweenPoints / 4) * this.oldPoints[j][i].z,
				);
			}
		}
		const cache = this.oldPoints;
		this.oldPoints = this.points;
		this.points = cache;
		p.image(this.pg, 0, 0);
	}
}

class Match {
	private points: {
		x: number;
		y: number;
		timestamp: number;
	}[] = [];
	private readonly pg: p5.Graphics;
	private readonly maxAgeMs = 200;

	constructor(p: p5) {
		this.pg = p.createGraphics(p.width, p.height);
		this.pg.background("black");
	}

	add(x: number, y: number) {
		this.points.push({ x, y, timestamp: Date.now() });
	}

	draw(p: p5) {
		const now = Date.now();
		this.pg.background(0, 0, 0);
		this.pg.noStroke();
		this.pg.fill("yellow");
		this.points = this.points.filter((r) => now - r.timestamp <= this.maxAgeMs);
		for (const point of this.points) {
			const ageMs = now - point.timestamp;
			const scale = this.pg.map(ageMs, 0, this.maxAgeMs, 40, 1);
			this.pg.circle(point.x, point.y, scale);
		}
		p.image(this.pg, 0, 0);
	}
}
