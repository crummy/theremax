<script lang="ts">
    import {
        type Instrument,
        Synth,
        Theremin,
        AMSynth,
        FMSynth,
        MembraneSynth,
        MetalSynth,
        MonoSynth, PluckSynth, DuoSynth, Sampler
    } from "./player.ts";
    import {Visualization} from "./Visualization.ts";
    import {Theremax} from "./Theremax.ts";

    let instrument = "duoSynth"

    let isInitialized = false;
    const visualization = new Visualization();

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
            switch(instrument) {
                case "theremin":
                    inst = new Theremin()
                    break;
                case "synth":
                    inst = new Synth()
                    break;
                case "amSynth":
                    inst = new AMSynth()
                    break;
                case "fmSynth":
                    inst = new FMSynth()
                    break;
                case "duoSynth":
                    inst = new DuoSynth()
                    break;
                case "membraneSynth":
                    inst = new MembraneSynth()
                    break;
                case "metalSynth":
                    inst = new MetalSynth()
                    break;
                case "monoSynth":
                    inst = new MonoSynth()
                    break;
                case "pluckSynth":
                    inst = new PluckSynth()
                    break;
                case "sampler":
                    inst = new Sampler()
                    break;
                default:
                    throw new Error("Unknown instrument " + instrument)
            }
            theremax.beginDraw(x, y, inst)
        })

        visualization.onClickStop(() => {
            theremax.endDraw()
        })

        visualization.onTick(() => {
            theremax.tick()
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
        <li class:selectedInstrument={instrument === "theremin"}>
            <button on:click={() => instrument = "theremin"}>Theremin</button>
        </li>
        <li class:selectedInstrument={instrument === "synth"}>
            <button on:click={() => instrument = "synth"}>Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "amSynth"}>
            <button on:click={() => instrument = "amSynth"}>AM Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "fmSynth"}>
            <button on:click={() => instrument = "fmSynth"}>FM Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "duoSynth"}>
            <button on:click={() => instrument = "duoSynth"}>Duo Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "membraneSynth"}>
            <button on:click={() => instrument = "membraneSynth"}>Membrane Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "metalSynth"}>
            <button on:click={() => instrument = "metalSynth"}>Metal Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "monoSynth"}>
            <button on:click={() => instrument = "monoSynth"}>Mono Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "pluckSynth"}>
            <button on:click={() => instrument = "pluckSynth"}>Pluck Synth</button>
        </li>
        <li class:selectedInstrument={instrument === "sampler"}>
            <button on:click={() => instrument = "sampler"}>Sampler</button>
        </li>
    </ul>
{/if}