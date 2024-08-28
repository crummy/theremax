export class Timer {
	private startTime: number | undefined;

	start() {
		this.startTime = Date.now();
	}

	getElapsedMs() {
		if (!this.startTime) {
			return 0;
		}
		return Date.now() - this.startTime;
	}

	reset() {
		this.startTime = Date.now();
	}
}
