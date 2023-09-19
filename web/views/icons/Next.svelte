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
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M29.4839,17l16.976,9.1111l14.2864,7.6675c1.6717,0.8972,1.6717,3.5456,0,4.4428l-14.2864,7.6675L29.4839,55"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M6,17l17.0551,9.1111l14.3529,7.6675c1.6795,0.8972,1.6795,3.5456,0,4.4428l-14.3529,7.6675L6,55"
        />
        <line
            x1="66"
            x2="66"
            y1="17"
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
