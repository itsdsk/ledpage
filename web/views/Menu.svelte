<script>
    import { showConnectionMessage } from "./client_data";
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
    <div>
        <p
            class:disconnected={$showConnectionMessage}
            on:click={() => {
                window.socket.connect();
                console.log("reconnecting");
            }}
        >
            <svg x="0px" y="0px" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" />
            </svg>
        </p>
    </div>
</article>

<style>
    div {
        position: absolute;
        bottom: 0px;
    }

    p::after {
        content: " Connected";
        color: #b9b9b9;
    }

    p.disconnected::after {
        content: " Disconnected";
        color: #fff;
    }

    svg {
        width: 1.575rem;
        height: 1.575rem;
        vertical-align: text-bottom;
    }

    circle {
        stroke: none;
        fill: #2a6f3b;
    }

    p.disconnected > svg > circle {
        fill: #db423c;
    }

    .current {
        background: #333;
    }

    article {
        background: #1a1919f8;
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
    p {
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
        p {
            padding: 18px;
        }
    }
</style>
