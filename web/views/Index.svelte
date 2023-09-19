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

    import BrightIcon from "./icons/Bright.svelte";
    import FastForwardIcon from "./icons/FastForward.svelte";
    import MenuIcon from "./icons/Menu.svelte";
    import PauseIcon from "./icons/Pause.svelte";
    import PlayIcon from "./icons/Play.svelte";

    $: if ($config_settings.title) {
        document.title = $config_settings.title;
    } else {
        document.title = "Untitled";
    }

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
            window.socket.emit("playURL", urlinputelement.value);
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
    let gitHash;
    window.socket.on("windowdims", function (windowDims) {
        var parsed = JSON.parse(windowDims);
        gitHash = parsed.hash;
        console.log(`commit ${gitHash}: https://github.com/itsdsk/disk-interaction-system/commit/${gitHash}`)
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

    function forwardMouseClick(event) {
        if ($config_settings.brightness == 0.0) {
            return;
        }
        const bounds = event.target.getBoundingClientRect();
        const mousePosX =
            Math.round(((event.clientX - bounds.left) / bounds.width) * 100) /
            100;
        const mousePosY =
            Math.round(((event.clientY - bounds.top) / bounds.height) * 100) /
            100;
        window.socket.emit("fakemouseinput", {
            x: mousePosX,
            y: mousePosY,
        });
    }

    var iconProps = {
        viewBoxInset: 0,
        strokeWidth: "2",
        colour: "#fff",
        size: "1.575rem",
    };

    let sliderActive = false;
    let sliderCurve = 2; // logarithmic scale (1 = linear, higher = more exponential)
    let optionsActive = false;
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
                    title="Play"
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
            title="Click to trigger mouseclick"
            style="--window-width: {Math.min(windowWidth - 10, 640)}px"
        >
            <div
                class="preview__window"
                style="--window-ratio: {windowDimensions.ratio}%"
                on:click|preventDefault={forwardMouseClick}
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
                    class="preview__footer"
                    style="--window-ratio: {windowDimensions.ratio}%"
                    title=""
                >
                    <span class="control">
                        <button
                            type="button"
                            class="control--btn"
                            title="Play next URL"
                            on:click|preventDefault|stopPropagation={() => {
                                if ($config_settings.brightness == 0.0) {
                                    window.socket.emit("config/update", {
                                        name: "brightness",
                                        value: 0.04,
                                    });
                                } else {
                                    window.socket.emit("playnext");
                                }
                            }}
                        >
                            {#if playback_label == 0}
                                <!-- off -->
                                <PauseIcon
                                    {...Object.assign({}, iconProps, {
                                        size: "2.1375rem",
                                    })}
                                />
                            {:else if playback_label == 1}
                                <!-- crossfading -->
                                <FastForwardIcon
                                    {...Object.assign({}, iconProps, {
                                        size: "2.1375rem",
                                    })}
                                />
                            {:else if playback_label == 2}
                                <!-- playing -->
                                <PlayIcon
                                    {...Object.assign({}, iconProps, {
                                        size: "2.1375rem",
                                    })}
                                />
                            {/if}
                        </button>
                        <span
                            class="slider"
                            class:active={sliderActive}
                            title={`+${Math.floor(Math.pow(
                                $config_settings.brightness,
                                1 / sliderCurve
                            ) * 100)}`}
                            on:mouseenter={() => (sliderActive = true)}
                            on:mouseleave={() => (sliderActive = false)}
                        >
                            <BrightIcon {...Object.assign({}, iconProps, {})} />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.001"
                                value={Math.pow(
                                    $config_settings.brightness,
                                    1 / sliderCurve
                                )}
                                on:change|preventDefault={(e) => {
                                    var newBrightness =
                                        Math.round(
                                            Math.pow(
                                                e.target.value,
                                                sliderCurve
                                            ) * 1000
                                        ) / 1000;
                                    window.socket.emit("config/update", {
                                        name: "brightness",
                                        value: newBrightness,
                                    });
                                }}
                            />
                        </span>
                        <span class="preview__text">
                            {playback_timer}
                        </span>
                        <span class="spacer" />
                        <span
                            class="options"
                            class:active={optionsActive}
                            on:mouseenter={() => (optionsActive = true)}
                            on:mouseleave={() => (optionsActive = false)}
                        >
                            <MenuIcon {...Object.assign({}, iconProps, {})} />
                            <span>
                                <ul class="options__list">
                                    <li class="options__item">
                                        <button
                                            type="button"
                                            class="options--btn"
                                            title="Take screenshot of URL"
                                            on:click|preventDefault|stopPropagation={() => {
                                                window.socket.emit(
                                                    "screenshot"
                                                );
                                            }}
                                        >
                                            Screenshot
                                        </button>
                                    </li>
                                    <li class="options__item">
                                        {#if currentPlayingIndex >= 0}
                                            <button
                                                type="button"
                                                class="options--btn"
                                                title="Remove URL from library"
                                                on:click|preventDefault|stopPropagation={() => {
                                                    if (
                                                        window.confirm(
                                                            `Do you really want to delete '${$mediaFeedObjects[currentPlayingIndex].title}'?`
                                                        )
                                                    ) {
                                                        window.socket.emit(
                                                            "deletemedia",
                                                            $mediaFeedObjects[
                                                                currentPlayingIndex
                                                            ].directory
                                                        );
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        {:else}
                                            <button
                                                type="button"
                                                class="options--btn"
                                                title="Add URL to library"
                                                on:click|preventDefault|stopPropagation={() => {
                                                    if (
                                                        $livePlaybackStatus
                                                            .nowPlaying
                                                            .directory.length >
                                                        0
                                                    ) {
                                                        // URL is validated
                                                        window.socket.emit(
                                                            "createmediaURL",
                                                            $livePlaybackStatus
                                                                .nowPlaying
                                                                .directory
                                                        );
                                                    } else {
                                                        console.log(
                                                            "cannot create media from URL as it is invalid"
                                                        );
                                                    }
                                                }}
                                            >
                                                Download
                                            </button>
                                        {/if}
                                    </li>
                                </ul>
                            </span>
                        </span>
                    </span>
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
                    title={(channelObject.channel_name || "all media") ==
                    selectedChannel
                        ? "Play"
                        : "View"}
                    on:click|preventDefault={() => {
                        if (
                            (channelObject.channel_name || "all media") ==
                            selectedChannel
                        ) {
                            // play channel
                            window.socket.emit(
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
                        title={mediaFeedObject.title}
                        class="feed__image"
                        class:playing={currentPlayingIndex >= 0 &&
                            mediaFeedObject.directory ===
                                $mediaFeedObjects[currentPlayingIndex]
                                    .directory}
                        on:click|preventDefault={(e) => {
                            window.socket.emit("play", {
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
        z-index: 1;
    }

    .preview__window {
        position: relative;
        padding-bottom: var(--window-ratio);
        margin-bottom: 0.7875rem;
        height: 0;
    }

    .preview__footer {
        padding-top: var(--window-ratio);
        position: relative;
        display: block;
        font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 0.8em;
        color: #d9d9d9;
    }

    .slider {
        display: flex;
        align-items: center;
        gap: 0.45rem;
    }

    .slider > input[type="range"] {
        display: none;
        margin: auto 0;
    }

    .slider.active > input[type="range"] {
        display: inline-block;
    }

    .options > span {
        display: none;
        position: absolute;
        transform: translate(-100%, -100%);
        z-index: 10;
        background: #0d0d0d;
        border-radius: 3.6px;
        border: 1px solid #595959;
    }

    .options.active > span {
        display: unset;
    }

    .options__list {
        margin: 0;
        list-style: none;
    }

    .options__item {
        text-align: right;
    }

    .options--btn {
        background: none;
        border: none;
        font-size: inherit;
        padding: 0rem 0.5rem 0rem 1rem;
        margin: inherit;
    }

    .spacer {
        flex-grow: 1;
    }

    .control {
        display: flex;
        align-items: center;
        gap: 0.45rem;
    }

    .control--btn {
        display: flex;
        align-items: center;
        color: #d9d9d9;
        background: none;
        border: none;
        font-size: inherit;
        padding: inherit;
        margin: inherit;
    }

    .control--btn:hover {
        text-decoration: underline;
    }

    input[type="image"] {
        padding: 0;
    }

    .feed__image {
        width: 100%;
        margin: 0;
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
        padding: 5px 10px;
        width: 33.333%;
    }

    @media (max-width: 1536px) {
        .feed {
            width: 50%;
        }
    }
</style>
