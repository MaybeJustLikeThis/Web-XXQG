# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (includes TypeScript compilation with vue-tsc --noEmit)
- `npm run serve` - Preview production build locally

### Node Requirements
- Node.js 14.18+ required (due to Vite 3)

## Architecture Overview

This is a Vue 3 admin dashboard system built with modern tools and patterns:

### Tech Stack
- **Frontend Framework**: Vue 3 + TypeScript + Composition API
- **Build Tool**: Vite 3 with vue-tsc for TypeScript checking
- **State Management**: Pinia stores
- **UI Framework**: Element Plus with auto-import
- **Router**: Vue Router 4 with hash-based routing
- **HTTP Client**: Axios with custom interceptors
- **Icons**: Element Plus Icons Vue

### Project Structure
```
src/
├── api/              # API layer modules (auth, article, department, etc.)
├── components/       # Reusable Vue components
├── router/           # Vue Router configuration with permission guards
├── store/            # Pinia stores (permiss, sidebar, theme, tabs)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions and request interceptors
└── views/            # Page components organized by feature
    ├── content/      # Content management (articles, topics, columns)
    ├── organization/ # Organization management (users, departments)
    ├── points/       # Points system (rules, records, statistics)
    ├── question/     # Question management
    └── ...
```

### Key Architectural Patterns

#### Permission System
- Role-based permissions using numeric permission codes
- Custom `v-permiss` directive for component-level access control
- Permission-based route guards in router/index.ts
- Store: src/store/permiss.ts (admin/user role presets)

#### API Layer
- Centralized axios configuration in src/utils/request.ts
- Development proxy to `https://wx.frp.geekyuu.com` via Vite
- Environment-aware base URL configuration
- Error handling and response interceptors

#### State Management
- Pinia stores for different concerns:
  - `permiss.ts`: User permissions and role management
  - `sidebar.ts`: Sidebar collapse state
  - `theme.ts`: Theme configuration
  - `tabs.ts`: Multi-tab navigation state

#### Routing Strategy
- Hash-based routing (`createWebHashHistory`)
- Lazy-loaded components with webpack chunk names
- Route metadata for permissions and titles
- NProgress integration for loading indicators

#### Component Auto-Import
- Element Plus components auto-imported via unplugin-vue-components
- TypeScript support via unplugin-auto-import
- Custom script name attribute support via vite-plugin-vue-setup-extend

### Configuration Files
- `vite.config.ts`: Vite configuration with proxy setup and path aliases
- Path aliases: `@` → `/src`, `~` → `/src/assets`

### Development Features
- Element Plus icons globally registered
- Permission-based directive system
- Multi-level menu support
- Theme switching capability
- Tab-based navigation system
- Rich text and markdown editors
- Excel import/export functionality
- Chart visualization (ECharts, Schart)

## API Integration Notes
- Development requests proxy through `/api` to avoid CORS
- Backend target: `https://wx.frp.geekyuu.com`
- Request/response interceptors handle error logging
- 15-second timeout on requests
- JSON content type with proper headers