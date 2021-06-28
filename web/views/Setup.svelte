<script>
    import { config_settings, config } from "./client_data.js";
    import MapContainer from "./MapContainer.svelte";
    import MapChain from "./MapChain.svelte";

    let activeOutputChain = null;
</script>

<section>
    <header>
        <h1>
            <span style="float:right;">
                <button
                    type="button"
                    class="power"
                    on:click|preventDefault={() => {
                        if (window.confirm("Do you really want to reboot?"))
                            socket.emit("systempower", "reboot");
                    }}
                >
                    Restart
                </button>
                <button
                    type="button"
                    class="power"
                    on:click|preventDefault={() => {
                        if (window.confirm("Do you really want to shutdown?"))
                            socket.emit("systempower", "shutdown");
                    }}
                >
                    Shutdown
                </button>
            </span>
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
    <article>
        {#if $config_settings}
            <h3>settings.json</h3>
            <pre
                id="settings"
                spellcheck="false"
                contenteditable="true"
                role="textbox"
                on:paste|preventDefault={(e) => {
                    var text = e.clipboardData.getData("text/plain");
                    document.execCommand("insertHTML", false, text);
                }}>
                {JSON.stringify($config_settings, null, 2)}
            </pre>
        {/if}
        {#if $config}
            <h3>config.json</h3>
            <pre
                id="config"
                spellcheck="false"
                contenteditable="true"
                role="textbox"
                on:paste|preventDefault={(e) => {
                    var text = e.clipboardData.getData("text/plain");
                    document.execCommand("insertHTML", false, text);
                }}>
                {JSON.stringify($config, null, 2)}
            </pre>
        {/if}
    </article>
</section>

<style>
    pre {
        border: 1px solid #595959;
        border-radius: 3.6px;
        padding: 0.3375rem 0.39375rem;
    }

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

    .power {
        background: #db423c;
        color: white;
        padding: 0.407813rem;
        margin: 0 0 1.125rem 0.45rem;
    }
</style>
