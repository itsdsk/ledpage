<script>
    export let strokeWidth = "2";
    export let colour = "#fff";
    export let viewBoxInset = 0;
    export let size = "1rem";
    let viewBox = `${0 + viewBoxInset} ${0 + viewBoxInset} ${
        72 - 2 * viewBoxInset
    } ${72 - 2 * viewBoxInset}`;
</script>

<svg {viewBox} style="--size: {size}" xmlns="http://www.w3.org/2000/svg">
    <g>
        <polyline
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            points="31,16 31,12 41,12 41,16"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M51,25v31c0,2.2091-1.7909,4-4,4H25c-2.2091,0-4-1.7909-4-4V25"
        />
        <rect
            x="17"
            y="16"
            width="38"
            height="4"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="41"
            x2="41"
            y1="28.25"
            y2="55"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="31"
            x2="31"
            y1="28.25"
            y2="55"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
    </g>
</svg>

<style>
    svg {
        width: var(--size);
        height: var(--size);
    }
</style>
