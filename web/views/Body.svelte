<script>
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import {
        mediaFeedObjects,
        channelObjects,
        livePlaybackStatus,
        config_settings,
        showConnectionMessage,
        connectionLogs,
        playbackStatus,
    } from "./client_data.js";
    import MenuToggle from "./MenuToggle.svelte";
    import Menu from "./Menu.svelte";

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
    setInterval(rotateScreenshots, 2500);

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

    let windowDimensions = {
        width: 0,
        height: 0,
        ratio: 100,
    };
    socket.on("windowdims", function (windowDims) {
        var parsed = JSON.parse(windowDims);
        // calc aspect ratio as percentage
        parsed.ratio = 100 * (parsed.height / parsed.width);
        windowDimensions = parsed;
    });

    let playback_timer = 0;
    $: if ($config_settings.brightness > 0.0) {
        var secs = Math.round(
            $livePlaybackStatus.nextPlaying.timeFromStart / 1000
        );
        var absSecs = Math.abs(secs);
        playback_timer = `${Math.floor(absSecs / 60)}:${String(
            absSecs % 60
        ).padStart(2, "0")}`;
        if (secs < 0) {
            playback_timer = "-" + playback_timer;
        } else {
            var fadeDurationSeconds = Math.round(
                $playbackStatus.playingFadeIn.fadeDuration / 1000
            );
            playback_timer += ` / ${Math.floor(fadeDurationSeconds / 60)}:${
                fadeDurationSeconds % 60
            }`;
        }
    } else {
        playback_timer = `--:--`;
    }

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
            <form>
                {#if windowWidth < 1536}
                    <MenuToggle
                        on:click={() => (showSidePanel = !showSidePanel)}
                    />
                {/if}
                <button
                    class="url__submit"
                    type="submit"
                    on:click|preventDefault={playURL}
                    disabled={!urlInputValid}
                >
                    Play
                </button>
                <div class="url__container">
                    <input
                        class="url__input"
                        type="url"
                        placeholder="Enter URL to display"
                        bind:this={urlinputelement}
                        on:click={() => {
                            urlinputelement.select();
                        }}
                        on:input={() => {
                            urlInputValid = urlinputelement.matches(":valid");
                        }}
                        required
                    />
                </div>
            </form>
        </nav>
        <div class="preview" style="--window-width: {windowDimensions.width}px">
            <div
                class="preview__window"
                style="--window-ratio: {windowDimensions.ratio}%"
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
                            class="preview__img"
                        />
                    {/each}
                {:else if $livePlaybackStatus.nowPlaying}
                    {#each [`screenshot_tmp.jpg?${screenshotIndex}`] as src (screenshotIndex)}
                        <input
                            type="image"
                            src={src != null ? `/${src}` : ""}
                            alt="preview img"
                            transition:fade={{ duration: 2500 }}
                            class="preview__img"
                        />
                    {/each}
                {/if}
                <span
                    class="preview__timer"
                    style="--window-ratio: {windowDimensions.ratio}%"
                >
                    {playback_timer}
                </span>
            </div>
        </div>
        <details class="status">
            <summary>
                <strong>Now Playing</strong>
            </summary>
            <form
                on:submit|preventDefault={() => {
                    return false;
                }}
            >
                {#if currentPlayingIndex < 0}
                    <h3 class="status__url">
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
                    <p class="status__label">Options:</p>
                    <div class="status__buttons">
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
                                socket.emit("playnext");
                            }}
                        >
                            Back to playlist
                        </button>
                    </div>
                {:else}
                    {#if $mediaFeedObjects[currentPlayingIndex].title !== $mediaFeedObjects[currentPlayingIndex].source}
                        <h1 class="status__title">
                            {$mediaFeedObjects[currentPlayingIndex].title}
                        </h1>
                    {/if}
                    <h3 class="status__url">
                        <a
                            href={$mediaFeedObjects[currentPlayingIndex].source}
                            target="_blank"
                        >
                            {$mediaFeedObjects[currentPlayingIndex].source}
                        </a>
                    </h3>
                    <p class="status__label">Channels:</p>
                    <div class="status__buttons status__buttons--channels">
                        {#if currentPlayingIndex >= 0}
                            {#each playingChannels as channel, index}
                                {#if channel}
                                    <button
                                        type="button"
                                        class="connect"
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
                    <p class="status__label">Commands:</p>
                    <div class="status__buttons">
                        <button
                            type="button"
                            class="action"
                            on:click|preventDefault={() => {
                                socket.emit("screenshot");
                            }}
                        >
                            Screenshot
                        </button>
                        <button
                            type="button"
                            class="action"
                            on:click|preventDefault={() => {
                                socket.emit("playnext");
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
                <p class="status__label">Brightness:</p>
                <input
                    type="number"
                    min="0.0"
                    max="100"
                    step="0.1"
                    list="brightnesses"
                    id="brightness"
                    placeholder="{$config_settings.brightness
                        ? ($config_settings.brightness * 100).toFixed(
                              $config_settings.brightness < 0.1 ? 1 : 0
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
        <div class="channels">
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
                <span
                    class="feed"
                    class:playing={currentPlayingIndex >= 0 &&
                        mediaFeedObject.directory ===
                            $mediaFeedObjects[currentPlayingIndex].directory}
                >
                    <input
                        type="image"
                        src={mediaFeedObject.screenshots[
                            mediaFeedObject.screenshots.length - 1
                        ] != null
                            ? `/media/${mediaFeedObject.directory}/${
                                  mediaFeedObject.screenshots[
                                      mediaFeedObject.screenshots.length - 1
                                  ]
                              }`
                            : `${mediaFeedObject.title}`}
                        alt={mediaFeedObject.title}
                        class:playing={currentPlayingIndex >= 0 &&
                            mediaFeedObject.directory ===
                                $mediaFeedObjects[currentPlayingIndex]
                                    .directory}
                        on:click|preventDefault={(e) => {
                            socket.emit("play", {
                                directory: mediaFeedObject.directory,
                            });
                            if (e.target.classList.contains("playing")) {
                                window.scroll(0, 0);
                                document
                                    .querySelector("details")
                                    .setAttribute("open", "");
                            }
                        }}
                    />
                </span>
            {/each}
        </div>
    </article>
    {#if windowWidth > 1536 || showSidePanel}
        <Menu
            active={"home"}
            on:click={() => (showSidePanel = autoToggleSidePanel = false)}
        />
    {/if}
</section>

<svelte:window bind:innerWidth={windowWidth} />

<style>
    .url__submit {
        float: right;
        margin-left: 0.4078125rem;
        margin-right: 0;
    }

    .url__container {
        overflow: hidden;
    }

    .url__input {
        width: 100%;
    }

    .preview {
        width: var(--window-width);
    }

    .preview__img {
        position: absolute;
        display: block;
        width: 100%;
        height: 100%;
    }

    .preview__window {
        position: relative;
        padding-bottom: var(--window-ratio);
        margin-bottom: 0.7875rem;
        height: 0;
    }

    .preview__timer {
        padding-top: var(--window-ratio);
        position: relative;
        display: block;
        text-align: right;
        font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 0.8em;
        z-index: -1;
    }

    input[type="image"] {
        padding: 0;
    }

    .status {
        margin-bottom: 1.85625rem;
    }

    .status__title {
        overflow: auto;
        white-space: nowrap;
        text-overflow: clip;
        margin: 0.7875rem 0;
    }

    .status__url {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin: 0.7875rem 0;
    }

    .status__label {
        margin-bottom: 0.7875rem;
    }

    .status__buttons {
        overflow: auto;
        white-space: nowrap;
    }

    .status__buttons--channels {
        margin-bottom: 1.125rem;
    }

    #brightness {
        width: 4em;
        appearance: textfield;
        -moz-appearance: textfield;
        -webkit-appearance: textfield;
    }

    button.playing::before {
        content: "\25B6\2002";
        color: inherit;
    }

    button.playing {
        border-width: 2px;
    }

    input[type="image"].playing {
        filter: opacity(0.25);
    }

    .feed.playing::after {
        content: "\25B6";
        font-size: 3em;
        color: white;
        position: absolute;
        z-index: 1;
        height: 1em;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .channels {
        overflow: auto;
        white-space: nowrap;
        margin-bottom: 1.125rem;
    }

    .feed {
        position: relative;
        display: inline-block;
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
