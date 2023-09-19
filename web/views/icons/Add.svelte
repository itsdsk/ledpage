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
            x1="36.0731"
            x2="36.0731"
            y1="22.3267"
            y2="49.5769"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="49.6982"
            x2="22.4479"
            y1="35.9518"
            y2="35.9518"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <circle
            cx="36.0731"
            cy="35.9518"
            r="23"
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
