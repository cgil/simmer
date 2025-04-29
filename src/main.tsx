import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { inject } from '@vercel/analytics';
import config from './config'; // Import the config object

// Only inject analytics in production
if (config.environment === 'production') {
    inject();
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <DndProvider backend={HTML5Backend}>
            <App />
        </DndProvider>
    </StrictMode>
);
