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

## Local Development Setup

### Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn
-   [Supabase CLI](https://supabase.com/docs/guides/cli) installed globally
-   Docker Desktop (required for Supabase local development)
-   OpenAI API key

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/cgil/simmer.git
cd simmer
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```env
# Local Development
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
OPENAI_API_KEY=your_openai_api_key
```

### Starting the Development Environment

1. Start the Supabase local development environment:

```bash
npm run supabase:start
```

2. Start both the Vite development server and Supabase functions:

```bash
npm run dev:all
```

The application will be available at:

-   Frontend: `http://localhost:5173`
-   Supabase Studio: `http://localhost:54323`
-   Functions: `http://localhost:54321/functions/v1/*`

### Available Development Commands

#### Supabase Control

-   `npm run supabase:start` - Start Supabase local development
-   `npm run supabase:stop` - Stop Supabase local development
-   `npm run supabase:status` - Check Supabase services status

#### Database Management

-   `npm run db:reset` - Reset local database to clean state
-   `npm run db:migration:new` - Create a new migration file

#### Function Development

-   `npm run functions:serve` - Start functions development server
-   `npm run functions:deploy` - Deploy functions (development)
-   `npm run functions:deploy:prod` - Deploy functions (production)

#### Testing

-   `npm run test:function` - Test recipe extraction with sample URL

### Development Workflow

1. **Making Database Changes**

    ```bash
    # Create a new migration
    npm run db:migration:new your_migration_name

    # Apply migrations
    npm run db:reset
    ```

2. **Working with Functions**

    ```bash
    # Start functions server (auto-reloads on changes)
    npm run functions:serve

    # Test recipe extraction
    npm run test:function
    ```

3. **Full Development Environment**
    ```bash
    # Start everything
    npm run supabase:start
    npm run dev:all
    ```

### Troubleshooting

1. **Supabase Issues**

    - Check service status: `npm run supabase:status`
    - Try stopping and restarting:
        ```bash
        npm run supabase:stop
        npm run supabase:start
        ```

2. **Function Development**

    - Functions logs are available in the terminal running `functions:serve`
    - Check Supabase Studio for function invocation logs

3. **Database Reset**
    - If schema gets corrupted: `npm run db:reset`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

### Deploying to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Configure environment variables in Vercel:

    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `OPENAI_API_KEY`

3. Deploy:

```bash
vercel
```

### Deploying Functions to Supabase

```bash
# Development (no JWT verification)
npm run functions:deploy

# Production (with JWT verification)
npm run functions:deploy:prod
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   Material-UI for the component library
-   OpenAI for recipe extraction capabilities
-   Supabase for backend services
-   Vercel for hosting and deployment
