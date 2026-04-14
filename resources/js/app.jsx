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
            50: '#fff8f1',
            100: '#feebdb',
            200: '#fdd7b7',
            300: '#fbb983',
            400: '#f99b4f',
            500: '#F68220',
            600: '#e56b10',
            700: '#bf520d',
            800: '#99410f',
            900: '#7d3610',
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
        color: '#F68220',
    },
});
