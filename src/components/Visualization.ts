import {Application, Graphics} from "pixi.js";
import type {TheremaxVisualization} from "./Theremax.ts";

const screenPadding = 16;
const colours = [
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
    private drawListener: (x: number, y: number) => void = () => null
    private newClickListener: (x: number, y: number) => void = () => null
    private clickStopListener: () => void = () => null
    private tickListener: (millis: number) => void = () => null
    private columns: Graphics[] = []
    private dots: Graphics[] = []
    private progress = new Graphics();


    async init(element: HTMLElement) {
        await this.app.init({ width: element.clientWidth, height: element.clientHeight})
        // The application will create a canvas element for you that you
        // can then insert into the DOM
        element.appendChild(this.app.canvas);

        this.app.stage.addChild(this.progress)

        this.app.stage.eventMode = 'static'
        this.app.stage.hitArea = this.app.screen
        let isDrawing = false
        this.app.stage.addEventListener('pointerdown', async (event) => {
            this.newClickListener(event.globalX, event.globalY);
            isDrawing = true
        })
        this.app.stage.addEventListener('pointerup', (event) => {
            this.clickStopListener()
            isDrawing = false
        })
        this.app.stage.addEventListener('pointermove', (event) => {
            if (isDrawing) {
                this.drawListener(event.globalX, event.globalY);
            }
        })

        this.app.ticker.add(() => {
            for (let i = 0; i < this.columns.length; i++) {
                const column = this.columns[i];
                column.alpha *= 0.97;
            }
            this.tickListener(Date.now())
        });
    }

    getWidth() {
        return this.app.renderer.width;
    }

    getHeight() {
        return this.app.renderer.height;
    }

    onDraw(callback: (x: number, y: number) => void) {
        this.drawListener = callback
    }

    onNewClick(callback: (x: number, y: number) => void) {
        this.newClickListener = callback
    }

    onClickStop(callback: () => void) {
        this.clickStopListener = callback
    }

    onTick(callback: (millis: number) => void) {
        this.tickListener = callback
    }

    highlight(x: number, columns: number) {
        if (columns !== this.columns.length) {
            this.columns.forEach(c => c.destroy())
            this.app.stage.removeChild(...this.columns)
            this.columns = []
            const columnWidth = this.getWidth() / columns
            for (let i = 0; i < columns; i++) {
                const rect = new Graphics().rect(columnWidth * i, 0, columnWidth, this.getHeight());
                this.columns.push(rect)
            }
            this.app.stage.addChild(...this.columns)
        }
        const index = Math.floor(x / this.getWidth() * columns)
        this.columns[index].fill(0xffd900)
        this.columns[index].alpha = 1;
    }

    clearLines(): void {
        for (let dot of this.dots) {
            dot.destroy()
        }
        this.app.stage.removeChild(...this.dots)
        this.dots = []
    }

    drawPoint(x: number, y: number, recordingId: number): void {
        const dot = new Graphics().circle(x, y, 4).fill(colours[recordingId % colours.length]);
        this.dots.push(dot)
        this.app.stage.addChild(dot)
    }

    getDimensions(): { width: number; height: number } {
        return {width: this.app.renderer.width, height: this.app.renderer.height}
    }

    updateProgress(percent: number) {
        this.progress.destroy();
        this.progress = new Graphics();
        // draw line from bottom left to top left, scaled by percent
        this.progress.moveTo(screenPadding, this.app.renderer.height - screenPadding)
        this.progress.lineTo(screenPadding, this.app.renderer.height - screenPadding - percent * (this.app.renderer.height - 2 * screenPadding))
        // draw line from bottom left to bottom right, scaled by percent
        this.progress.moveTo(screenPadding, this.app.renderer.height - screenPadding)
        this.progress.lineTo(screenPadding + percent * (this.app.renderer.width - 2 * screenPadding), this.app.renderer.height - screenPadding)
        this.progress.stroke({width: 4, color: 0xffd900});

        this.app.stage.addChild(this.progress);
    }
}