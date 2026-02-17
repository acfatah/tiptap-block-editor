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

# Tiptap Block Editor

An example of block-style editor built with Vue 3 + TypeScript + Bun, powered by Tiptap.

## Features

- Block editor with drag handle and block controls
- Slash menu (`/`) for quick block insertion
- Turn-into / insert actions for paragraph and table blocks
- Table support with row/column operations
- Table edge controls (add row / add column)
- Vue Router + NProgress page transitions
- Tailwind CSS v4 + Ark UI based primitives

## Tech Stack

- Bun
- Vue 3 + TypeScript
- Vite
- Tiptap (`@tiptap/vue-3`, starter-kit, table extensions, drag-handle extension)
- Tailwind CSS v4
- Ark UI + Icon libraries

## Getting Started

### Prerequisites

- Bun installed on your machine

### Install

```bash
bun install
```

### Run locally

```bash
bun dev
```

Default Vite URL is usually `http://localhost:5173`.

### Build

```bash
bun run build
```

### Preview production build

```bash
bun preview
```

## Available Scripts

### Code Quality

```bash
bun lint
bun lint:changed
bun lint:staged
bun lint:inspect
```

```bash
bun format
bun format:changed
bun format:staged
```

```bash
bun typecheck
```

### UI Registry Helper

```bash
bun ui --help
```

Used to query/add components from a remote registry (see `scripts/ui.ts`).

## Project Structure

```text
src/
   components/
    BlockEditor.vue                 # Main editor component
    editor/
         BlockHandleButtons.vue        # Drag/add block controls
         SlashMenu.vue                 # Slash + turn-into menu UI
         TableEdgeControls.vue         # Edge controls for table row/column insertion
         composables/
            useBlockCommands.ts         # Block/table command execution
            useSlashMenu.ts             # Slash menu state + positioning
            useTableEdgeControls.ts     # Table edge button behavior
         extensions/
            activeTableCell.ts          # Active table cell behavior
   pages/home/Home.vue               # Demo page with editor instance
   router/index.ts                   # Router + NProgress integration
```

## Notes

- The editor content is currently managed as HTML via `v-model` in `Home.vue`.
- Current slash/turn-into commands include paragraph + table and table row/column actions.
