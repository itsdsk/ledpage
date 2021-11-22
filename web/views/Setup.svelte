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

    $: if ($config_settings.title) {
        document.title = `Setup - ${$config_settings.title}`;
    } else {
        document.title = "Setup - Untitled";
    }

    let activeOutputChain = -1;
    let activeNode = -1;

    let windowWidth = 10;

    let showSidePanel = false;
    let autoToggleSidePanel = false;
    $: if ($showConnectionMessage) {
        showSidePanel = autoToggleSidePanel = true;
    } else if (autoToggleSidePanel) {
        showSidePanel = autoToggleSidePanel = false;
    }

    let totalNodes = 0;
    $: if ($config.outputs && $config.outputs.length > 0) {
        totalNodes = $config.outputs.reduce(
            (acc, cur) => acc + cur.leds.length,
            0
        );
    }

    let svg;
</script>

<svelte:body
    on:click={(e) => {
        if (svg.contains(e.target) == false) {
            activeOutputChain = activeNode = -1;
        }
    }} />

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
                <span bind:this={svg}>
                    <MapContainer>
                        {#each $config.outputs as output, i}
                            <MapChain
                                {output}
                                selected={activeOutputChain == i}
                                nodeIndex={activeOutputChain == i
                                    ? activeNode
                                    : -1}
                                on:click={(e) => {
                                    activeOutputChain = i;
                                    activeNode = parseInt(
                                        e.target.dataset.index
                                    );
                                }}
                            />
                        {/each}
                    </MapContainer>
                </span>
            </div>
            <p>
                {#if activeOutputChain == -1}
                    Showing {totalNodes} nodes on {$config.outputs.length}
                    {$config.outputs.length < 2 ? "device" : "devices"}.
                {:else}
                    Node {activeNode + 1}, device
                    {activeOutputChain + 1}.
                {/if}
            </p>
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
                                                window.socket.emit(
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
                                                window.socket.emit(
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
                                        window.socket.emit(
                                            "config/update",
                                            data
                                        );
                                    }
                                }
                                window.socket.emit("saveconfig");
                            }
                        } catch (exception) {
                            alert("Error parsing json: " + exception);
                        }
                    }}>Save</button
                >
                <p>
                    Make sure <code>settings.json</code> is valid before saving.
                </p>
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
                            window.socket.emit("updateconfigfile", configJSON);
                    } catch (exception) {
                        alert("Error parsing json: " + exception);
                    }
                }}>Save</button
            >
            <p>
                Make sure <code>config.json</code> is valid before saving.
            </p>
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
    pre {
        border: 1px solid #595959;
        border-radius: 3.6px;
        padding: 0.3375rem 0.39375rem;
    }

    .submit {
        background: #2a6f3b;
        float: right;
        margin-right: 0;
        margin-left: 0.45rem;
    }
</style>
