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
            d="M40.3774,40.4583l6.9093,6.9332c1.6139,1.6195,4.0955,2.5668,6.7244,2.5668h12.7749"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M5,21.9583h12.7749c2.6288,0,5.1104,0.9473,6.7244,2.5668l7.0229,7.0473"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M5,49.9583h12.7749c2.6288,0,5.1104-0.9473,6.7244-2.5668l22.7874-22.8664c1.6139-1.6195,4.0955-2.5668,6.7244-2.5668h12.7749"
        />
        <line
            x1="66.7859"
            x2="58.6005"
            y1="21.9583"
            y2="13.7444"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="58.6005"
            x2="66.7859"
            y1="30.1722"
            y2="21.9583"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="66.7859"
            x2="58.6005"
            y1="49.9583"
            y2="41.7444"
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
        />
        <line
            x1="58.6005"
            x2="66.7859"
            y1="58.1722"
            y2="49.9583"
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
