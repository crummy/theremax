<script lang="ts">
    import {SoundFont} from "./player.ts";
    import {Visualization} from "./Visualization.ts";
    import {Theremax} from "./Theremax.ts";

    let isInitialized = false;
    const visualization = new Visualization();
    const theremax = new Theremax(visualization)

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

    async function init() {
        const element: HTMLElement | null = document.querySelector("#pixi");
        if (!element) {
            throw new Error("Element #pixi not found");
        }
        await visualization.init(element);
        await theremax.init();

        visualization.onDraw((x, y, pointerId) => {
            theremax.moveDraw(x, y, pointerId)
            const intervals = theremax.getIntervals()
            if (intervals) {
                visualization.highlightColumn(x, intervals);
            }
        })

        visualization.onNewClick((x, y, pointerId) => {
            const inst = new SoundFont(theremax.getContext(), instrument)
            theremax.beginDraw(x, y, pointerId, inst)
        })

        visualization.onClickStop((pointerId) => {
            theremax.endDraw(pointerId)
        })

        visualization.onTick(() => {
            theremax.tick()
            visualization.updateProgress(theremax.getPercentComplete())
        })

        isInitialized = true
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

    #pixi {
        flex-grow: 1;
    }

    :global(body) {
        padding: 0;
        margin: 0;
        width: 100dvw;
        height: 100dvh;
        overflow: hidden;
    }
</style>

<div id="instrument">
    <div id="controls">
        {#if isInitialized}
            <button on:click={reset}>Reset</button>
        {:else}
            <button on:click={init}>Play</button>
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
    <div id="pixi"></div>
</div>