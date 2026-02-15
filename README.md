<div align="center">
  <a href="https://bun.sh"
    ><img width="80" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/bun_js.png" alt="Bun.js" title="Bun.js"/></a>
  <a href="https://www.typescriptlang.org"
    ><img width="80" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" title="TypeScript"/></a>
  <a href="https://vueuse.org"
    ><img width="80" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vue_js.png" alt="Vue.js" title="Vue.js"/></a>
  <a href="https://tailwindcss.com/"
    ><img width="80" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/tailwind_css.png" alt="Tailwind CSS" title="Tailwind CSS"/></a>
</div>

<div align="center">
  <h1>Bun + TypeScript + Vue + Tailwind CSS</h1>
</div>

This starter template should help get you started developing with Vue 3, Tailwind CSS and TypeScript on Bun.

## Getting Started

Run the following to update and install dependencies:

```bash
bun update
```

Remove `.keep` files by running:

```bash
find . -type f -name '.keep' -delete
```

Then, initialize git by running:

```bash
git init && git add -A && git commit -m "Initial commit" --no-verify
```

Initialize git hook by running:

```bash
bunx --bun simple-git-hooks
```

## Project Overview

The project leverages several key technologies:

- **Vue.js** - Progressive JavaScript framework for building user interfaces
- **Ark UI** - Accessible, framework-agnostic UI components
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Bun** - Fast JavaScript runtime and package manager
- **TypeScript** - Superset of JavaScript that adds static typing

## Architecture

The project follows the standard vue project structure:

- `public/`: Static assets like images and favicons
- `scripts/`: Scripts for project automation
- `src/`: Source code with:
  - `assets/`: Image and other static assets
  - `components/`: Reusable Vue components
  - `layouts/`: Layout templates
  - `lib/`: Utility functions and modules
  - `pages/`: Vue components mapped to routes
  - `router/`: Vue Router configuration and route definitions
  - `styles/`: Global styles and CSS (using Tailwind CSS)

## Building and Running

### Prerequisites

- Bun runtime must be installed on your system

### Setup and Commands

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Development server:**

   ```bash
   bun dev
   ```

   This starts the local development server at `localhost:5173`

3. **Build for production:**

   ```bash
   bun build
   ```

   Builds the production site to the `./dist/` directory

4. **Preview production build locally:**

   ```bash
   bun preview
   ```

5. **Updating dependencies:**

   To check outdated dependencies and update them, run:

   ```bash
   bun outdated
   ```

   To update dependencies, run:

   ```bash
   bun update
   ```

### Additional Commands

1. **Linting:**

   ```bash
   # Run ESLint to check for linting issues
   bun lint

   # Run ESLint on staged files
   bun lint:staged

   # Run ESLint on changed files
   bun lint:changed
   ```

2. **Formatting:**

   ```bash
   # Auto-fix formatting issues with ESLint
   bun format

   # Format only changed files
   bun format:changed

   # Format only staged files
   bun format:staged
   ```

3. **Type checking:**

   ```bash
   # Run TypeScript type checking
   bun typecheck
   ```

4. **Testing:**

   ```bash
   # Run tests
   bun test

   # Run tests in watch mode
   bun test:watch
   ```

## Development Conventions

- **Code Style:** The project uses ESLint with the `@antfu/eslint-config` configuration for consistent code formatting and quality
- **Styling:** Tailwind CSS is used for styling with a base layer configuration in `global.css`
- **Components:** Vue components use the `<script setup lang="ts">` syntax for simplicity
- **Accessibility:** Ark UI components are integrated for accessible UI components
- **File Structure:** Pages in the `src/pages/` directory represent routes in the application

## Key Dependencies

- `@ark-ui/vue` - Accessible Vue UI components
- `@tailwindcss/vite` - Tailwind CSS integration with Vite
- `vue` - Vue.js framework
- `tailwindcss` - Utility-first CSS framework
- `arktype` - Type validation library

## Configuration Files

- `tsconfig.json` - TypeScript configuration config
- `eslint.config.ts` - ESLint configuration for code quality
- `vite.config.ts` - Vite configuration for bundling
- `.gitignore` - Git ignore patterns
- `.bun-version` - Specifies the Bun version used in the project

## Project Features

- Component reusability with Vue integration
- Accessible UI components through Ark UI
- Modern CSS with Tailwind and utility-first approach
- Strict type checking with TypeScript
- Automated linting and formatting
- Testing capabilities with Bun test runner
