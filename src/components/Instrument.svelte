<script lang="ts">
    import {
        type Instrument, SoundFont,
        SplendidGrandPiano
    } from "./player.ts";
    import {Visualization} from "./Visualization.ts";
    import {Theremax} from "./Theremax.ts";
    import {getSoundfontNames} from "smplr";

    let instrument = "SplendidGrandPiano"

    let isInitialized = false;
    const visualization = new Visualization();

    let soundFonts: string[] = getSoundfontNames();

    async function init() {
        const element: HTMLElement | null = document.querySelector("#pixi");
        if (!element) {
            throw new Error("Element #pixi not found");
        }
        await visualization.init(element);

        const theremax = new Theremax(visualization)

        visualization.onDraw((x, y) => {
            theremax.moveDraw(x, y)
            const intervals = theremax.getIntervals()
            visualization.highlight(x, intervals);
        })

        visualization.onNewClick((x, y) => {
            let inst: Instrument;
            switch (instrument) {
                case "SplendidGrandPiano":
                    inst = new SplendidGrandPiano(theremax.context)
                    break;
                default:
                    inst = new SoundFont(theremax.context, instrument)
                    break;
            }
            theremax.beginDraw(x, y, inst)
        })

        visualization.onClickStop(() => {
            theremax.endDraw()
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
</style>

<button on:click={init}>Play</button>
<div id="pixi"></div>
{#if isInitialized}
    <ul class="instruments">
        <li class:selectedInstrument={instrument === "SplendidGrandPiano"}>
            <button on:click={() => instrument = "SplendidGrandPiano"}>Grand Piano</button>
        </li>
        {#each soundFonts as font}
            <li class:selectedInstrument={instrument === font}>
                <button on:click={() => instrument = font}>{font}</button>
            </li>
        {/each}
    </ul>
{/if}