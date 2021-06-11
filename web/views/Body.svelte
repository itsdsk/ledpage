<script>
    import {
        mediaFeedObjects,
        channelObjects,
        livePlaybackStatus,
        config_settings,
    } from "./client_data.js";

    //
    let selectedChannel = "all media";

    let urlinputelement;
    let urlInputValid = false;
    function playURL() {
        if (
            urlinputelement.value.length > 0 &&
            urlinputelement.matches(":valid")
        ) {
            // URL is validated
            socket.emit("playURL", urlinputelement.value);
            console.log(`playing URL: ${urlinputelement.value}`);
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
</script>

<section>
    <header>
        <nav>
            <form>
                <div>
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
                    />
                    <button
                        type="submit"
                        on:click|preventDefault={playURL}
                        disabled={!urlInputValid}
                    >
                        Play
                    </button>
                </div>
            </form>
        </nav>
        <nav>
            <ul>
                <li>
                    <img
                        src={currentPlayingIndex >= 0
                            ? `/media/${$mediaFeedObjects[currentPlayingIndex].directory}/${$mediaFeedObjects[currentPlayingIndex].screenshots[0]}`
                            : ""}
                        alt="preview img"
                    />
                </li>
                <li>
                    Now Playing: {currentPlayingIndex >= 0
                        ? $mediaFeedObjects[currentPlayingIndex].title
                        : $livePlaybackStatus.nowPlaying
                        ? $livePlaybackStatus.nowPlaying.title
                        : "Nothing"}
                </li>
                <li>link3</li>
            </ul>
        </nav>
        <nav>
            <form>
                <label>Brightness:</label>
                <button
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
                    on:click|preventDefault={() => {
                        socket.emit("config/update", {
                            name: "brightness",
                            value: Math.min(
                                1.25 * $config_settings.brightness,
                                1.0
                            ),
                        });
                    }}
                    disabled={$config_settings.brightness === 1.0}
                >
                    +
                </button>
            </form>
        </nav>
    </header>
    <article>
        <div>
            <fieldset>
                {#each $channelObjects as channelObject}
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
                        type={(channelObject.channel_name || "all media") ==
                        selectedChannel
                            ? "submit"
                            : "button"}
                    >
                        {channelObject.channel_name || "all media"} ({channelObject.count})
                    </button>
                {/each}
            </fieldset>
        </div>
        <div>
            {#each $mediaFeedObjects.filter((m) => selectedChannel === "all media" || m.channels.includes(selectedChannel)) as mediaFeedObject}
                <input
                    type="image"
                    src={mediaFeedObject.screenshots[0] != null
                        ? `/media/${mediaFeedObject.directory}/${mediaFeedObject.screenshots[0]}`
                        : `${mediaFeedObject.title}`}
                    alt={mediaFeedObject.title}
                    on:click|preventDefault={() => {
                        socket.emit("play", {
                            directory: mediaFeedObject.directory,
                        });
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
</style>
