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
        <line
            x1="36.0851"
            x2="36.0851"
            y1="17.1466"
            y2="36.0165"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="42.24"
            x2="36.1"
            y1="29.8951"
            y2="36.0351"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="29.91"
            x2="36.05"
            y1="29.8951"
            y2="36.0351"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M56.8961,54.9782H15.0768c-1.65,0-3-1.35-3-3V44.402c0-1.65,1.35-3,3-3h41.8194c1.65,0,3,1.35,3,3v7.5762 C59.8961,53.6282,58.5461,54.9782,56.8961,54.9782z"
        />
        <circle
            cx="19.0173"
            cy="48.2886"
            r="2"
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
