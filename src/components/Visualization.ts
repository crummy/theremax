import {Application, FillGradient, Graphics} from "pixi.js";
import type {TheremaxVisualization} from "./Theremax.ts";
import {lerp} from "./lerp.ts";

const screenPadding = 16;
export const colours = [
    0x00ff00,
    0xff0000,
    0x0000ff,
    0xffff00,
    0xff00ff,
    0x00ffff,
    0xff8800,
    0x00ff88,
    0x8800ff,
    0x88ff00,
    0x0088ff,
    0xff0088,
    0x8800ff,
    0x0088ff,
    0xff0088,
    0x88ff00,
    0x00ff88,
    0xff8800,
    0x00ffff,
    0xff00ff,
    0xffff00,
    0x0000ff,
    0xff0000,
    0x00ff00,
]

export class Visualization implements TheremaxVisualization {
    private readonly app = new Application();
    private drawListener: (x: number, y: number, pointerId: number) => void = () => null
    private newClickListener: (x: number, y: number, pointerId: number) => void = () => null
    private clickStopListener: (pointerId: number) => void = () => null
    private tickListener: (millis: number) => void = () => null
    private lines: Graphics[] = []
    private progress = new Graphics();
    private ripples = new Ripples()
    private columns: Columns | undefined

    async init(element: HTMLElement) {
        await this.app.init({width: element.clientWidth, height: element.clientHeight})
        this.columns = new Columns(element.clientWidth, element.clientHeight)
        // The application will create a canvas element for you that you
        // can then insert into the DOM
        element.appendChild(this.app.canvas);

        this.app.stage.addChild(this.progress)
        this.app.stage.addChild(this.columns.graphics)

        this.app.stage.eventMode = 'static'
        this.app.stage.hitArea = this.app.screen
        let isDrawing = false
        this.app.stage.addEventListener('pointerdown', async (event) => {
            this.newClickListener(event.globalX, event.globalY, event.pointerId);
            isDrawing = true
        })
        this.app.stage.addEventListener('pointerup', (event) => {
            this.clickStopListener(event.pointerId)
            isDrawing = false
            this.columns?.touchUp()
        })
        this.app.stage.addEventListener('pointermove', (event) => {
            if (isDrawing) {
                this.drawListener(event.globalX, event.globalY, event.pointerId);
                this.columns?.touchDown(event.globalX)
            }
        })

        this.app.ticker.add(() => {
            this.tickListener(Date.now())
            this.ripples.tick()
            this.columns?.tick()
        });

        this.app.stage.addChild(this.ripples.graphics)
    }

    onDraw(callback: (x: number, y: number, pointerId: number) => void) {
        this.drawListener = callback
    }

    onNewClick(callback: (x: number, y: number, pointerId: number) => void) {
        this.newClickListener = callback
    }

    onClickStop(callback: (pointerId: number) => void) {
        this.clickStopListener = callback
    }

    onTick(callback: (millis: number) => void) {
        this.tickListener = callback
    }

    updateColumnCount(columns: number) {
        if (this.columns) {
            this.columns.count = columns
        }
    }

    clearLines(): void {
        this.app.stage.removeChild(...this.lines)
        for (let dot of this.lines) {
            dot.destroy()
        }
        this.lines = []
    }

    createLine(x: number, y: number, recordingId: number): void {
        const graphics = new Graphics()
        graphics.moveTo(x, y)
        this.lines[recordingId] = graphics
        this.app.stage.addChild(graphics)
    }

    connectPoints(points: { x: number, y: number }[], recordingId: number) {
        const graphics = this.lines[recordingId]
        for (let i = 0; i < points.length; i++) {
            const {x, y} = points[i]
            graphics.lineTo(x, y)
        }
        if (points.length > 0) {
            const last = points[points.length - 1]
            this.ripples.addRipple(last.x, last.y)
        }

        graphics.stroke({width: 4, color: colours[recordingId % colours.length]});
    }

    getDimensions(): { width: number; height: number } {
        return {width: this.app.renderer.width, height: this.app.renderer.height}
    }

    updateProgress(percent: number) {
        this.progress.destroy();
        this.progress = new Graphics();
        // draw line from bottom left to bottom right, scaled by percent
        this.progress.moveTo(screenPadding, this.app.renderer.height - screenPadding)
        this.progress.lineTo(screenPadding + percent * (this.app.renderer.width - 2 * screenPadding), this.app.renderer.height - screenPadding)
        this.progress.stroke({width: 4, color: 0xffd900});

        this.app.stage.addChild(this.progress);
    }
}

class Columns {
    count: number | undefined
    readonly graphics = new Graphics()
    private isActive = false
    private gradient: FillGradient

    constructor(private width: number, private height: number) {
        this.gradient = new FillGradient(0, height/2, 0, height)
            .addColorStop(0, {r: 255, g: 255, b: 255, a: 0})
            .addColorStop(1, {r: 255, g: 255, b: 255, a: 0.5})
    }

    touchDown(x: number) {
        if (!this.count) {
            return
        }
        this.isActive = true
        const index = Math.floor(x / this.width * this.count)
        const columnWidth = this.width / this.count
        this.graphics.clear()
            .rect(columnWidth * index, 0, columnWidth, this.height)
            .fill(this.gradient)
    }

    touchUp() {
        this.isActive = false
    }

    tick() {
        if (!this.count) {
            return
        }
        if (this.isActive) {
            this.graphics.alpha = 1
        } else {
            this.graphics.alpha *= 0.01
        }
    }
}

class Ripples {
    private readonly maxRipples = 32
    private readonly maxAgeMs = 300
    readonly graphics = new Graphics()
    readonly ripples: { x: number, y: number, creation: number, graphics: Graphics }[] = []

    addRipple(x: number, y: number) {
        while (this.ripples.length >= this.maxRipples) {
            const stale = this.ripples.shift()
            if (!stale) {
                throw new Error("Impossible")
            }
            this.graphics.removeChild(stale.graphics)
        }
        const creation = Date.now()
        const radius = this.radius(creation);
        const alpha = this.fade(creation)
        const graphics = new Graphics().circle(x, y, radius).fill({r: 1, g: 255, b: 3, a: alpha})
        this.ripples.push({x, y, creation, graphics})
        this.graphics.addChild(graphics)
    }

    tick() {
        const now = Date.now()
        while (this.ripples.length > 0 && this.ripples[0].creation + this.maxAgeMs < now) {
            // assuming ripples is sorted...
            const stale = this.ripples.shift()
            if (!stale) {
                throw new Error("Impossible")
            }
            this.graphics.removeChild(stale.graphics)
        }
        for (const ripple of this.ripples) {
            const {x, y, creation} = ripple
            const radius = this.radius(creation);
            const alpha = this.fade(creation)
            ripple.graphics.clear().circle(x, y, radius).stroke({r: 255, g: 255, b: 3, a: alpha})
        }
    }

    fade(creation: number) {
        const age = Date.now() - creation
        if (age === 0) {
            return 1;
        }
        return lerp(age, 0, this.maxAgeMs, 1, 0)
    }

    radius(creation: number) {
        return (Date.now() - creation)
    }
}