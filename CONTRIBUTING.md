# Contributing to VibeAny

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (optional for static features)

### Setup

```bash
git clone https://github.com/jiahao-jayden/vibe-any-tanstack.git
cd vibe-any
pnpm install
cp .env.example .env.local
pnpm dev
```

The dev server runs at [http://localhost:3377](http://localhost:3377).

## Development Workflow

### Branch Naming

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation changes
- `refactor/short-description` — code refactoring

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

Examples:

```
feat(auth): add GitHub OAuth support
fix(chat): resolve message streaming issue
docs(readme): update deployment instructions
```

### Code Style

- We use [Biome](https://biomejs.dev/) for linting and formatting
- Run `pnpm check` before committing
- Run `pnpm lint:fix` to auto-fix issues

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. Make your changes with clear, focused commits
3. Run `pnpm check` and `pnpm test` to ensure nothing is broken
4. Open a PR and fill in the template
5. Wait for review — we'll try to respond within a few days

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Update documentation if your change affects user-facing behavior
- Add tests for new functionality when possible
- Don't modify database migration files without discussion

## Reporting Issues

- Use the [Bug Report](https://github.com/jiahao-jayden/vibe-any-tanstack/issues/new?template=bug_report.yml) template for bugs
- Use the [Feature Request](https://github.com/jiahao-jayden/vibe-any-tanstack/issues/new?template=feature_request.yml) template for suggestions
- Search existing issues before creating a new one

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
