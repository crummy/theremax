import p5 from "p5";
import {colours} from "./Visualization.ts";

export const VisualizationP5 = (p: p5, element: HTMLElement) => {
    let lines: { x: number, y: number }[][] = []
    let isInitialized = false
    let drawListener: (x: number, y: number, pointerId: number) => void = () => null
    let newClickListener: (x: number, y: number, pointerId: number) => void = () => null
    let clickStopListener: (pointerId: number) => void = () => null
    let tickListener: () => void = () => null

    p.setup = () => {
        p.resizeCanvas(element.clientWidth, element.clientHeight)
        p.fill(200, 200, 200)
        p.rect(p.width / 2 - 200, p.height / 2 - 20, 400, 40)
        p.fill(100, 100, 100)
        p.text("Welcome to the Theremax. Click anywhere to start", p.width / 2, p.height / 2)
    }

    p.draw = () => {
        if (!isInitialized) {
            return
        }
        p.background("black")
        for (let i = 0; i < lines.length; i++){
            const line = lines[i];
            const colour = colours[i % colours.length]
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
        tickListener()
    }

    p.mousePressed = () => {
        if (!isInitialized) {
            isInitialized = true
            return
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
        lines = []
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

    function updateColumnCount(columns: number) {
        if (columns) {
            // columns.count = columns
        }
    }

    function updateProgress(percent: number) {

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
        updateColumnCount,
        updateProgress
    }
}