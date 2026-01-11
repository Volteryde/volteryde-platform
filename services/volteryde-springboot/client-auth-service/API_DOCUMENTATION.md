# Client Authentication Service API Documentation

## Overview

The Client Authentication Service handles authentication for mobile/external clients (Riders) in the Volteryde platform. It is completely separate from internal authentication (for drivers, admins, dispatchers) which is handled by `auth-service`.

**Base URL:** `http://localhost:8082/client/auth`

---

## Authentication Flow

### Primary Flow: Phone/OTP Authentication

```
1. Phone Entry → 2. OTP Send → 3. OTP Verify → 
   ├─ Existing User → Return tokens & redirect to app
   └─ New User → 4. Profile Setup → 5. Terms Acceptance → 6. Complete → Return tokens
```

### Alternative Flow: Google OAuth

```
1. Google Sign-In (client-side) → 2. Send tokens to backend →
   ├─ Existing User → Return tokens & redirect to app
   └─ New User → Require terms acceptance → Return tokens
```

---

## API Endpoints

### OTP Authentication

#### Send OTP
Initiates OTP authentication by sending a verification code to the phone number.

```http
POST /client/auth/otp/send
Content-Type: application/json
```

**Request:**
```json
{
  "phone": "+233244567890"
}
```

**Response:** `200 OK` (empty body)

**Errors:**
- `429 Too Many Requests` - Rate limit exceeded

---

#### Verify OTP
Verifies the OTP code. Returns different responses for new vs existing users.

```http
POST /client/auth/otp/verify
Content-Type: application/json
```

**Request:**
```json
{
  "phone": "+233244567890",
  "code": "123456"
}
```

**Response (Existing User):** Returns full auth response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "550e8400-e29b-41d4...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "phone": "+233244567890",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "RIDER",
    "status": "ACTIVE",
    "phoneVerified": true,
    "emailVerified": false,
    "termsAccepted": true
  }
}
```

**Response (New User):** Returns signup token for profile completion
```json
{
  "verified": true,
  "isNewUser": true,
  "signupToken": "eyJhbGciOiJIUzI1..."
}
```

---

#### Complete Profile (New Users)
Completes registration for new users after OTP verification. **Terms acceptance is REQUIRED.**

```http
POST /client/auth/signup/complete
Content-Type: application/json
```

**Request:**
```json
{
  "signupToken": "eyJhbGciOiJIUzI1...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "termsAccepted": true,
  "privacyAccepted": true
}
```

**Response:** `200 OK` with full auth response (see above)

**Errors:**
- `400 Bad Request` - Invalid signup token or validation errors
- `403 Forbidden` - Terms not accepted

---

### Email/Password Authentication

#### Register
Creates a new account with email and password.

```http
POST /client/auth/register
Content-Type: application/json
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+233244567890"
}
```

**Response:** `200 OK` with full auth response

---

#### Login
Authenticates with email and password.

```http
POST /client/auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response:** `200 OK` with full auth response

---

### Password Recovery

#### Forgot Password
Initiates password reset via phone OTP or email.

```http
POST /client/auth/password/forgot
Content-Type: application/json
```

**Request (Phone):**
```json
{
  "phone": "+233244567890"
}
```

**Request (Email):**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK` (empty body)

---

#### Verify Password Reset OTP

```http
POST /client/auth/password/verify-otp
Content-Type: application/json
```

**Request:**
```json
{
  "phone": "+233244567890",
  "otp": "123456"
}
```

**Response:**
```json
{
  "resetToken": "550e8400-e29b-41d4..."
}
```

---

#### Reset Password

```http
POST /client/auth/password/reset
Content-Type: application/json
```

**Request:**
```json
{
  "resetToken": "550e8400-e29b-41d4...",
  "newPassword": "NewSecureP@ss456"
}
```

**Response:** `200 OK` (empty body)

---

#### Change Password (Authenticated)

```http
POST /client/auth/password/change
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewP@ss456"
}
```

**Response:** `200 OK` (empty body)

---

### Token Management

#### Refresh Token

```http
POST /client/auth/refresh
Content-Type: application/json
```

**Request:**
```json
{
  "refreshToken": "550e8400-e29b-41d4..."
}
```

**Response:** `200 OK` with new auth response

---

#### Validate Token

```http
POST /client/auth/validate
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "valid": true,
  "userId": "uuid",
  "phone": "+233244567890",
  "role": "RIDER",
  "type": "CLIENT"
}
```

---

#### Logout

```http
POST /client/auth/logout
Content-Type: application/json
```

**Request:**
```json
{
  "refreshToken": "550e8400-e29b-41d4..."
}
```

**Response:** `200 OK` (empty body)

---

#### Logout All Devices

```http
POST /client/auth/logout-all
Authorization: Bearer <access_token>
```

**Response:** `200 OK` (empty body)

---

### Profile Management

#### Get Current User

```http
GET /client/auth/me
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "phone": "+233244567890",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "RIDER",
  "status": "ACTIVE",
  "profileImageUrl": "https://...",
  "phoneVerified": true,
  "emailVerified": false,
  "termsAccepted": true
}
```

---

#### Update Profile

```http
PUT /client/auth/me
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "newemail@example.com",
  "profileImageUrl": "https://..."
}
```

**Response:** `200 OK` with updated user object

---

### Social Login

#### Google OAuth

```http
POST /client/auth/social/google
Content-Type: application/json
```

**Request (Existing User):**
```json
{
  "googleId": "google-user-id",
  "idToken": "google-id-token",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Request (New User - requires terms acceptance):**
```json
{
  "googleId": "google-user-id",
  "idToken": "google-id-token",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "termsAccepted": true,
  "privacyAccepted": true
}
```

**Response:** `200 OK` with full auth response

---

## Error Responses

All errors follow this format:

```json
{
  "status": 400,
  "errorCode": "ERROR_CODE",
  "message": "Human readable message",
  "timestamp": "2026-01-10T10:30:00"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_OTP` | 400 | OTP is invalid or expired |
| `INVALID_CREDENTIALS` | 401 | Email/password incorrect |
| `INVALID_TOKEN` | 401 | Token is invalid or expired |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `USER_ALREADY_EXISTS` | 409 | Phone/email already registered |
| `ACCOUNT_NOT_ACTIVE` | 403 | Account is suspended/inactive |
| `TERMS_NOT_ACCEPTED` | 403 | Terms acceptance required |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Request validation failed |

---

## Security

### JWT Token Claims

Access tokens include:
- `sub`: User ID
- `type`: "CLIENT"
- `phone`: User's phone number
- `role`: "RIDER"
- `email`: User's email (if set)
- `iss`: "client-auth.volteryde.org"
- `exp`: Expiration timestamp

### Rate Limiting

- OTP Send: 3 requests per 5 minutes per phone number
- Password Reset: 3 requests per 5 minutes per identifier

### Token Expiration

- Access Token: 1 hour
- Refresh Token: 7 days
- OTP: 5 minutes
- Signup Token: 30 minutes
- Password Reset Token: 30 minutes

---

## Integration Notes

### For Client-App

1. Store tokens securely using Expo SecureStore
2. Include `User-Agent` header for device tracking
3. Handle token refresh automatically on 401 responses
4. For new users via OTP: complete profile AFTER terms screen
5. For Google OAuth: include terms acceptance in the request for new users

### For Other Microservices

Use the `/client/auth/validate` endpoint to validate client tokens:

```http
POST /client/auth/validate
Authorization: Bearer <client_access_token>
```

Returns user details if valid, which can be used for authorization decisions.
