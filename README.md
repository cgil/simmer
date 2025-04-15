# Simmer - A Paper Notebook Recipe Manager

Simmer is a modern web application that brings the warmth and personality of a paper recipe notebook to the digital world. It allows you to capture, organize, and cook from your favorite recipes with a beautiful, journal-like interface.

## Features

-   📝 Paper notebook-style interface with a warm, personal feel
-   🔍 AI-powered recipe extraction from URLs
-   🧠 AI-powered recipe ideas generation from text prompts
-   📱 Mobile-friendly cooking mode with interactive timers
-   🖼️ Beautiful image gallery management
-   📂 Collections to organize recipes with custom emoji icons
-   🔍 All Recipes view and collection-specific browsing
-   ⚡ Real-time ingredient scaling
-   📋 Section-based cooking instructions
-   ⏲️ Multi-timer tracking across recipe steps
-   ⚖️ Flexible time handling (supports zero prep/cook times)
-   🎨 Whimsical loading states with recipe-themed progress indicators
-   🔖 @-mention style ingredient references in instructions
-   👤 User profile pictures from authentication providers (Google, GitHub, etc.)

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

3. Copy `.env.example` to create your environment files:

```bash
cp .env.example .env.local    # For local development
cp .env.example .env.production    # For production deployment
```

4. Configure your environment files:
    - `.env.local`: Used for local development with Supabase running locally
    - `.env.production`: Used for production deployment with your Supabase cloud project

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
    # Development mode - JWT verification disabled
    npm run functions:serve

    # Test recipe extraction (requires authentication in production)
    npm run test:function

    # Deploy functions
    npm run functions:deploy:dev  # Development (JWT verification disabled)
    npm run functions:deploy:prod # Production (JWT verification enabled)
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

### Environment Setup

We use two environment files:

1. `.env.local` - Local development
2. `.env.production` - Production deployment

Each file should contain:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Environment Configuration
ENVIRONMENT=development|production

# JWT Configuration
SUPABASE_JWT_SECRET=your_jwt_secret  # Required for production

# Additional configurations as needed
```

### Deploying to Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Configure environment variables in Vercel:

```bash
vercel env pull .env.production
```

3. Deploy:

```bash
npm run deploy
```

### Deploying Functions to Supabase

```bash
npm run functions:deploy
```

### Deployment Checklist

1. Update environment variables
2. Run database migrations
3. Deploy Supabase functions
4. Deploy frontend to Vercel
5. Test the deployment

### Monitoring

-   Check Supabase logs in the dashboard
-   Monitor OpenAI API usage
-   Set up error tracking (recommended: Sentry)
-   Monitor Vercel deployment status

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

### Recent Updates

#### Dynamic OpenGraph Previews for Recipe Sharing

-   Added Vercel Edge Middleware to generate dynamic OpenGraph tags for recipe links
-   Enabled rich previews when sharing recipe URLs in iMessage, social apps, and messaging platforms
-   Optimized approach that only runs for crawler user agents to minimize function costs
-   Included fallback image for recipes without photos
-   Added caching for improved performance

#### Recipe Collections

-   Added support for organizing recipes into user-defined collections
-   Implemented persistent drawer UI for collection navigation
-   Custom emoji picker for personalizing collection icons
-   Smooth animations for adding, removing, and updating collections
-   Database schema with proper relationships and row-level security
-   Collection-specific recipe browsing with search support
-   Special "All Recipes" view to see recipes across all collections

#### User Profile Avatar Integration

-   Added support for displaying user profile pictures from authentication providers
-   Implemented fallback mechanisms for when profile images aren't available
-   Created a dedicated UserAvatar component with proper error handling

#### Improved Ingredient Reference Handling

-   Enhanced saving process to ensure all ingredient references use proper UUID format
-   Proactive conversion of any slug-based references during recipe save
-   Improved visual feedback for different types of ingredient references
-   Enhanced error detection for invalid or missing ingredient references
-   Better tooltip information when hovering over ingredient mentions
-   Support for multiple ingredient reference formats in instructions

#### Time Handling Improvements

-   Support for zero prep and cook times
-   Automatic total time calculation
-   Enhanced time display in recipe cards and details
-   Flexible time input validation

#### Recipe Extraction Enhancements

-   Improved extraction reliability
-   Whimsical loading states during extraction
-   Better error handling and user feedback
-   Enhanced progress tracking with themed steps

#### Ingredient Reference System

-   @-mention style references for ingredients in instructions
-   Visual highlighting of referenced ingredients
-   Auto-formatting of ingredient quantities and units
-   Easy ingredient selection via dropdown or carrot button
