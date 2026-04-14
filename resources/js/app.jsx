import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react';

const theme = extendTheme({
    config: {
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    fonts: {
        heading: '"Plus Jakarta Sans", sans-serif',
        body: '"Plus Jakarta Sans", sans-serif',
        mono: '"JetBrains Mono", monospace',
    },
    colors: {
        brand: {
            50: '#eef2ff',
            100: '#e0e7ff',
            200: '#c7d2fe',
            300: '#a5b4fc',
            400: '#818cf8',
            500: '#6366f1', // Electric Indigo
            600: '#4f46e5',
            700: '#4338ca',
            800: '#3730a3',
            900: '#312e81',
        },
    },
    semanticTokens: {
        colors: {
            'chakra-body-bg': { _dark: '#050508' },
        },
    },
    styles: {
        global: {
            body: {
                bg: '#050508',
                color: 'gray.100',
            },
        },
    },
    components: {
        Button: {
            defaultProps: { colorScheme: 'brand' },
            baseStyle: {
                borderRadius: 'lg',
                fontWeight: '600',
            },
        },
        Badge: {
            defaultProps: { colorScheme: 'brand' },
            baseStyle: {
                borderRadius: 'full',
                textTransform: 'none',
                fontWeight: '600',
                px: 2,
            },
        },
        Progress: {
            defaultProps: { colorScheme: 'brand' },
        },
        Switch: {
            defaultProps: { colorScheme: 'brand' },
        },
        Tabs: {
            defaultProps: { colorScheme: 'brand' },
            baseStyle: {
                tab: {
                    _focus: {
                        boxShadow: 'none',
                    },
                },
            },
        },
    },
});

const appName = import.meta.env.VITE_APP_NAME || 'ProxyPanther';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        if (import.meta.env.SSR) {
            hydrateRoot(el, (
                <ChakraProvider theme={theme}>
                    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
                    <App {...props} />
                </ChakraProvider>
            ));
            return;
        }

        createRoot(el).render(
            <ChakraProvider theme={theme}>
                <ColorModeScript initialColorMode={theme.config.initialColorMode} />
                <App {...props} />
            </ChakraProvider>
        );
    },
    progress: {
        color: '#6366f1',
    },
});
