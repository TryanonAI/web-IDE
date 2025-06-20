import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    "name": "ANON AI",
    "short_name": "ANON",
    "description": "AI-powered code generation and deployment platform with Arweave integration",
    "start_url": "/",
    "display": "standalone",
    "background_color": "hsl(142, 30%, 35%)",
    "theme_color": "hsl(142, 30%, 35%)",
    "orientation": "portrait-primary",
    "icons": [
      {
        "src": "/logo_white.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/logo_black.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "/logo_white.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable"
      },
      {
        "src": "/logo_black.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    // "categories": ["developer", "productivity", "utilities"],
    // "lang": "en",
    // "dir": "ltr",
    // "screenshots": [
    //   {
    //     "src": "/screenshot-wide.png",
    //     "sizes": "1280x720",
    //     "type": "image/png",
    //     "form_factor": "wide"
    //   },
    //   {
    //     "src": "/screenshot-narrow.png",
    //     "sizes": "720x1280",
    //     "type": "image/png",
    //     "form_factor": "narrow"
    //   }
    // ],
    "scope": "/",
    "id": "anon-ai-platform",
    "prefer_related_applications": false,
    "related_applications": [],
    "shortcuts": [
      {
        "name": "Home",
        "short_name": "Home",
        "description": "Go to home page",
        "url": "/",
        "icons": [
          {
            "src": "/logo_black.png",
            "sizes": "192x192"
          }
        ]
      },
      {
        "name": "Dashboard",
        "short_name": "Dashboard",
        "description": "Access your project dashboard",
        "url": "/dashboard",
        "icons": [
          {
            "src": "/logo_black.png",
            "sizes": "192x192"
          }
        ]
      },
      {
        "name": "Profile",
        "short_name": "Profile",
        "description": "View and edit your profile",
        "url": "/profile",
        "icons": [
          {
            "src": "/logo_black.png",
            "sizes": "192x192"
          }
        ]
      }
    ]
  }
}