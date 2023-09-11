/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{html,js,svelte,ts,scss}'],
    theme: {
        colors: {
            transparent: 'transparent',
            current: 'currentColor',
            primary: 'var(--primary)',
            secondary: 'var(--secondary)',
            secondaryLight: 'var(--secondary-light)',
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
            textColorOnGradient: 'var(--text-color-on-gradient)',
            textColorInverted: 'var(--text-color-inverted)',
            textColorDanger: 'var(--text-color-danger)',
            timelineAccent: 'var(--timeline-accent)'
        }
    },
    plugins: []
};
