<script lang="ts">
    import {SoundFont} from "./player.ts";
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

        visualization.onTick(() => {
            if (!isInitialized) {
                return
            }
            const recordings = theremax.tick()
            for (let i = 0; i < recordings.length; i++) {
                let recording = recordings[i];
                visualization.addPoints(recording, i)
            }
            visualization.updateProgress(theremax.getPercentComplete())
        })
    })

    let soundFonts: string[] = [
        "acoustic_grand_piano",
        "alto_sax",
        "bird_tweet",
        "breath_noise",
        "cello",
        "church_organ",
        "electric_bass_pick",
        "flute",
        "fx_3_crystal",
        "fx_4_atmosphere",
        "melodic_tom",
        "music_box",
        "seashore",
        "taiko_drum",
        "tinkle_bell",
        "viola",
        "trombone",
        "xylophone",
        "voice_oohs",
    ]
    let instrument = soundFonts[Math.floor(Math.random() * soundFonts.length)];

    function reset() {
        theremax.reset();
    }
</script>

<style>
    .selectedInstrument > button {
        font-weight: bold;
    }

    #controls {
        display: flex;
        width: 100%;
        padding: 1em;
        height: 3em;
    }

    #controls ul {
        list-style: none;
        display: flex;
        overflow-x: scroll;
        margin: 0;
    }

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
    <div id="controls">
        {#if isInitialized}
            <button on:click={reset}>Reset</button>
        {/if}
        {#if isInitialized}
            <ul class="instruments">
                {#each soundFonts as font}
                    <li class:selectedInstrument={instrument === font}>
                        <button on:click={() => instrument = font}>{font}</button>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    <div id="sketch"></div>
</div>