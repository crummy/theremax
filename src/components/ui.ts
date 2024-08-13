import {Application, Sprite, Assets, Graphics} from 'pixi.js';

const screenPadding = 16;

export async function render(element: Element) {

    // The application will create a renderer using WebGL, if possible,
    // with a fallback to a canvas render. It will also set up the ticker
    // and the root stage PIXI.Container
    const app = new Application();

    // Wait for the Renderer to be available
    await app.init();

    // The application will create a canvas element for you that you
    // can then insert into the DOM
    element.appendChild(app.canvas);

    const graphics = new Graphics();

    graphics.moveTo(screenPadding, screenPadding);
    graphics.lineTo(screenPadding, app.renderer.height - screenPadding);
    graphics.lineTo(app.renderer.width - screenPadding, app.renderer.height - screenPadding);
    graphics.stroke({ width: 4, color: 0xffd900 });

    app.stage.addChild(graphics);

    app.stage.eventMode = 'static'
    app.stage.hitArea = app.screen
    let isDrawing = false
    app.stage.addEventListener('pointerdown', (event) => {
        graphics.beginPath()
        graphics.moveTo(event.globalX, event.globalY)
        isDrawing = true
    })
    app.stage.addEventListener('pointerup', (event) => {
        isDrawing = false
        graphics.closePath()
    })
    app.stage.addEventListener('pointermove', (event) => {
        if (isDrawing) {
            graphics.lineTo(event.globalX, event.globalY)
            graphics.stroke({ width: 4, color: 0xffd900 });
        }
    })

    // Listen for frame updates
    app.ticker.add(() => {
        // each frame we spin the bunny around a bit
    });
}