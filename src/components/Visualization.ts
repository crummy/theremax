import {Application, Color, Graphics, Rectangle} from "pixi.js";

const screenPadding = 16;

export class Visualization {
    private readonly app = new Application();
    private drawListener: (x: number, y: number) => void = () => null
    private columns: Graphics[] = []

    async init(element: HTMLElement) {
        await this.app.init()
        // The application will create a canvas element for you that you
        // can then insert into the DOM
        element.appendChild(this.app.canvas);

        const graphics = new Graphics();

        graphics.moveTo(screenPadding, screenPadding);
        graphics.lineTo(screenPadding, this.app.renderer.height - screenPadding);
        graphics.lineTo(this.app.renderer.width - screenPadding, this.app.renderer.height - screenPadding);
        graphics.stroke({ width: 4, color: 0xffd900 });

        this.app.stage.addChild(graphics);

        this.app.stage.eventMode = 'static'
        this.app.stage.hitArea = this.app.screen
        let isDrawing = false
        this.app.stage.addEventListener('pointerdown', async (event) => {
            graphics.beginPath()
            graphics.moveTo(event.globalX, event.globalY)
            isDrawing = true
        })
        this.app.stage.addEventListener('pointerup', (event) => {
            isDrawing = false
            graphics.closePath()
        })
        this.app.stage.addEventListener('pointermove', (event) => {
            if (isDrawing) {
                this.drawListener(event.globalX, event.globalY);
                graphics.lineTo(event.globalX, event.globalY)
                graphics.stroke({ width: 4, color: 0xffd900 });
            }
        })

        this.app.ticker.add(() => {
            for (let i = 0; i < this.columns.length; i++) {
                const column = this.columns[i];
                column.alpha *= 0.97;
            }
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

    highlight(x: number, columns: number) {
        if (columns !== this.columns.length) {
            this.columns.forEach(c => c.destroy())
            this.app.stage.removeChild(...this.columns)
            this.columns = []
            const columnWidth = this.app.renderer.width / columns
            for (let i = 0; i < columns; i++) {
                const rect = new Graphics().rect(columnWidth * i, 0, columnWidth, this.getHeight());
                this.columns.push(rect)
            }
            this.app.stage.addChild(...this.columns)
        }
        const index = Math.floor(x / this.app.renderer.width * columns)
        this.columns[index].fill(0xffd900)
        this.columns[index].alpha = 1;
    }
}