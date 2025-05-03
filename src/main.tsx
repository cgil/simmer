import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { inject } from '@vercel/analytics';
import config from './config'; // Ensure this points to src/config/index.ts
import posthog from 'posthog-js'; // Import PostHog
import { PostHogProvider } from 'posthog-js/react'; // Import PostHogProvider

// Initialize PostHog ONLY in production
if (
    config.environment === 'production' &&
    config.posthog?.key &&
    config.posthog?.host
) {
    inject(); // Inject Vercel analytics
    posthog.init(config.posthog.key, {
        api_host: config.posthog.host,
        person_profiles: 'identified_only',
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* PostHogProvider is safe to use even if posthog is not initialized */}
        <PostHogProvider client={posthog}>
            <DndProvider backend={HTML5Backend}>
                <App />
            </DndProvider>
        </PostHogProvider>
    </StrictMode>
);
