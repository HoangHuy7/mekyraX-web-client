# Mekyra UI Client

A modern desktop application built with **Tauri v2**, **Vue 3**, **TypeScript**, and **Element Plus**. This project provides a feature-based architecture with Casdoor authentication integration.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development](#development)
- [Build](#build)
- [Environment Variables](#environment-variables)
- [Features](#features)
- [State Management](#state-management)
- [Routing](#routing)
- [IDE Setup](#ide-setup)
- [Troubleshooting](#troubleshooting)

## 🛠 Tech Stack

### Frontend
- **Framework**: Vue 3.5+ with `<script setup>` syntax
- **Language**: TypeScript 5.6+
- **Build Tool**: Vite 6.0+
- **UI Library**: Element Plus 2.13+
- **State Management**: Pinia 3.0+ with persistence plugin
- **Routing**: Vue Router 4.6+
- **Authentication**: Casdoor (casdoor-vue-sdk)

### Desktop
- **Runtime**: Tauri v2
- **Backend**: Rust (minimal, using tauri-plugin-opener)

## 📁 Project Structure

```
mekyra-ui-client/
├── src/                          # Frontend source code
│   ├── features/                 # Feature modules (domain-driven)
│   │   ├── auth/                 # Authentication feature
│   │   │   ├── pages/           # Auth pages (Login, Callback)
│   │   │   ├── store/           # Auth state management
│   │   │   └── types/           # Auth type definitions
│   │   ├── dashboard/           # Dashboard feature
│   │   └── product/             # Product management feature
│   ├── shared/                   # Shared/common code
│   │   ├── components/          # Reusable components
│   │   ├── config/              # App configuration
│   │   ├── hooks/               # Composable functions
│   │   ├── router/              # Vue Router setup
│   │   ├── store/               # Global stores
│   │   └── types/               # Global type definitions
│   ├── assets/                   # Static assets
│   ├── App.vue                   # Root component
│   └── main.ts                   # Application entry point
├── src-tauri/                    # Tauri backend (Rust)
│   ├── src/                     # Rust source code
│   ├── capabilities/            # Tauri permissions
│   ├── icons/                   # App icons
│   ├── Cargo.toml               # Rust dependencies
│   └── tauri.conf.json          # Tauri configuration
├── public/                       # Public static files
├── .env.example                  # Environment variables template
├── index.html                    # HTML entry point
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite configuration
```

## 📦 Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.x (LTS recommended)
- **npm** or **pnpm** (package manager)
- **Rust** >= 1.70 (for Tauri) - Install via [rustup](https://rustup.rs/)
- **Git** for version control

### Platform-specific requirements

#### Windows
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed on Windows 11)
- Microsoft Visual Studio C++ Build Tools

#### macOS
- Xcode Command Line Tools
- Apple Silicon users may need to install Rust with specific target

#### Linux
- WebKit2GTK (or GTK + libwebkit2gtk-4.0-dev)
- Other dependencies per [Tauri documentation](https://tauri.app/v1/guides/getting-started/prerequisites)

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd mekyra-ui-client
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` with your Casdoor configuration:

```env
VITE_CASDOOR_SERVER_URL=http://localhost:8000
VITE_CASDOOR_CLIENT_ID=your-client-id
VITE_CASDOOR_ORG_NAME=your-org-name
VITE_CASDOOR_APP_NAME=your-app-name
VITE_CASDOOR_REDIRECT_PATH=/callback
```

### 4. Run development server

```bash
npm run dev
```

This will start both the Vite dev server and open the Tauri window.

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode with hot-reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run tauri dev` | Run Tauri in development mode |
| `npm run tauri build` | Build Tauri app for production |

### Development Tips

- The app uses **feature-based architecture** - each feature is self-contained in `src/features/`
- Use **Pinia stores** for state management with automatic persistence
- All API calls should go through the feature's service layer
- Components are organized by feature, shared components go in `src/shared/components/`

## 🏗️ Build

### Build for Production

```bash
npm run build
```

### Build Tauri App

```bash
npm run tauri build
```

This will create distributable packages in `src-tauri/target/release/bundle/`:
- `.exe` installer for Windows
- `.dmg` for macOS
- `.deb` / `.AppImage` for Linux

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_CASDOOR_SERVER_URL` | Casdoor server URL | `http://localhost:8000` |
| `VITE_CASDOOR_CLIENT_ID` | OAuth client ID from Casdoor | `abc123` |
| `VITE_CASDOOR_ORG_NAME` | Organization name in Casdoor | `my-org` |
| `VITE_CASDOOR_APP_NAME` | Application name in Casdoor | `my-app` |
| `VITE_CASDOOR_REDIRECT_PATH` | OAuth callback path | `/callback` |

> ⚠️ **Important**: Never commit `.env` file to version control. Only `.env.example` should be committed.

## 🎯 Features

### Authentication (`src/features/auth`)
- Casdoor OAuth2 integration
- Login page with SSO support
- Callback handling for OAuth redirect
- Session persistence with Pinia
- Route guards for protected pages

### Dashboard (`src/features/dashboard`)
- Main landing page after login
- Overview statistics and quick actions

### Product Management (`src/features/product`)
- Product listing with pagination
- Product detail view
- CRUD operations (if implemented)

## 🗄️ State Management

The app uses **Pinia** for state management with the `pinia-plugin-persistedstate` plugin for automatic persistence.

### Store Structure

```typescript
// Example: Auth Store
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  // state, getters, actions
}, {
  persist: true // Automatically persists to localStorage
});
```

### Usage in Components

```vue
<script setup lang="ts">
import { useAuthStore } from '@/features/auth/store/auth.store';

const authStore = useAuthStore();
const isAuthenticated = authStore.isAuthenticated;
</script>
```

## 🛣️ Routing

Routes are defined in `src/shared/router/index.ts` with the following structure:

- **Public routes**: `/login`, `/callback` (no auth required)
- **Protected routes**: All other routes require authentication
- **Layout**: `AdminLayout` wraps all protected routes

### Route Meta Fields

| Field | Type | Description |
|-------|------|-------------|
| `public` | `boolean` | Route doesn't require authentication |
| `requiresAuth` | `boolean` | Route requires authentication |
| `title` | `string` | Page title for navigation |
| `icon` | `string` | Element Plus icon name |
| `keepAlive` | `boolean` | Keep component alive when navigating away |

## 🖥️ IDE Setup

### Recommended Extensions

- **[VS Code](https://code.visualstudio.com/)** (Recommended)
- **[Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)** - Vue 3 language support
- **[Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)** - Tauri development tools
- **[rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)** - Rust language support
- **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)** - Code linting
- **[Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)** - Code formatting

### VS Code Settings (.vscode/settings.json)

The project includes recommended VS Code settings in the `.vscode` folder.

## 🐛 Troubleshooting

### Common Issues

#### Tauri window doesn't open
- Ensure Rust is properly installed: `rustc --version`
- Try running `npm run tauri dev` directly

#### Port already in use
- Vite dev server uses port `1420` by default (configured in `vite.config.ts`)
- Change port in `vite.config.ts` if needed

#### Casdoor authentication fails
- Verify `.env` configuration matches your Casdoor setup
- Check that redirect URI in Casdoor matches `VITE_CASDOOR_REDIRECT_PATH`
- Ensure Casdoor server is running

#### Build errors with Rust
- Update Rust: `rustup update`
- Clear Tauri cache: `rm -rf src-tauri/target`

### Debug Mode

Enable verbose logging by adding to your `.env`:

```env
DEBUG=true
```

## 📚 Additional Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Tauri Documentation](https://tauri.app/)
- [Element Plus Documentation](https://element-plus.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Casdoor Documentation](https://casdoor.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code style
3. Test thoroughly in development mode
4. Submit a pull request

---

**Version**: 0.1.0  
**License**: Private
