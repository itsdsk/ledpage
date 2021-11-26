<script>
    import {
        livePlaybackStatus,
        mediaFeedObjects,
        channelObjects,
        config_settings,
    } from "./client_data";

    export let libraryIndex = -1;

    let nowPlayingURL = "/";
    $: if (libraryIndex < 0) {
        if ($livePlaybackStatus.nowPlaying) {
            nowPlayingURL = $livePlaybackStatus.nowPlaying.directory;
        } else {
            nowPlayingURL = "/";
        }
    } else {
        nowPlayingURL = $mediaFeedObjects[libraryIndex].source;
    }

    // sorted media channels
    let playingChannels = [];
    $: updatePlayingChannels(
        libraryIndex,
        $livePlaybackStatus.channel,
        $mediaFeedObjects[libraryIndex]
    );
    function updatePlayingChannels() {
        //
        if (libraryIndex >= 0) {
            // move currently-playing-channel to front of array
            playingChannels = [
                $mediaFeedObjects[libraryIndex].channels.find(
                    (item) => item === $livePlaybackStatus.channel
                ),
                ...$mediaFeedObjects[libraryIndex].channels.filter(
                    (item) => item !== $livePlaybackStatus.channel
                ),
            ];
        } else {
            playingChannels = [];
        }
    }

    function downloadURL() {
        if ($livePlaybackStatus.nowPlaying.directory.length > 0) {
            // URL is validated
            window.socket.emit(
                "createmediaURL",
                $livePlaybackStatus.nowPlaying.directory
            );
        } else {
            console.log("cannot create media from URL as it is invalid");
        }
    }

    let open = false;
</script>

<div class="main">
    <h3
        class="title"
        title={libraryIndex >= 0
            ? $mediaFeedObjects[libraryIndex].title
            : $livePlaybackStatus.nowPlaying
            ? $livePlaybackStatus.nowPlaying.directory
            : "Untitled"}
    >
        {#if libraryIndex >= 0}
            {$mediaFeedObjects[libraryIndex].title}
        {:else if $livePlaybackStatus.nowPlaying}
            {$livePlaybackStatus.nowPlaying.directory}
        {:else}
            Untitled
        {/if}
    </h3>
    <div class="url">
        <a href={nowPlayingURL} target="_blank">
            {nowPlayingURL}
        </a>
    </div>
    <div class="openable">
        <div>
            <form
                on:submit|preventDefault={() => {
                    return false;
                }}
            >
                <div class="label">Brightness:</div>
                <div class="buttons" class:buttons__brightness={open}>
                    <input
                        type="number"
                        min="0.0"
                        max="100"
                        step="0.1"
                        list="brightnesses"
                        class="brightness"
                        placeholder="{$config_settings.brightness
                            ? ($config_settings.brightness * 100).toFixed(
                                  $config_settings.brightness < 0.1 ? 1 : 0
                              )
                            : 0}%"
                        on:change|preventDefault={(e) => {
                            window.socket.emit("config/update", {
                                name: "brightness",
                                value: e.target.value / 100.0,
                            });
                            e.target.value = "";
                        }}
                    />
                    <datalist id="brightnesses">
                        <option value="0" />
                        <option value="33" />
                        <option value="66" />
                        <option value="100" />
                    </datalist>
                    <button
                        type="button"
                        on:click|preventDefault={() => {
                            window.socket.emit("config/update", {
                                name: "brightness",
                                value: 0.75 * $config_settings.brightness,
                            });
                        }}
                    >
                        -
                    </button>
                    <button
                        type="button"
                        on:click|preventDefault={() => {
                            window.socket.emit("config/update", {
                                name: "brightness",
                                value:
                                    $config_settings.brightness > 0.0
                                        ? Math.min(
                                              1.25 *
                                                  $config_settings.brightness,
                                              1.0
                                          )
                                        : 0.04,
                            });
                        }}
                    >
                        +
                    </button>
                </div>
            </form>
        </div>
        {#if open}
            {#if libraryIndex >= 0}
                <p class="label">Included in:</p>
                <div class="buttons buttons__channels">
                    {#each playingChannels as channel, index}
                        {#if channel}
                            <button
                                type="button"
                                class="connect"
                                class:playing={index === 0}
                                on:click|preventDefault={() => {
                                    if (
                                        window.confirm(
                                            `Do you really want to disconnect '${channel}' from '${$mediaFeedObjects[libraryIndex].title}'?`
                                        )
                                    ) {
                                        window.socket.emit("deleteconnection", [
                                            $mediaFeedObjects[libraryIndex]
                                                .directory,
                                            channel,
                                        ]);
                                    }
                                }}
                            >
                                {channel}
                            </button>
                        {/if}
                    {/each}
                    <input
                        type="text"
                        placeholder="Enter playlist"
                        list="channels"
                        size="10"
                        on:change|preventDefault={(e) => {
                            if (
                                $channelObjects.find(
                                    (channelObject) =>
                                        channelObject.channel_name ===
                                        e.target.value
                                )
                            ) {
                                window.socket.emit("createconnection", [
                                    $mediaFeedObjects[libraryIndex].directory,
                                    e.target.value,
                                ]);
                            } else {
                                window.socket.emit("addnewchannel", [
                                    $mediaFeedObjects[libraryIndex].directory,
                                    e.target.value,
                                ]);
                            }
                            e.target.value = "";
                        }}
                    />
                    <datalist id="channels">
                        {#each $channelObjects as channel}
                            {#if channel.channel_name}
                                <option value={channel.channel_name} />
                            {/if}
                        {/each}
                    </datalist>
                </div>
                <div class="label">Commands:</div>
                <div class="buttons">
                    <button
                        type="button"
                        class="action"
                        on:click|preventDefault={() => {
                            window.socket.emit("screenshot");
                        }}
                    >
                        Screenshot
                    </button>
                    <button
                        type="button"
                        class="action"
                        on:click|preventDefault={() => {
                            window.socket.emit("playnext");
                        }}
                    >
                        Play next
                    </button>
                    <button
                        type="button"
                        class="action"
                        on:click|preventDefault={() => {
                            if (
                                window.confirm(
                                    `Do you really want to delete '${$mediaFeedObjects[libraryIndex].title}'?`
                                )
                            ) {
                                window.socket.emit(
                                    "deletemedia",
                                    $mediaFeedObjects[libraryIndex].directory
                                );
                            }
                        }}
                    >
                        Delete
                    </button>
                </div>
            {:else}
                <div class="label">Options:</div>
                <div class="buttons">
                    <button
                        type="button"
                        class="action"
                        on:click|preventDefault={() => {
                            window.socket.emit("screenshot");
                        }}
                    >
                        Screenshot
                    </button>
                    <button
                        type="button"
                        class="action"
                        on:click|preventDefault={downloadURL}
                    >
                        Save to library
                    </button>
                    <button
                        type="button"
                        class="action"
                        on:click|preventDefault={() => {
                            window.socket.emit("playnext");
                        }}
                    >
                        Back to playlist
                    </button>
                </div>
            {/if}
        {/if}
        <div class="toggle" on:click={() => (open = !open)}>
            <strong>{open ? "Less" : "More"} Actions</strong>
        </div>
    </div>
</div>

<style>
    a {
        /* refactor into tacit? */
        color: #6197d2;
    }

    .title {
        overflow: auto;
        white-space: nowrap;
        text-overflow: clip;
        /* margin: 0.7875rem 0; */
    }
    .url {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin: 0.7875rem 0;
    }

    .label {
        margin-bottom: 0.7875rem;
        color: #d9d9d9;
    }

    .buttons {
        overflow: auto;
        white-space: nowrap;
    }

    .buttons__channels,
    .buttons__brightness {
        margin-bottom: 1.125rem;
    }

    h3,
    p {
        margin-bottom: 0;
    }

    p {
        margin-top: 0.16875rem;
    }

    .toggle {
        font-size: 0.9rem;
        text-transform: uppercase;
        color: #b9b9b9;
    }

    .toggle:hover {
        color: #d9d9d9;
        cursor: pointer;
    }

    .brightness {
        width: 4em;
        appearance: textfield;
        -moz-appearance: textfield;
        -webkit-appearance: textfield;
    }

    form {
        margin-bottom: 0;
    }

    .openable {
        border-top: solid 1px #333;
        border-bottom: solid 1px #333;
        padding: 0.7875em 0px;
    }

    .main {
        margin-bottom: 1.85625rem;
    }

    .action,
    .connect {
        border: 1px solid #a3a2a2;
    }
    .action {
        background: #275a90;
    }

    .action:hover {
        background: #173454;
    }

    .connect {
        background: #2a6f3b;
    }

    .connect:hover {
        background: #db423c;
    }
</style>
