<script>
    let showButtons = false;
</script>

<form>
    <span>
        {#if showButtons}
            <button
                type="button"
                class="power"
                on:click|preventDefault={() => {
                    if (window.confirm("Do you really want to reboot?"))
                        window.socket.emit("systempower", "reboot");
                }}
            >
                Restart
            </button>
            <button
                type="button"
                class="power"
                on:click|preventDefault={() => {
                    if (window.confirm("Do you really want to shutdown?"))
                        window.socket.emit("systempower", "shutdown");
                }}
            >
                Shutdown
            </button>
        {/if}
        <button
            type="button"
            on:click|preventDefault={() => {
                showButtons = !showButtons;
            }}
        >
            Power Off
        </button>
    </span>
</form>

<style>
    form {
        height: 60.5px;
    }

    span {
        float: right;
    }

    button {
        margin-right: 0;
    }

    .power {
        background: #db423c;
        color: white;
        padding: 0.407813rem;
    }
</style>
