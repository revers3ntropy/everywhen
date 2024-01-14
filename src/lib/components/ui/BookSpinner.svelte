<script lang="ts">
    export let scale = 1;
    export let color = 'var(--text-color)';
    export let duration = 5.1;

    // https://codepen.io/aaroniker/pen/zYOewEP
</script>

<div
    class="spinner-container"
    style="
        scale: {scale};
        --color: {color};
        --duration: {duration}s;
        display: none;
    "
>
    <div class="book">
        <div class="inner">
            <div class="left" />
            <div class="middle" />
            <div class="right" />
        </div>
        <ul>
            <!-- <li /> x17 -->
            <li />
            <li />
            <li />
            <li />
            <li />

            <li />
            <li />
            <li />
            <li />
            <li />

            <li />
            <li />
            <li />
            <li />
            <li />

            <li />
            <li />
        </ul>
    </div>
</div>

<style lang="scss">
    .spinner-container {
        // use inline style to hide until this style sheet is loaded
        display: flex !important;

        min-height: 150px;
        justify-content: center;
        align-items: center;
        width: 100%;
    }

    .book {
        width: 32px;
        height: 12px;
        position: relative;
        margin: 32px 0 0 0;

        .inner {
            width: 32px;
            height: 12px;
            position: relative;
            transform-origin: 2px 2px;
            transform: rotateZ(-90deg);
            animation: book var(--duration) ease infinite;

            .left,
            .right {
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

                $i: 0;
                @while $i < 19 {
                    &:nth-child(#{$i}) {
                        animation-name: page-#{$i};
                    }
                    $i: $i + 1;
                }
            }
        }
    }

    $i: 0;
    @while $i < 19 {
        $delay: $i * 1.86;
        $delay-after: $i * 1.74;
        @keyframes page-#{$i} {
            #{4 + $delay}#{'%'} {
                transform: rotateZ(0deg) translateX(-18px);
            }
            #{13 + $delay-after}#{'%'},
            #{54 + $delay}#{'%'} {
                transform: rotateZ(180deg) translateX(-18px);
            }
            #{63 + $delay-after}#{'%'} {
                transform: rotateZ(0deg) translateX(-18px);
            }
        }
        $i: $i + 1;
    }

    @keyframes left {
        4% {
            transform: rotateZ(90deg);
        }
        10%,
        40% {
            transform: rotateZ(0deg);
        }
        46%,
        54% {
            transform: rotateZ(90deg);
        }
        60%,
        90% {
            transform: rotateZ(0deg);
        }
        96% {
            transform: rotateZ(90deg);
        }
    }

    @keyframes right {
        4% {
            transform: rotateZ(-90deg);
        }
        10%,
        40% {
            transform: rotateZ(0deg);
        }
        46%,
        54% {
            transform: rotateZ(-90deg);
        }
        60%,
        90% {
            transform: rotateZ(0deg);
        }
        96% {
            transform: rotateZ(-90deg);
        }
    }

    @keyframes book {
        4% {
            transform: rotateZ(-90deg);
        }
        10%,
        40% {
            transform: rotateZ(0deg);
            transform-origin: 2px 2px;
        }
        40.01%,
        59.99% {
            transform-origin: 30px 2px;
        }
        46%,
        54% {
            transform: rotateZ(90deg);
        }
        60%,
        90% {
            transform: rotateZ(0deg);
            transform-origin: 2px 2px;
        }
        96% {
            transform: rotateZ(-90deg);
        }
    }

    * {
        box-sizing: inherit;
        &:before,
        &:after {
            box-sizing: inherit;
        }
    }
</style>
