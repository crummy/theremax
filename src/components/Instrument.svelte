<script lang="ts">
    import {type Instrument, Piano, Player, Theremin} from "./player.ts";
    import {Visualization} from "./Visualization.ts";

    const theremin = new Theremin()
    const piano = new Piano()

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
        <li><button on:click={() => changeInstrument(piano)}>Piano</button></li>
    </ul>
{/if}