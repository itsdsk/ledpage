<script>
    import {
        config_settings,
        config,
        showConnectionMessage,
    } from "./client_data.js";
    import PowerButtons from "./PowerButtons.svelte";
    import MapContainer from "./MapContainer.svelte";
    import MapChain from "./MapChain.svelte";
    import MenuToggle from "./MenuToggle.svelte";
    import Menu from "./Menu.svelte";

    let activeOutputChain = null;

    let windowWidth = 10;

    let showSidePanel = false;
    let autoToggleSidePanel = false;
    $: if ($showConnectionMessage) {
        showSidePanel = autoToggleSidePanel = true;
    } else if (autoToggleSidePanel) {
        showSidePanel = autoToggleSidePanel = false;
    }
</script>

<section>
    <header>
        <nav>
            {#if windowWidth < 1536}
                <MenuToggle on:click={() => (showSidePanel = !showSidePanel)} />
            {/if}
            <PowerButtons />
        </nav>
        {#if $config}
            <div>
                <MapContainer>
                    {#each $config.outputs as output, i}
                        <MapChain
                            {output}
                            selected={activeOutputChain == i ? true : false}
                            on:click={() => (activeOutputChain = i)}
                        />
                    {/each}
                </MapContainer>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    {#each $config.outputs as output, i}
                        <tr
                            class:selected={activeOutputChain === i}
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
            <div>
                <button
                    type="submit"
                    class="submit"
                    on:click|preventDefault={() => {
                        var settingsStr =
                            document.querySelector("#settings").innerHTML;
                        try {
                            var settingsJSON = JSON.parse(settingsStr);
                            if (
                                window.confirm(
                                    "Are you sure you want to save a new settings file?"
                                )
                            ) {
                                // check if values have changed
                                for (const [key, value] of Object.entries(
                                    settingsJSON
                                )) {
                                    if (
                                        typeof value === "object" &&
                                        value !== null
                                    ) {
                                        if (key == "autoplayDuration") {
                                            if (
                                                value.min !==
                                                $config_settings
                                                    .autoplayDuration.min
                                            ) {
                                                var data = {
                                                    name: "autoplayMinRange",
                                                    value: value.min,
                                                };
                                                socket.emit(
                                                    "config/update",
                                                    data
                                                );
                                            }
                                            if (
                                                value.max !==
                                                $config_settings
                                                    .autoplayDuration.max
                                            ) {
                                                console.log(
                                                    `changed autoplay max`
                                                );
                                                var data = {
                                                    name: "autoplayMaxRange",
                                                    value: value.max,
                                                };
                                                socket.emit(
                                                    "config/update",
                                                    data
                                                );
                                            }
                                        }
                                    } else if (
                                        value !== $config_settings[key]
                                    ) {
                                        var data = {
                                            name: key,
                                            value: value,
                                        };
                                        socket.emit("config/update", data);
                                    }
                                }
                                socket.emit("saveconfig");
                            }
                        } catch (exception) {
                            alert("Error parsing json: " + exception);
                        }
                    }}>Save</button
                >
            </div>
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
            <button
                type="submit"
                class="submit"
                on:click|preventDefault={() => {
                    var configStr = document.querySelector("#config").innerHTML;
                    try {
                        var configJSON = JSON.parse(configStr);
                        if (
                            window.confirm(
                                "Are you sure you want to save a new configuration file?"
                            )
                        )
                            socket.emit("updateconfigfile", configJSON);
                    } catch (exception) {
                        alert("Error parsing json: " + exception);
                    }
                }}>Save</button
            >
        {/if}
    </article>
    {#if windowWidth > 1536 || showSidePanel}
        <Menu
            active={"setup"}
            on:click={() => (showSidePanel = autoToggleSidePanel = false)}
        />
    {/if}
</section>

<svelte:window bind:innerWidth={windowWidth} />

<style>
    tr.selected {
        text-decoration: underline dotted;
    }

    pre {
        border: 1px solid #595959;
        border-radius: 3.6px;
        padding: 0.3375rem 0.39375rem;
    }

    table {
        width: auto;
    }

    .power {
        background: #db423c;
        color: white;
        padding: 0.407813rem;
        margin: 0 0 1.125rem 0.45rem;
    }
</style>
