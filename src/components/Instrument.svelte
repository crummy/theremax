<script lang="ts">
    import {onMount} from "svelte";
    import {render} from "./ui.ts";

    onMount(() => {
        render(document.querySelector("#pixi"))
    });
</script>

<div id="pixi"></div>