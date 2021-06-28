<script>
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import {
        mediaFeedObjects,
        channelObjects,
        livePlaybackStatus,
        config_settings,
    } from "./client_data.js";

    //
    let selectedChannel = -1;

    let urlinputelement;
    let urlInputValid = false;
    function playURL() {
        if (
            urlinputelement.value.length > 0 &&
            urlinputelement.matches(":valid")
        ) {
            // URL is validated
            socket.emit("playURL", urlinputelement.value);
        }
    }
    function downloadURL() {
        if ($livePlaybackStatus.nowPlaying.directory.length > 0) {
            // URL is validated
            socket.emit(
                "createmediaURL",
                $livePlaybackStatus.nowPlaying.directory
            );
        } else {
            console.log("cannot create media from URL as it is invalid");
        }
    }

    // get index of content currently playing in mediafeed
    $: currentPlayingIndex =
        $livePlaybackStatus.nowPlaying != null
            ? $mediaFeedObjects.findIndex(
                  (mediaItem) =>
                      mediaItem.directory ===
                      $livePlaybackStatus.nowPlaying.directory
              )
            : -1;

    onMount(() => {
        setTimeout(() => {
            selectedChannel = $livePlaybackStatus.channel || "all media";
        }, 1000);
    });

    // index for arrays of screenshots to be cycled through
    let screenshotIndex = 0;
    const rotateScreenshots = () => {
        screenshotIndex++;
    };
    setInterval(rotateScreenshots, 2750);

    // sorted channels
    let sortedChannels = [];

    $: sortChannels(
        $livePlaybackStatus.channel,
        $channelObjects,
        selectedChannel
    );

    function sortChannels() {
        if ($channelObjects && $channelObjects.length > 0) {
            // move currently-playing-channel to front of array
            sortedChannels = [
                $channelObjects.find(
                    (item) =>
                        (item.channel_name || "all media") ===
                        ($livePlaybackStatus.channel || "all media")
                ),
                ...$channelObjects.filter(
                    (item) =>
                        (item.channel_name || "all media") !==
                        ($livePlaybackStatus.channel || "all media")
                ),
            ];
        } else {
            sortedChannels = [];
        }
    }

    // sorted media channels
    let playingChannels = [];

    $: updatePlayingChannels(
        currentPlayingIndex,
        $livePlaybackStatus.channel,
        $mediaFeedObjects[currentPlayingIndex]
    );

    function updatePlayingChannels() {
        //
        if (currentPlayingIndex >= 0) {
            // move currently-playing-channel to front of array
            playingChannels = [
                $mediaFeedObjects[currentPlayingIndex].channels.find(
                    (item) => item === $livePlaybackStatus.channel
                ),
                ...$mediaFeedObjects[currentPlayingIndex].channels.filter(
                    (item) => item !== $livePlaybackStatus.channel
                ),
            ];
        } else {
            playingChannels = [];
        }
    }
</script>

<section>
    <header>
        <nav>
            <form>
                <button
                    type="button"
                    style="float:left;padding:0.4078125rem;"
                    on:click={() => (location.href = "/setup.html")}
                >
                    ...
                </button>
                <button
                    type="submit"
                    on:click|preventDefault={playURL}
                    style="float:right;margin-left:0.4078125rem;margin-right:0;"
                    disabled={!urlInputValid}
                >
                    Play
                </button>
                <div style="overflow:hidden;">
                    <input
                        type="url"
                        placeholder="Enter URL to display"
                        bind:this={urlinputelement}
                        on:keyup={(e) => {
                            if (e.key === "Enter") playURL();
                        }}
                        on:input={() => {
                            urlInputValid = urlinputelement.matches(":valid");
                        }}
                        required
                        style="width:100%;"
                    />
                </div>
            </form>
        </nav>
        <div
            style="position:relative;width:400px;height:200px;margin-bottom:0.7875rem;"
            on:click|preventDefault={() => socket.emit("fakemouseinput")}
        >
            {#if currentPlayingIndex >= 0 && $mediaFeedObjects[currentPlayingIndex].screenshots}
                {#each [$mediaFeedObjects[currentPlayingIndex].screenshots[screenshotIndex % $mediaFeedObjects[currentPlayingIndex].screenshots.length]] as src (screenshotIndex % $mediaFeedObjects[currentPlayingIndex].screenshots.length)}
                    <input
                        type="image"
                        src={src != null
                            ? `/media/${$mediaFeedObjects[currentPlayingIndex].directory}/${src}`
                            : ""}
                        alt="preview img"
                        transition:fade={{ duration: 2500 }}
                        style="position:absolute;display:block;"
                    />
                {/each}
            {:else if $livePlaybackStatus.nowPlaying}
                {#each [`screenshot_tmp.jpg?${screenshotIndex}`] as src (screenshotIndex)}
                    <input
                        type="image"
                        src={src != null ? `/${src}` : ""}
                        alt="preview img"
                        transition:fade={{ duration: 2500 }}
                        style="position:absolute;display:block;"
                    />
                {/each}
            {/if}
        </div>
        <details style="margin-bottom:1.85625rem;">
            <summary>
                <strong>
                    Now Playing
                    <code>
                        {Math.round(
                            $livePlaybackStatus.nextPlaying.timeFromStart / 1000
                        )}s
                    </code>
                </strong>
            </summary>
            <form
                on:submit|preventDefault={() => {
                    return false;
                }}
            >
                {#if currentPlayingIndex < 0}
                    <h3
                        style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin:0.7875rem 0;"
                    >
                        <a
                            href={$livePlaybackStatus.nowPlaying
                                ? $livePlaybackStatus.nowPlaying.directory
                                : "/"}
                            target="_blank"
                        >
                            {$livePlaybackStatus.nowPlaying
                                ? $livePlaybackStatus.nowPlaying.directory
                                : "/"}
                        </a>
                    </h3>
                    <p style="margin-bottom:0.7875rem;">Options:</p>
                    <div style="overflow:auto;white-space:nowrap;">
                        <button
                            type="button"
                            on:click|preventDefault={downloadURL}
                        >
                            Save to library
                        </button>
                        <button
                            type="button"
                            on:click|preventDefault={() => {
                                socket.emit("playnext");
                            }}
                        >
                            Back to playlist
                        </button>
                    </div>
                {:else}
                    {#if $mediaFeedObjects[currentPlayingIndex].title !== $mediaFeedObjects[currentPlayingIndex].source}
                        <h1
                            style="overflow:auto;white-space:nowrap;text-overflow:clip;margin:0.7875rem 0;"
                        >
                            {$mediaFeedObjects[currentPlayingIndex].title}
                        </h1>
                    {/if}
                    <h3
                        style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin:0.7875rem 0;"
                    >
                        <a
                            href={$mediaFeedObjects[currentPlayingIndex].source}
                            target="_blank"
                        >
                            {$mediaFeedObjects[currentPlayingIndex].source}
                        </a>
                    </h3>
                    <p style="margin-bottom:0.7875rem;">Channels:</p>
                    <div
                        style="overflow:auto;white-space:nowrap;margin-bottom:1.125rem;"
                    >
                        {#if currentPlayingIndex >= 0}
                            {#each playingChannels as channel, index}
                                {#if channel}
                                    <button
                                        type="button"
                                        class:playing={index === 0}
                                        on:click|preventDefault={() => {
                                            if (
                                                window.confirm(
                                                    `Do you really want to disconnect '${channel}' from '${$mediaFeedObjects[currentPlayingIndex].title}'?`
                                                )
                                            ) {
                                                socket.emit(
                                                    "deleteconnection",
                                                    [
                                                        $mediaFeedObjects[
                                                            currentPlayingIndex
                                                        ].directory,
                                                        channel,
                                                    ]
                                                );
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
                                        socket.emit("createconnection", [
                                            $mediaFeedObjects[
                                                currentPlayingIndex
                                            ].directory,
                                            e.target.value,
                                        ]);
                                    } else {
                                        socket.emit("addnewchannel", [
                                            $mediaFeedObjects[
                                                currentPlayingIndex
                                            ].directory,
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
                        {/if}
                    </div>
                    <p style="margin-bottom:0.7875rem;">Commands:</p>
                    <div style="overflow:auto;white-space:nowrap;">
                        <button
                            type="button"
                            on:click|preventDefault={() => {
                                socket.emit("screenshot");
                            }}
                        >
                            Screenshot
                        </button>
                        <button
                            type="button"
                            on:click|preventDefault={() => {
                                socket.emit("playnext");
                            }}
                        >
                            Play next
                        </button>
                        <button
                            type="button"
                            on:click|preventDefault={() => {
                                if (
                                    window.confirm(
                                        `Do you really want to delete '${$mediaFeedObjects[currentPlayingIndex].title}'?`
                                    )
                                ) {
                                    socket.emit(
                                        "deletemedia",
                                        $mediaFeedObjects[currentPlayingIndex]
                                            .directory
                                    );
                                }
                            }}
                        >
                            Delete
                        </button>
                    </div>
                {/if}
            </form>
        </details>
        <div>
            <form
                on:submit|preventDefault={() => {
                    return false;
                }}
            >
                <p style="margin-bottom:0.7875rem;">Brightness:</p>
                <input
                    type="number"
                    min="0.0"
                    max="100"
                    step="0.1"
                    list="brightnesses"
                    style="width:4.5em;"
                    placeholder="{$config_settings.brightness
                        ? ($config_settings.brightness * 100).toFixed(
                              $config_settings.brightness < 0.2 ? 1 : 0
                          )
                        : 0}%"
                    on:change|preventDefault={(e) => {
                        socket.emit("config/update", {
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
                        socket.emit("config/update", {
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
                        socket.emit("config/update", {
                            name: "brightness",
                            value:
                                $config_settings.brightness > 0.0
                                    ? Math.min(
                                          1.25 * $config_settings.brightness,
                                          1.0
                                      )
                                    : 0.04,
                        });
                    }}
                >
                    +
                </button>
            </form>
        </div>
    </header>
    <article>
        <h2>Saved Media</h2>
        <div style="overflow:auto;white-space:nowrap;margin-bottom:1.125rem;">
            {#each sortedChannels as channelObject, index}
                <button
                    on:click|preventDefault={() => {
                        if (
                            (channelObject.channel_name || "all media") ==
                            selectedChannel
                        ) {
                            // play channel
                            socket.emit(
                                "autoplay",
                                selectedChannel === "all media"
                                    ? null
                                    : selectedChannel
                            );
                        } else {
                            // view channel
                            selectedChannel =
                                channelObject.channel_name || "all media";
                        }
                    }}
                    type={index == 0
                        ? "reset"
                        : (channelObject.channel_name || "all media") ==
                          selectedChannel
                        ? "submit"
                        : "button"}
                    class:playing={index == 0}
                >
                    {channelObject.channel_name || "all media"} ({channelObject.count})
                </button>
            {/each}
        </div>
        <div>
            {#each $mediaFeedObjects.filter((m) => selectedChannel === "all media" || m.channels.includes(selectedChannel)) as mediaFeedObject}
                <input
                    type="image"
                    src={mediaFeedObject.screenshots[0] != null
                        ? `/media/${mediaFeedObject.directory}/${mediaFeedObject.screenshots[0]}`
                        : `${mediaFeedObject.title}`}
                    alt={mediaFeedObject.title}
                    class:playing={currentPlayingIndex >= 0 &&
                        mediaFeedObject.directory ===
                            $mediaFeedObjects[currentPlayingIndex].directory}
                    on:click|preventDefault={(e) => {
                        if (e.target.classList.contains("playing")) {
                            window.scroll(0, 0);
                            document
                                .querySelector("details")
                                .setAttribute("open", "");
                        } else {
                            socket.emit("play", {
                                directory: mediaFeedObject.directory,
                            });
                        }
                    }}
                />
            {/each}
        </div>
    </article>
</section>

<style>
    section {
        width: 1300px;
    }

    input[type="image"] {
        padding: 0;
    }

    button.playing {
        font-weight: bold;
        animation: Channel-playing-pulse infinite 1s ease-in-out alternate;
    }

    @keyframes Channel-playing-pulse {
        from {
            background: #f2f2f2;
        }
        to {
            background: #d9d9d9;
        }
    }

</style>
