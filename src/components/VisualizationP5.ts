import p5 from "p5";

export const screenPadding = 16;
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

export const VisualizationP5 = (p: p5, element: HTMLElement) => {
    let lines: { [recordingId: number]: { x: number, y: number }[] } = {}

    let isInitialized = false
    let drawListener: (x: number, y: number, pointerId: number) => void = () => null
    let newClickListener: (x: number, y: number, pointerId: number) => void = () => null
    let clickStopListener: (pointerId: number) => void = () => null
    let tickListener: () => void = () => null
    let resetListener: () => void = () => null
    let progress = 0
    let resetIcon: p5.Image
    const resetButton = {x: screenPadding, y: screenPadding, width: 64, height: 64}

    p.setup = () => {
        p.resizeCanvas(element.clientWidth, element.clientHeight)
        p.fill(200, 200, 200)
        p.rect(p.width / 2 - 200, p.height / 2 - 20, 400, 40)
        p.fill(100, 100, 100)
        p.text("Welcome to the Theremax. Click anywhere to start", p.width / 2, p.height / 2)
    }

    p.preload = () => {
        resetIcon = p.loadImage("theremax/reset.png")
    }

    p.draw = () => {
        if (!isInitialized) {
            return
        }
        p.background("black")
        for (let [recordingId, line] of Object.entries(lines)) {
            const colour = colours[parseInt(recordingId) % colours.length]
            const red = (colour >> 16) & 0xFF
            const green = (colour >> 8) & 0xFF
            const blue = colour & 0xFF
            p.stroke(red, green, blue)
            let from = line[0]
            for (let j = 1; j < line.length; j++) {
                const to = line[j]
                p.line(from.x, from.y, to.x, to.y)
                from = to
            }
        }
        p.image(resetIcon, resetButton.x, resetButton.y, resetButton.width, resetButton.height);
        p.stroke("white")
        p.line(screenPadding, p.height - screenPadding, (p.width - screenPadding) * progress, p.height - screenPadding)
        tickListener()
    }

    function didClick(button: { x: number; width: number; y: number; height: number }) {
        return p.mouseX >= button.x &&
            p.mouseX <= button.x + button.width &&
            p.mouseY >= button.y &&
            p.mouseY <= button.y + button.height;
    }

    p.mousePressed = () => {
        if (!isInitialized) {
            isInitialized = true
            return
        }
        if (didClick(resetButton)) {
            resetListener()
        }
        newClickListener(p.mouseX, p.mouseY, 0)
    }

    p.mouseReleased = () => {
        if (!isInitialized) {
            return
        }
        clickStopListener(0)
    }

    p.mouseDragged = () => {
        if (!isInitialized) {
            return
        }
        drawListener(p.mouseX, p.mouseY, 0)
    }

    function clearLines() {
        lines = {}
    }

    function createLine(x: number, y: number, recordingId: number) {
        lines[recordingId] = []
        lines[recordingId].push({x, y})
    }

    function getDimensions(): { width: number, height: number } {
        return {width: p.width, height: p.height}
    }

    function addPoints(points: { x: number; y: number; }[], recordingId: number) {
        let line = lines[recordingId]
        if (!line) {
            line = []
            lines[recordingId] = line
        }
        line.push(...points)
    }

    function onDraw(callback: (x: number, y: number, pointerId: number) => void) {
        drawListener = callback
    }

    function onNewClick(callback: (x: number, y: number, pointerId: number) => void) {
        newClickListener = callback
    }

    function onClickStop(callback: (pointerId: number) => void) {
        clickStopListener = callback
    }

    function onTick(callback: () => void) {
        tickListener = callback
    }

    function onReset(callback: () => void) {
        resetListener = callback
    }

    function updateColumnCount(columns: number) {
        if (columns) {
            // columns.count = columns
        }
    }

    function updateProgress(percent: number) {
        progress = percent
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
        updateProgress
    }
}