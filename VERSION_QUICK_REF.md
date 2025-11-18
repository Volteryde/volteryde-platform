# 🚀 Quick Version Update Reference

## Simple Commands

```bash
# 🔧 Patch Release (Bug Fixes): 1.0.0 → 1.0.1
pnpm release:patch

# ✨ Minor Release (New Features): 1.0.0 → 1.1.0
pnpm release:minor

# 💥 Major Release (Breaking Changes): 1.0.0 → 2.0.0
pnpm release:major

# 🤖 Auto-detect from commits
pnpm release
```

## Before Every Release

```bash
# 1. Make sure everything is committed
git status

# 2. Run tests
pnpm test

# 3. Build all services
pnpm build

# 4. Bump version
pnpm release:patch   # or minor/major

# 5. Push changes
git push origin main --follow-tags
```

## Check Version

```bash
# NestJS Backend
curl http://localhost:3000/api/v1/health | jq .version

# All package.json files
grep "\"version\":" package.json */*/package.json
```

## Manual Version (if needed)

```bash
node scripts/update-version.js 1.2.3
git add .
git commit -m "chore(release): v1.2.3 🚀"
git tag v1.2.3
```

## Commit Message Format

```bash
# Features → bumps MINOR (1.0.0 → 1.1.0)
git commit -m "feat: add new feature"

# Fixes → bumps PATCH (1.0.0 → 1.0.1)
git commit -m "fix: resolve bug"

# Breaking → bumps MAJOR (1.0.0 → 2.0.0)
git commit -m "feat!: breaking change"
```
