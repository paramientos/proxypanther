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
    colors: {
        brand: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
        },
    },
    semanticTokens: {
        colors: {
            'chakra-body-bg': { _dark: '#0f0f0f' },
        },
    },
    styles: {
        global: {
            body: {
                bg: 'gray.950',
                color: 'gray.100',
            },
        },
    },
    components: {
        Button: {
            defaultProps: { colorScheme: 'brand' },
        },
        Badge: {
            defaultProps: { colorScheme: 'brand' },
        },
        Progress: {
            defaultProps: { colorScheme: 'brand' },
        },
        Switch: {
            defaultProps: { colorScheme: 'brand' },
        },
        Tabs: {
            defaultProps: { colorScheme: 'brand' },
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
        color: '#4B5563',
    },
});
