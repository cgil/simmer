# Simmer - A Paper Notebook Recipe Manager

Simmer is a modern web application that brings the warmth and personality of a paper recipe notebook to the digital world. It allows you to capture, organize, and cook from your favorite recipes with a beautiful, journal-like interface.

## Features

-   📝 Paper notebook-style interface with a warm, personal feel
-   🔍 AI-powered recipe extraction from URLs
-   📱 Mobile-friendly cooking mode with interactive timers
-   🖼️ Beautiful image gallery management
-   ⚡ Real-time ingredient scaling
-   📋 Section-based cooking instructions
-   ⏲️ Multi-timer tracking across recipe steps

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn
-   A modern web browser

### Installation

1. Clone the repository:

```bash
git clone https://github.com/cgil/simmer.git
cd simmer
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Development

### Project Structure

```
src/
  ├── components/      # Reusable UI components
  ├── pages/           # Page components
  ├── features/        # Feature-specific components
  ├── hooks/           # Custom React hooks
  ├── utils/           # Utility functions
  ├── types/           # TypeScript type definitions
  ├── theme/           # MUI theme configuration
  └── App.tsx          # Root component
```

### Tech Stack

-   React 18 with TypeScript
-   Vite for build tooling
-   Material-UI (MUI) for UI components
-   Supabase for backend services
-   OpenAI API for recipe extraction
