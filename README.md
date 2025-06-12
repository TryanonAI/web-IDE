# Frontend Project Structure

```
fe/
├── app/                    # Next.js app directory (pages and routes)
├── components/            # React components
│   ├── common/           # Shared/reusable components
│   ├── features/         # Feature-specific components
│   │   ├── dashboard/    
│   │   ├── landing/     
│   │   └── profile/     
│   ├── layouts/          # Layout components
│   └── ui/              # UI components (buttons, inputs, etc.)
├── config/               # Configuration files
├── hooks/               # Custom React hooks
├── lib/                 # Core utilities and services
│   ├── api/            # API related functions
│   ├── utils/          # Utility functions
│   └── services/       # Service layer
├── public/             # Static assets
├── styles/             # Global styles and theme
└── types/              # TypeScript type definitions
```

## Directory Structure Details

- `app/`: Contains Next.js pages and routes using the App Router
- `components/`: All React components organized by purpose
- `config/`: Application configuration and constants
- `hooks/`: Reusable React hooks
- `lib/`: Core utilities, API functions, and services
- `public/`: Static assets like images and fonts
- `styles/`: Global styles, CSS modules, and theme configuration
- `types/`: TypeScript type definitions and interfaces