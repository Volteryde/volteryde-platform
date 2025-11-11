## Description
<!-- Provide a clear and concise description of your changes -->

## Type of Change
<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔨 Build/CI update
- [ ] 🏗️ Infrastructure change

## Related Issues
<!-- Link related issues using # -->

Closes #
Related to #

## Changes Made
<!-- List the main changes you made -->

- 
- 
- 

## Testing Checklist
<!-- Confirm that all requirements are met -->

### ✅ Unit Tests (REQUIRED)
- [ ] Tests written and passing (`pnpm test` or `./mvnw test`)
- [ ] Test coverage for all new code paths
- [ ] Both success and error cases covered

### ✅ UI Components (REQUIRED - if applicable)
- [ ] UI components implemented in relevant apps
- [ ] Form validation schemas using Zod/Yup added
- [ ] Following existing UI patterns

### ✅ Documentation (REQUIRED)
- [ ] Documentation added or updated in `/docs/`
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Code examples included (if needed)

### General Testing
- [ ] Tested locally in development environment
- [ ] Tested with Docker Compose (if applicable)
- [ ] Integration tests passing (if applicable)
- [ ] No breaking changes (or documented if yes)

## Code Quality
- [ ] Code follows existing patterns and conventions
- [ ] ESLint/Prettier checks passing (`pnpm lint`)
- [ ] TypeScript compilation successful (if applicable)
- [ ] Maven build successful (if applicable)
- [ ] No console.log or debug statements left in code

## Environment Variables
- [ ] New environment variables documented in `.env.example`
- [ ] Environment variables added to deployment configs

## Database Changes
- [ ] Database migrations created (if applicable)
- [ ] Migrations tested locally
- [ ] Rollback script prepared (if applicable)

## Security
- [ ] No sensitive data (passwords, API keys) in code
- [ ] Security scan passed
- [ ] Input validation implemented
- [ ] Authentication/Authorization handled correctly

## Performance
- [ ] No N+1 queries introduced
- [ ] Proper indexing considered (if database changes)
- [ ] Large data sets handled efficiently
- [ ] Caching strategy implemented (if needed)

## Screenshots/Videos
<!-- If UI changes, add screenshots or videos -->

### Before
<!-- Screenshot of the current state -->

### After
<!-- Screenshot of the new state -->

## Deployment Notes
<!-- Any special deployment instructions or considerations -->

- [ ] Requires infrastructure changes
- [ ] Requires manual steps after deployment
- [ ] Requires feature flag
- [ ] Backward compatible

## Rollback Plan
<!-- How to rollback if something goes wrong -->


## Additional Context
<!-- Add any other context about the PR here -->


---

## Reviewer Guidelines

### For Reviewers:
- [ ] Code logic is sound and follows best practices
- [ ] Tests adequately cover the changes
- [ ] Documentation is clear and accurate
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] UI/UX changes are consistent with design system

### Review Priority
- [ ] 🔴 High - Blocker/Critical bug
- [ ] 🟡 Medium - Important feature/improvement
- [ ] 🟢 Low - Minor improvement/documentation

---

**By submitting this PR, I confirm that:**
- I have followed the project's contribution guidelines
- I have performed a self-review of my own code
- I have commented my code where necessary
- I have made corresponding changes to the documentation
- My changes generate no new warnings
- I have added tests that prove my fix is effective or my feature works
