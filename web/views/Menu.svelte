<script>
    import { showConnectionMessage, connectionLogs } from "./client_data";
    export let active;
</script>

<article>
    <button type="button" on:click> ☰ </button>
    <nav>
        <ul>
            <li class:current={active === "home"}>
                <a href="/"> Home </a>
            </li>
            <li class:current={active === "setup"}>
                <a href="/setup"> Setup </a>
            </li>
        </ul>
    </nav>
    <p>
        {$showConnectionMessage ? "Disconnected" : "Connected"}
    </p>
    {#if $connectionLogs.length}
        <dl>
            {#each $connectionLogs as connectionLog}
                {#each connectionLog.dt as dt}
                    <dt>
                        {dt}
                    </dt>
                {/each}
                {#each connectionLog.dd as dd}
                    <dd>
                        {dd}
                    </dd>
                {/each}
            {/each}
        </dl>
    {/if}
</article>

<style>
    .current {
        background: #333;
    }

    article {
        opacity: 0.95;
        width: 318px;
        height: 100%;
        z-index: 10;
        top: 0;
        left: 0;
        position: fixed;
        border-top: none;
        border-bottom: none;
        border-left: none;
        padding-top: 79.2px;
        padding-left: 0px;
        padding-right: 0px;
    }

    button {
        border: none;
        width: 100%;
        width: -moz-available;
        width: -webkit-fill-available;
        width: stretch;
        text-align: left;
        padding: 0.4078125rem 0.99rem;
        margin-left: 43.2px;
        margin-right: 43.2px;
        background: none;
    }

    li,
    p,
    dl {
        padding: 18px 43.2px;
    }

    a {
        color: white;
        display: block;
    }

    @media not screen and (max-width: 767px) {
        button {
            padding-left: 0px;
            background: none;
        }
    }

    @media (max-width: 767px) {
        article {
            padding-top: 36px;
        }
        button {
            margin-left: 18px;
            margin-right: 18px;
        }
        li,
        p,
        dl {
            padding: 18px;
        }
    }
</style>
