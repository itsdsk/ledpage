<script>
    import { config_settings, config } from "./client_data.js";
    import MapContainer from "./MapContainer.svelte";
    import MapChain from "./MapChain.svelte";

    let activeOutputChain = null;
</script>

<section>
    <header>
        <h1>
            Setup
        </h1>
        {#if $config}
            <div>
                <MapContainer>
                    {#each $config.outputs as output, i}
                        <MapChain
                            {output}
                            visibility={activeOutputChain == i
                                ? "visible"
                                : "hidden"}
                            on:click={() => (activeOutputChain = i)}
                        />
                    {/each}
                </MapContainer>
            </div>
            <table>
                <thead style="display:table-header-group;">
                    <tr>
                        <th>Type</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {#each $config.outputs as output, i}
                        <tr
                            class:activeOutputChain={activeOutputChain === i}
                            on:click={() =>
                                (activeOutputChain =
                                    activeOutputChain === i ? null : i)}
                        >
                            <td>{output.type}</td>
                            <td>{output.leds.length}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </header>
</section>

<style>
    table {
        display: table;
        width: auto;
    }

    td,
    th {
        display: table-cell;
        border-bottom: 1.08px solid #595959;
        padding: 0.4078125rem 1.125rem;
    }

    thead {
        display: table-header-group;
    }

    tbody {
        display: table-row-group;
    }

    tr {
        display: table-row;
    }

    thead th {
        border-bottom-width: 2.16px;
    }
</style>
