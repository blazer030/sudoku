# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `npm run start` - Start development server with Vite
- `npm run build` - Build production version (TypeScript compile + Vite build)
- `npm run preview` - Preview production build locally

### Code Quality

- `npm run lint` - Run ESLint with TypeScript support
- `npm test` - Run tests with Vitest

## Architecture

This is a React + TypeScript Sudoku game following Domain-Driven Design principles:

### Project Structure

```
src/
├── domain/           # Core business logic
│   ├── Sudoku.ts    # Main game engine with puzzle generation and validation
│   └── PuzzleCell.ts # Cell model with value, input, and notes management
├── presentation/     # UI layer
│   ├── App.tsx      # Root component with responsive layout
│   ├── components/  # Reusable UI components (Button, Icon, etc.)
│   └── pages/       # Route-based page components (Home, Game)
├── application/     # Application services (currently empty)
└── style/           # Global SCSS styles
```

### Key Patterns

- **Domain Models**: Core game logic separated from UI concerns
- **Path Aliases**: `@/` maps to `src/` directory
- **Component Structure**: Uses Radix UI primitives with class-variance-authority for styling
- **Routing**: React Router with nested routes under responsive App container

### Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with ESLint integration
- **Styling**: Tailwind CSS + SCSS
- **Testing**: Vitest with globals enabled
- **UI Components**: Radix UI + Lucide React icons

## Git Commit 規則

### Commit Message 格式

- **簡潔明確**：表達意圖即可，避免過多細節
- **不包含作者資訊**：不要加入 Claude Code 或 Co-Authored-By 等標記
- **遵循專案風格**：參考現有 commit 的格式和用詞
- **使用 Emoji**：在 commit type 前加上對應的 emoji

### Emoji Usage Guide

- 🐛 fix: For bug fixes
- ✨ feat: For new features
- 📄 docs: For documentation changes
- ♻️ refactor: For code refactoring without changing functionality
- 🚀 perf: For performance improvements
- 🔒 security: For security-related fixes
- 🚧 chore: For maintenance tasks
- 🧪 test: For tests

### 範例格式

```
♻️ refactor: migrate [ComponentName] from styled components to functional components

- Convert styled components to functional components with TypeScript interfaces
- Apply Bootstrap to Tailwind spacing migration
- Maintain component interfaces and functionality
```

### 避免的內容

- ❌ 過度詳細的技術細節
- ❌ Claude Code 生成標記
- ❌ Co-Authored-By 資訊
- ❌ 每個小改動的列舉

### 推薦的內容

- ✅ 主要變更的目的和範圍
- ✅ 關鍵的架構性改動
- ✅ 對功能的影響概述
