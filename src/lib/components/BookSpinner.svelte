<script lang="ts">
    export let scale = 1;
    export let colour = "#fff";
    export let duration = 6.8;

    // credit: https://codepen.io/aaroniker/pen/zYOewEP
</script>

<div
    class="spinner-container"
    style="
        scale: {scale};
        --color: {colour};
        --duration: {duration}s;
    "
>
    <div class="book">
        <div class="inner">
            <div class="left"></div>
            <div class="middle"></div>
            <div class="right"></div>
        </div>
        <ul>
            {#each { length: 17 } as _, __}
                <li></li>
            {/each}
        </ul>
    </div>
</div>

<style lang="less">

    .spinner-container {
        min-height: 300px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;

        box-sizing: border-box;

        * {
            box-sizing: inherit;

            &:before,
            &:after {
                box-sizing: inherit;
            }
        }
    }

    .book {
        width: 32px;
        height: 12px;
        position: relative;
        margin: 32px 0 0 0;

        zoom: 1.5;

        .inner {
            width: 32px;
            height: 12px;
            position: relative;
            transform-origin: 2px 2px;
            transform: rotateZ(-90deg);
            animation: book var(--duration) ease infinite;

            .left, .right {
                width: 60px;
                height: 4px;
                top: 0;
                border-radius: 2px;
                background: var(--color);
                position: absolute;

                &:before {
                    content: '';
                    width: 48px;
                    height: 4px;
                    border-radius: 2px;
                    background: inherit;
                    position: absolute;
                    top: -10px;
                    left: 6px;
                }
            }

            .left {
                right: 28px;
                transform-origin: 58px 2px;
                transform: rotateZ(90deg);
                animation: left var(--duration) ease infinite;
            }

            .right {
                left: 28px;
                transform-origin: 2px 2px;
                transform: rotateZ(-90deg);
                animation: right var(--duration) ease infinite;
            }

            .middle {
                width: 32px;
                height: 12px;
                border: 4px solid var(--color);
                border-top: 0;
                border-radius: 0 0 9px 9px;
                transform: translateY(2px);
            }
        }

        ul {
            margin: 0;
            padding: 0;
            list-style: none;
            position: absolute;
            left: 50%;
            top: 0;

            li {
                height: 4px;
                border-radius: 2px;
                transform-origin: 100% 2px;
                width: 48px;
                right: 0;
                top: -10px;
                position: absolute;
                background: var(--color);
                transform: rotateZ(0deg) translateX(-18px);
                animation-duration: var(--duration);
                animation-timing-function: ease;
                animation-iteration-count: infinite;

                //.for(@i, 18) {
                //    &:nth-child(@i) {
                //        animation-name: page-#{$i};
                //    }
                //}
            }
        }
    }

    //.for(@i, 18) {
    //    @k: e('page-@{i}');
    //    @keyframes @k {
    //        @p1: 4 + @i * 1.86;
    //        @s1: e('@{p1}%');
    //        @p2: 13 + @i * 1.74;
    //        @s2: e('@{p2}%');
    //        @p3: 54 + @i * 1.86;
    //        @s3: e('@{p3}%');
    //        @p4: 63 + @i * 1.74;
    //        @s4: e('@{p4}%');
    //
    //        @{s1} {
    //            transform: rotateZ(0deg) translateX(-18px);
    //        }
    //        @{s2}, @{s3} {
    //            transform: rotateZ(180deg) translateX(-18px);
    //        }
    //        @{s4} {
    //            transform: rotateZ(0deg) translateX(-18px);
    //        }
    //    }
    //}

    @keyframes left {
        4% {
            transform: rotateZ(90deg)
        }
        10%, 40% {
            transform: rotateZ(0deg)
        }
        46%, 54% {
            transform: rotateZ(90deg)
        }
        60%, 90% {
            transform: rotateZ(0deg)
        }
        96% {
            transform: rotateZ(90deg)
        }
    }

    @keyframes right {
        4% {
            transform: rotateZ(-90deg)
        }
        10%, 40% {
            transform: rotateZ(0deg)
        }
        46%, 54% {
            transform: rotateZ(-90deg)
        }
        60%, 90% {
            transform: rotateZ(0deg)
        }
        96% {
            transform: rotateZ(-90deg)
        }
    }

    @keyframes book {
        4% {
            transform: rotateZ(-90deg);
        }
        10%, 40% {
            transform: rotateZ(0deg);
            transform-origin: 2px 2px;
        }
        40.01%, 59.99% {
            transform-origin: 30px 2px;
        }
        46%, 54% {
            transform: rotateZ(90deg);
        }
        60%, 90% {
            transform: rotateZ(0deg);
            transform-origin: 2px 2px;
        }
        96% {
            transform: rotateZ(-90deg);
        }
    }
</style>