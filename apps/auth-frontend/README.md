# Volteryde Auth Frontend

Centralized authentication UI for the Volteryde platform.

## Overview

This is the single sign-on (SSO) frontend that handles:
- User login
- User registration
- Password reset
- Email verification

All internal platform apps redirect here for authentication.

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

The app runs on port 3007 by default.

## Environment Variables

- `AUTH_API_URL`: URL of the auth service API (default: `http://localhost:8081`)

## SSO Flow

1. User visits protected app (e.g., `admin.volteryde.org`)
2. App redirects to `auth.volteryde.org/login?app=admin&redirect=...`
3. User authenticates
4. Auth frontend redirects back with auth code
5. App exchanges code for tokens

## Pages

- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation (with token)
- `/verify-email` - Email verification (with token)
