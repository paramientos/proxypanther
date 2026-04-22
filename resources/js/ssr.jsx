import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { route } from '../../vendor/tightenco/ziggy';
import { MantineProvider, createTheme } from '@mantine/core';
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
    },
    defaultRadius: 'md',
});

const appName = import.meta.env.VITE_APP_NAME || 'ProxyPanther';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => `${title} - ${appName}`,
        resolve: (name) =>
            resolvePageComponent(
                `./Pages/${name}.jsx`,
                import.meta.glob('./Pages/**/*.jsx'),
            ),
        setup: ({ App, props }) => {
            global.route = (name, params, absolute) =>
                route(name, params, absolute, {
                    ...page.props.ziggy,
                    location: new URL(page.props.ziggy.location),
                });

            return (
                <MantineProvider theme={theme} defaultColorScheme="dark">
                    <ModalsProvider>
                        <App {...props} />
                    </ModalsProvider>
                </MantineProvider>
            );
        },
    }),
);
