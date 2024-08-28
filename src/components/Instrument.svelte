<script lang="ts">
import p5 from "p5";
import { onMount } from "svelte";
import { Theremax } from "./Theremax.ts";
import { VisualizationP5 } from "./VisualizationP5.ts";
import { SoundFont, soundFonts } from "./player.ts";

let isInitialized = false;

let theremax: Theremax;
let visualization: ReturnType<typeof VisualizationP5>;
onMount(() => {
	const element = document.getElementById("sketch");
	if (!element) {
		throw new Error("Could not find sketch element");
	}
	new p5((p) => {
		visualization = VisualizationP5(p, element);
		return visualization;
	}, element);

	visualization.onDraw((x, y, pointerId) => {
		theremax?.moveDraw(x, y, pointerId);
	});

	visualization.onNewClick(async (x, y, pointerId, instrumentName) => {
		if (!isInitialized) {
			theremax = new Theremax(visualization);
			await theremax.init();
			isInitialized = true;
		}
		const inst = new SoundFont(theremax.getContext(), instrumentName);
		visualization.updateColumnCount(inst.getIntervals());
		const { recordingId } = theremax.beginDraw(x, y, pointerId, inst);
		visualization.createLine(x, y, recordingId);
	});

	visualization.onClickStop((pointerId) => theremax?.endDraw(pointerId));

	visualization.onReset(() => theremax?.reset());

	visualization.onTick(() => {
		if (!isInitialized) {
			return;
		}
		const recordings = theremax.tick();
		for (const [recordingId, points] of Object.entries(recordings)) {
			visualization.addPoints(points, Number.parseInt(recordingId));
		}
		visualization.updateProgress(theremax.getPercentComplete());
	});
});
</script>

<style>
    #instrument {
        display: flex;
        flex-direction: column;
        height: 100dvh;
    }

    #sketch {
        flex-grow: 1;
    }

    :global(body) {
        padding: 0;
        margin: 0;
        width: 100dvw;
        height: 100dvh;
        overflow: hidden;
    }

    /* disable zoom on mobile */
    :global(:root) {
        touch-action: pan-x pan-y;
        height: 100%
    }
</style>

<div id="instrument">
    <div id="sketch"></div>
</div>