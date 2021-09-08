<script>
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import {
        mediaFeedObjects,
        channelObjects,
        livePlaybackStatus,
        config_settings,
        showConnectionMessage,
        playbackStatus,
    } from "./client_data.js";
    import MenuToggle from "./MenuToggle.svelte";
    import Menu from "./Menu.svelte";
    import Player from "./Player.svelte";

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
    let playback_label = 0; // 0=PAUSED, 1=FADING, 2=PLAYING
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
            if (playback_label != 2) playback_label = 2;
        } else {
            var fadeDurationSeconds = Math.round(
                $playbackStatus.playingFadeIn.fadeDuration / 1000
            );
            playback_timer += ` / ${Math.floor(fadeDurationSeconds / 60)}:${
                fadeDurationSeconds % 60
            }`;
            if (playback_label != 1) playback_label = 1;
        }
    } else {
        playback_timer = `--:--`;
        if (playback_label != 0) playback_label = 0;
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
        <div
            class="preview"
            style="--window-width: {Math.min(windowWidth - 10, 640)}px"
        >
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
                    {playback_label == 0
                        ? "PAUSED"
                        : playback_label == 1
                        ? "FADING"
                        : playback_label == 2
                        ? "PLAYING"
                        : "ERROR"}
                    <span class="clock">{playback_timer}</span>
                </span>
            </div>
        </div>
        <div>
            <Player libraryIndex={currentPlayingIndex} />
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
        font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 0.8em;
        color: #d9d9d9;
        z-index: -1;
    }

    .clock {
        float: right;
    }

    input[type="image"] {
        padding: 0;
    }

    input[type="image"]:hover {
        opacity: 0.5;
    }

    input[type="image"]:active {
        opacity: 0.125;
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
</style>
