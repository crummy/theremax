<script lang="ts">
    import {
        type Instrument,
        Synth,
        Player,
        Theremin,
        AMSynth,
        FMSynth,
        MembraneSynth,
        MetalSynth,
        MonoSynth, PluckSynth, DuoSynth
    } from "./player.ts";
    import {Visualization} from "./Visualization.ts";

    const theremin = new Theremin()
    const synth = new Synth()
    const amSynth = new AMSynth()
    const fmSynth = new FMSynth()
    const duoSynth = new DuoSynth()
    const membraneSynth = new MembraneSynth()
    const metalSynth = new MetalSynth()
    const monoSynth = new MonoSynth()
    const pluckSynth = new PluckSynth()

    let player: Player
    let isInitialized = false;
    const visualization = new Visualization();

    async function init() {
        await visualization.init(document.querySelector("#pixi"));

        player = new Player(visualization.getWidth(), visualization.getHeight())

        visualization.onDraw((x, y) => {
            player.play(x, y)
            visualization.highlight(x, player.instrument.getIntervals());
        })

        const theremin = new Theremin()
        await player.init(theremin)
        isInitialized = true
    }

    function changeInstrument(instrument: Instrument) {
        player.setInstrument(instrument)
    }
</script>

<button on:click={init}>Play</button>
<div id="pixi"></div>
{#if isInitialized}
    <ul class="instruments">
        <li><button  on:click={() => changeInstrument(theremin)}>Theremin</button></li>
        <li><button on:click={() => changeInstrument(synth)}>Synth</button></li>
        <li><button on:click={() => changeInstrument(amSynth)}>AM Synth</button></li>
        <li><button on:click={() => changeInstrument(fmSynth)}>FM Synth</button></li>
        <li><button on:click={() => changeInstrument(duoSynth)}>Duo Synth</button></li>
        <li><button on:click={() => changeInstrument(membraneSynth)}>Membrane Synth</button></li>
        <li><button on:click={() => changeInstrument(metalSynth)}>Metal Synth</button></li>
        <li><button on:click={() => changeInstrument(monoSynth)}>Mono Synth</button></li>
        <li><button on:click={() => changeInstrument(pluckSynth)}>Pluck Synth</button></li>
    </ul>
{/if}