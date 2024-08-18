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

    let theremin: Theremin
    let synth: Synth
    let amSynth: AMSynth
    let fmSynth: FMSynth
    let duoSynth: DuoSynth
    let membraneSynth: MembraneSynth
    let metalSynth: MetalSynth
    let monoSynth: MonoSynth
    let pluckSynth: PluckSynth
    let sampler: Sampler

    let instrument: Instrument
    let isInitialized = false;
    const visualization = new Visualization();

    async function init() {
        // initialize these late, once users have interacted with page, or we get a bunch of browser warnings
        theremin = new Theremin()
        synth = new Synth()
        amSynth = new AMSynth()
        fmSynth = new FMSynth()
        duoSynth = new DuoSynth()
        membraneSynth = new MembraneSynth()
        metalSynth = new MetalSynth()
        monoSynth = new MonoSynth()
        pluckSynth = new PluckSynth()
        sampler = new Sampler()
        instrument = duoSynth

        const element: HTMLElement | null = document.querySelector("#pixi");
        if (!element) {
            throw new Error("Element #pixi not found");
        }
        await visualization.init(element);

        const theremax = new Theremax(visualization)

        visualization.onDraw((x, y) => {
            theremax.moveDraw(x, y)
            visualization.highlight(x, instrument.getIntervals());
        })

        visualization.onNewClick((x, y) => {
            theremax.beginDraw(x, y, instrument)
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
        <li class:selectedInstrument={instrument === theremin}>
            <button on:click={() => instrument = theremin}>Theremin</button>
        </li>
        <li class:selectedInstrument={instrument === synth}>
            <button on:click={() => instrument = synth}>Synth</button>
        </li>
        <li class:selectedInstrument={instrument === amSynth}>
            <button on:click={() => instrument = amSynth}>AM Synth</button>
        </li>
        <li class:selectedInstrument={instrument === fmSynth}>
            <button on:click={() => instrument = fmSynth}>FM Synth</button>
        </li>
        <li class:selectedInstrument={instrument === duoSynth}>
            <button on:click={() => instrument = duoSynth}>Duo Synth</button>
        </li>
        <li class:selectedInstrument={instrument === membraneSynth}>
            <button on:click={() => instrument = membraneSynth}>Membrane Synth</button>
        </li>
        <li class:selectedInstrument={instrument === metalSynth}>
            <button on:click={() => instrument = metalSynth}>Metal Synth</button>
        </li>
        <li class:selectedInstrument={instrument === monoSynth}>
            <button on:click={() => instrument = monoSynth}>Mono Synth</button>
        </li>
        <li class:selectedInstrument={instrument === pluckSynth}>
            <button on:click={() => instrument = pluckSynth}>Pluck Synth</button>
        </li>
        <li class:selectedInstrument={instrument === sampler}>
            <button on:click={() => instrument = sampler}>Sampler</button>
        </li>
    </ul>
{/if}