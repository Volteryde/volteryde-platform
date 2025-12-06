import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { RootProvider } from 'fumadocs-ui/provider/react-router';
import type { Route } from './+types/root';
import './app.css';
import { useMqtt } from './hooks/useMqtt'; // Import the useMqtt hook
import { useEffect, useState } from 'react';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
  { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
  { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/android-chrome-192x192.png' },
  { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/android-chrome-512x512.png' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const mqttBrokerUrl = import.meta.env.DEV
    ? 'ws://localhost:9001' // Local Mosquitto over WebSockets
    : import.meta.env.VITE_MQTT_BROKER_URL_PROD || 'wss://your-aws-iot-endpoint:443'; // Use environment variable for production

  const { isConnected, messages, subscribe } = useMqtt(mqttBrokerUrl);
  const [latestMessage, setLatestMessage] = useState<any>(null);

  useEffect(() => {
    if (isConnected) {
      // Subscribe to all vehicle location updates for the admin dashboard
      subscribe('volteryde/telematics/live/all/location');
      subscribe('volteryde/telematics/live/all/diagnostics');
      subscribe('volteryde/telematics/live/all/alert');
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    if (messages.length > 0) {
      setLatestMessage(messages[messages.length - 1]);
    }
  }, [messages]);

  return (
    <>
      <div style={{ padding: '10px', background: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
        MQTT Status: {isConnected ? 'Connected' : 'Disconnected'}
        {latestMessage && (
          <div style={{ marginTop: '5px', fontSize: '0.8em' }}>
            Latest MQTT Message:
            <pre style={{ margin: '0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              Topic: {latestMessage.topic}
              Payload: {JSON.stringify(latestMessage.parsedPayload || latestMessage.payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
