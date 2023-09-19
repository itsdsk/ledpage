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
            d="M49.0417,27H62c3.3,0,6,2.7,6,6v6c0,3.3-2.7,6-6,6H33c-3.3,0-6-2.7-6-6v-2"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M49,33h11.0001c1.1046,0,2,0.7374,2,1.647v2.7058c0,0.9096-0.8954,1.647-2,1.647h-25c-1.1046,0-2-0.7374-2-1.647v-0.3737"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M22.9882,45H10c-3.3,0-6-2.7-6-6v-6c0-3.3,2.7-6,6-6h29c3.3,0,6,2.7,6,6v2"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M23,39H11.9999c-1.1046,0-2-0.7374-2-1.647v-2.7059c0-0.9096,0.8954-1.647,2-1.647h25c1.1046,0,2,0.7374,2,1.647l0.0001,0.3454"
        />
        <!-- vertical link: -->
        <!-- <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M37.2318,41.0132c-0.394,0.0998-0.8067,0.1529-1.2318,0.1529c-2.7614,0-5-2.2386-5-5v-17c0-2.7614,2.2386-5,5-5s5,2.2386,5,5v3"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M37.3602,46.0744c-0.4448,0.0605-0.8988,0.0917-1.3602,0.0917c-5.5228,0-10-4.4771-10-10v-17c0-5.5228,4.4772-10,10-10 s10,4.4772,10,10v7"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M34.7604,30.3209c0.3964-0.1011,0.8117-0.1549,1.2396-0.1549c2.7614,0,5,2.2386,5,5v17c0,2.7614-2.2386,5-5,5s-5-2.2386-5-5v-3"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M34.7494,25.2435c0.4097-0.0511,0.8271-0.0774,1.2506-0.0774c5.5228,0,10,4.4772,10,10v17c0,5.5229-4.4772,10-10,10 s-10-4.4771-10-10v-6"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M39,47.1661"
        />
        <path
            fill="none"
            stroke={colour}
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-miterlimit="10"
            stroke-width={strokeWidth}
            d="M39,38.1661"
        /> -->
    </g>
</svg>

<style>
    svg {
        width: var(--size);
        height: var(--size);
    }
</style>
