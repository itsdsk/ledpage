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
                                            `Do you really want to remove '${$mediaFeedObjects[libraryIndex].title}' from '${channel}'?`
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
                <p class="label">Controls:</p>
                <div class="buttons buttons__channels">
                    <button
                        type="button"
                        class="connect"
                        on:click|preventDefault|stopPropagation={() => {
                            window.socket.emit("resetbrightness", {
                                prevVal: 0.0,
                                duration: 500
                            });
                        }}
                    >
                        Flash off 0.5s
                    </button>
                    <button
                        type="button"
                        class="connect"
                        on:click|preventDefault|stopPropagation={() => {
                            window.socket.emit("resetbrightness", {
                                prevVal: 0.0,
                                duration: 1500
                            });
                        }}
                    >
                        Flash off 1.5s
                    </button>
                    <button
                        type="button"
                        class="connect"
                        on:click|preventDefault|stopPropagation={() => {
                            window.socket.emit("resetgamma", {
                                prevVal: 0.0,
                                duration: 500
                            });
                        }}
                    >
                        Flash on 0.5s
                    </button>
                    <button
                        type="button"
                        class="connect"
                        on:click|preventDefault|stopPropagation={() => {
                            window.socket.emit("resetgamma", {
                                prevVal: 0.0,
                                duration: 1500
                            });
                        }}
                    >
                        Flash on 1.5s
                    </button>
                </div>
            {/if}
        {/if}
        <div class="toggle" on:click={() => (open = !open)}>
            <strong>{open ? "Less" : "More"} Info</strong>
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
        display: flex;
        align-items: center;
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
        display: flex;
    }

    .buttons__channels {
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

    .openable {
        padding: 0.7875em 0px;
    }

    .main {
        margin-bottom: 1.85625rem;
        margin-top: 4rem;
    }

    .connect {
        border: 1px solid #a3a2a2;
        background: none;
    }

    .connect:hover {
        background: #db423c;
    }
</style>
