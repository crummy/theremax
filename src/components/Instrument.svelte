<script lang="ts">
    import {SoundFont, soundFonts} from "./player.ts";
    import {Theremax} from "./Theremax.ts";
    import p5 from 'p5'
    import {VisualizationP5} from "./VisualizationP5.ts";
    import {onMount} from "svelte";

    let isInitialized = false;

    let theremax: Theremax
    let visualization: ReturnType<typeof VisualizationP5>;
    onMount(() => {
        const element = document.getElementById('sketch');
        if (!element) {
            throw new Error("Could not find sketch element")
        }
        new p5((p) => {
            visualization = VisualizationP5(p, element);
            return visualization
        }, element)

        visualization.onDraw((x, y, pointerId) => {
            theremax?.moveDraw(x, y, pointerId)
        })

        visualization.onNewClick(async (x, y, pointerId) => {
            if (!isInitialized) {
                theremax = new Theremax(visualization)
                await theremax.init();
                isInitialized = true
            }
            const inst = new SoundFont(theremax.getContext(), instrument)
            visualization.updateColumnCount(inst.getIntervals())
            const {recordingId} = theremax.beginDraw(x, y, pointerId, inst)
            visualization.createLine(x, y, recordingId)
        })

        visualization.onClickStop((pointerId) => {
            theremax?.endDraw(pointerId)
        })

        visualization.onReset(reset)

        visualization.onSelectInstrument(inst => instrument = inst)

        visualization.onTick(() => {
            if (!isInitialized) {
                return
            }
            const recordings = theremax.tick()
            for (let [recordingId, points] of Object.entries(recordings)) {
                visualization.addPoints(points, parseInt(recordingId))
            }
            visualization.updateProgress(theremax.getPercentComplete())
        })
    })

    let instrument = soundFonts[Math.floor(Math.random() * soundFonts.length)];

    function reset() {
        theremax?.reset();
    }
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