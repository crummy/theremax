export class Timer {
    private start: number;

    constructor() {
        this.start = Date.now()
    }

    getElapsedMs() {
        return Date.now() - this.start;
    }

    reset() {
        this.start = Date.now();
    }
}