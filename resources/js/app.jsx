import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';

const theme = createTheme({
    primaryColor: 'orange',
    primaryShade: 6,
    colors: {
        orange: [
            '#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078',
            '#ffa94d', '#ff922b', '#f38020', '#e8590c',
            '#d9480f', '#bf360c',
        ],
        dark: [
            '#c1c2c5', '#a6a7ab', '#909296', '#5c5f66',
            '#373a40', '#2c2e33', '#25262b', '#1a1b1e',
            '#141517', '#101113',
        ],
    },
    fontFamily: 'Inter, Plus Jakarta Sans, system-ui, sans-serif',
    fontFamilyMonospace: 'JetBrains Mono, Fira Code, monospace',
    defaultRadius: 'md',
    components: {
        Button: {
            defaultProps: { size: 'sm' },
            styles: {
                root: { fontWeight: 600 },
            },
        },
        TextInput: {
            styles: {
                input: {
                    backgroundColor: '#0a0a0b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#e4e4e7',
                    '&:focus': { borderColor: '#f38020' },
                },
            },
        },
        Select: {
            styles: {
                input: {
                    backgroundColor: '#0a0a0b',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#e4e4e7',
                },
            },
        },
        Paper: {
            defaultProps: { bg: '#111113' },
        },
        Modal: {
            styles: {
                content: { backgroundColor: '#111113', border: '1px solid rgba(255,255,255,0.07)' },
                header: { backgroundColor: '#111113', borderBottom: '1px solid rgba(255,255,255,0.07)' },
            },
        },
        Table: {
            styles: {
                table: { borderCollapse: 'collapse' },
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
        const app = (
            <MantineProvider theme={theme} defaultColorScheme="dark">
                <Notifications position="top-right" />
                <ModalsProvider>
                    <App {...props} />
                </ModalsProvider>
            </MantineProvider>
        );

        if (import.meta.env.SSR) {
            hydrateRoot(el, app);
            return;
        }

        createRoot(el).render(app);
    },
    progress: {
        color: '#f38020',
    },
});
