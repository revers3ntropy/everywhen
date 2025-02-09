/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts,scss}'],
    variants: {
        extend: {
            display: ['group-hover']
        }
    },
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            backgroundColor: 'var(--background-color)',
            navBg: 'var(--nav-bg)',
            blurBgColor: 'var(--blur-bg-color)',
            translucentBg: 'var(--translucent-bg)',
            accentDanger: 'var(--accent-danger)',
            accentGradient: 'var(--accent-gradient)',
            lightAccent: 'var(--light-accent)',
            vLightAccent: 'var(--v-light-accent)',
            borderLight: 'var(--border-light)',
            borderColor: 'var(--border-color)',
            borderHeavy: 'var(--border-heavy)',
            textColor: 'var(--text-color)',
            textColorAccent: 'var(--text-color-accent)',
            textColorLight: 'var(--text-color-light)',
            textColorOnGradient: 'var(--text-colour-on-gradient)',
            textColorInverted: 'var(--text-color-invert)',
            textColorDanger: 'var(--text-color-danger)',
            timelineAccent: 'var(--timeline-accent)',
            likertRed: 'var(--likert-red)',
            likertOrange: 'var(--likert-orange)',
            likertYellow: 'var(--likert-yellow)',
            likertLightGreen: 'var(--likert-light-green)',
            likertGreen: 'var(--likert-green)',

            // required by shadcn
            background: 'var(--background)',
            foreground: 'var(--foreground)',
            card: {
                DEFAULT: 'var(--card)',
                foreground: 'var(--card-foreground)'
            },
            popover: {
                DEFAULT: 'var(--popover)',
                foreground: 'var(--popover-foreground)'
            },
            primary: {
                DEFAULT: 'var(--primary)',
                foreground: 'var(--primary-foreground)'
            },
            secondary: {
                DEFAULT: 'var(--secondary)',
                foreground: 'var(--secondary-foreground)'
            },
            muted: {
                DEFAULT: 'var(--muted)',
                foreground: 'var(--muted-foreground)'
            },
            accent: {
                DEFAULT: 'var(--accent)',
                foreground: 'var(--accent-foreground)'
            },
            destructive: {
                DEFAULT: 'var(--destructive)',
                foreground: 'var(--destructive-foreground)'
            },
            border: 'var(--border)',
            input: 'var(--input)',
            ring: 'var(--ring)',
            chart: {
                1: 'var(--chart-1)',
                2: 'var(--chart-2)',
                3: 'var(--chart-3)',
                4: 'var(--chart-4)',
                5: 'var(--chart-5)'
            }
        }
    },
    plugins: []
};
