import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        environmentOptions: {
            jsdom: { url: 'https://test.adopus.localhost/' },
        },
        server: {
            deps: {
                // The oldest supported helpers release needs the app bundler's extension resolution.
                inline: ['asma-core-helpers'],
            },
        },
    },
})
