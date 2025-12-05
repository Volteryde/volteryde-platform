# 🔄 Version Management Guide

## Overview

Volteryde Platform uses **Semantic Versioning (SemVer)** for all services and applications.

**Version Format**: `MAJOR.MINOR.PATCH[-PRERELEASE]`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)
- **PRERELEASE**: alpha, beta, rc versions

---

## 📋 Current Versions

- **Platform**: v1.0.0
- **NestJS Backend**: v1.0.0
- **Spring Boot Backend**: v1.0.0
- **Temporal Workers**: v1.0.0
- **Web Apps**: v1.0.0

---

## 🚀 How to Update Versions

### Method 1: Automatic Versioning (Recommended)

Using **standard-version** based on conventional commits:

```bash
# Automatic version bump based on commits
pnpm release

# Specific version bumps
pnpm release:patch    # 1.0.0 → 1.0.1
pnpm release:minor    # 1.0.0 → 1.1.0
pnpm release:major    # 1.0.0 → 2.0.0

# Pre-release versions
pnpm release:pre      # 1.0.0 → 1.0.1-0
```

**What happens:**
1. ✅ Bumps version in all package.json files
2. ✅ Generates/updates CHANGELOG.md
3. ✅ Creates a git commit
4. ✅ Creates a git tag
5. ✅ Updates version in health endpoint response

### Method 2: Manual Version Update

```bash
# Update to specific version across all services
node scripts/update-version.js 1.2.3

# Then commit and tag manually
git add .
git commit -m "chore(release): v1.2.3 🚀"
git tag v1.2.3
```

---

## 📝 Conventional Commit Format

For automatic version detection, use conventional commits:

```bash
# Feature (bumps MINOR version)
git commit -m "feat: add real-time driver tracking"
git commit -m "feat(booking): implement surge pricing"

# Bug Fix (bumps PATCH version)
git commit -m "fix: resolve payment processing error"
git commit -m "fix(telematics): correct GPS coordinate calculation"

# Breaking Change (bumps MAJOR version)
git commit -m "feat!: redesign booking API"
# or
git commit -m "feat: new auth system

BREAKING CHANGE: API endpoints now require v2 prefix"

# Other types (no version bump)
git commit -m "docs: update API documentation"
git commit -m "refactor: optimize database queries"
git commit -m "test: add unit tests for vehicle service"
git commit -m "ci: update GitHub Actions workflow"
```

### Commit Types

| Type | Description | Version Impact |
|------|-------------|----------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `feat!` / `BREAKING CHANGE` | Breaking change | MAJOR |
| `docs` | Documentation | None |
| `style` | Code style | None |
| `refactor` | Code refactoring | None |
| `perf` | Performance improvement | PATCH |
| `test` | Tests | None |
| `build` | Build system | None |
| `ci` | CI/CD | None |
| `chore` | Maintenance | None |

---

## 🔄 Typical Release Workflow

### 1. Development Phase
```bash
# Make changes with conventional commits
git commit -m "feat(fleet): add vehicle maintenance scheduling"
git commit -m "fix(charging): resolve session timeout issue"
git commit -m "refactor(booking): improve error handling"
```

### 2. Ready to Release
```bash
# Option A: Automatic version based on commits
pnpm release

# Option B: Force specific version type
pnpm release:minor   # If you want to ensure minor bump

# Option C: Manual version
node scripts/update-version.js 1.5.0
git add .
git commit -m "chore(release): v1.5.0 🚀"
git tag v1.5.0
```

### 3. Push to Repository
```bash
# Push commits and tags
git push origin main
git push origin --tags
```

### 4. Deploy
```bash
# Deploy with new version
docker compose up -d --build

# Verify version
curl http://localhost:3000/api/v1/health | jq .version
```

---

## 📊 Version Tracking

### Check Current Versions

```bash
# NestJS Backend
curl http://localhost:3000/api/v1/health | jq .version

# Spring Boot Backend  
curl http://localhost:8081/actuator/info | jq .version

# Check all package.json files
grep -r "\"version\":" package.json */package.json
```

### View Changelog

```bash
cat CHANGELOG.md
```

---

## 🏷️ Pre-release Versions

For beta/alpha releases:

```bash
# Create pre-release
pnpm release:pre             # 1.0.0 → 1.0.1-0

# Named pre-releases
pnpm release:pre -- --prerelease alpha   # 1.0.0 → 1.0.1-alpha.0
pnpm release:pre -- --prerelease beta    # 1.0.0 → 1.0.1-beta.0
pnpm release:pre -- --prerelease rc      # 1.0.0 → 1.0.1-rc.0
```

---

## 🔧 Integration with CI/CD

Add to `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Create Release
        run: pnpm release
      
      - name: Push changes
        run: |
          git push --follow-tags origin main
```

---

## 📌 Best Practices

1. ✅ **Always use conventional commits** for automatic versioning
2. ✅ **Run tests before releasing**: `pnpm test`
3. ✅ **Review CHANGELOG.md** after version bump
4. ✅ **Tag releases** for easy rollback
5. ✅ **Update documentation** when bumping major versions
6. ✅ **Notify team** of breaking changes
7. ✅ **Deploy to staging** before production

---

## 🆘 Troubleshooting

### Rollback a Release

```bash
# Remove the tag
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3

# Reset to previous commit
git reset --hard HEAD~1

# Force push (careful!)
git push origin main --force
```

### Fix Version Mismatch

```bash
# Sync all package.json to same version
node scripts/update-version.js 1.0.0
```

---

## 📚 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Standard Version](https://github.com/conventional-changelog/standard-version)
- [Commitlint](https://commitlint.js.org/)
