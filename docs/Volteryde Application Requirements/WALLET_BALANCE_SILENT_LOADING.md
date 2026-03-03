# Wallet Balance: Silent Loading & Network Fix

## Problem

The Client App was experiencing network errors when fetching the user's wallet balance. The root cause was a **path mismatch** between the client API endpoints and the NestJS backend routes:

| Client Called | NestJS Expected | Result |
|---|---|---|
| `/wallet/balance` | `/api/v1/payment/wallet` | 404 |
| `/wallet/transactions` | *(endpoint didn't exist)* | 404 |
| `/wallet/topup` | `/api/v1/payment/topup` | 404 |

Additionally, the wallet balance showed a visible loading spinner on every fetch, creating a poor UX.

## Solution

### 1. Fixed API Endpoint Routing (Root Cause)

**Client** (`src/config/api.config.ts`):
```typescript
WALLET: {
  BALANCE: '/api/v1/payment/wallet',
  TRANSACTIONS: '/api/v1/payment/transactions',
  TOPUP: '/api/v1/payment/topup',
}
```

These now match the NestJS `PaymentController` routes at `@Controller('api/v1/payment')`.

### 2. Backend: Standardized Balance Response Format

**NestJS PaymentController** (`payment.controller.ts`):
- `GET /api/v1/payment/wallet` — returns standardized format:
  ```json
  {
    "customerId": "user-123",
    "realBalance": 100.50,
    "promoBalance": 0,
    "totalBalance": 100.50,
    "currency": "GHS"
  }
  ```
- `GET /api/v1/payment/transactions` — new endpoint returning transaction history
- Added `X-User-Id` header fallback for user identification

**NestJS PaymentService** (`payment.service.ts`):
- Added `getTransactionHistory(userId, limit)` method

### 3. Frontend: Silent Loading with Local Caching

**Architecture:**
```
App Open → Load Cached Balance (instant) → Display → Fetch Fresh Balance (background) → Update UI Silently
```

**Components:**

- **`walletApi.ts`** — Added:
  - `getCachedBalance()` — reads last known balance from SecureStore
  - `clearBalanceCache()` — clears on logout
  - `fetchWithTimeout()` — 8s timeout to prevent hanging requests
  - Automatic caching of successful balance responses

- **`walletSlice.ts`** — Added:
  - `hydrateCachedBalance` thunk — loads cached balance instantly (no network)
  - `hydrated` state flag — tracks whether cached data has been loaded
  - **Silent loading**: `loading` flag only set when no cached data exists
  - **Silent errors**: network errors suppressed when cached data is available

- **`wallet.tsx` / `myaccount.tsx`** — Added:
  - `dispatch(hydrateCachedBalance())` on mount (instant, before network)
  - `dispatch(fetchWalletBalance(userId))` for background refresh
  - Cache cleared on logout

### 4. Data Flow

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   SecureStore    │────▶│  walletSlice  │────▶│    UI Screen     │
│ (cached balance) │     │  (hydrated)   │     │ (instant display)│
└─────────────────┘     └──────────────┘     └─────────────────┘
                              ▲
                              │ (silent update)
                        ┌─────┴──────┐
                        │  walletApi  │
                        │ (fetch +   │
                        │  cache)    │
                        └────────────┘
                              ▲
                              │
                        ┌─────┴──────┐
                        │  NestJS    │
                        │ /payment/  │
                        │  wallet    │
                        └────────────┘
```

## Files Changed

### Backend (volteryde-platform)
- `services/volteryde-nest/volteryde-api/src/payment/payment.controller.ts` — Updated wallet endpoint response format, added transactions endpoint, added X-User-Id fallback
- `services/volteryde-nest/volteryde-api/src/payment/payment.service.ts` — Added `getTransactionHistory()` method
- `services/volteryde-nest/volteryde-api/src/payment/__tests__/payment.controller.spec.ts` — Unit tests

### Frontend (Client-App)
- `src/config/api.config.ts` — Fixed WALLET endpoint paths
- `src/services/walletApi.ts` — Added local caching, timeout, getCachedBalance/clearBalanceCache
- `src/store/walletSlice.ts` — Added hydrateCachedBalance thunk, silent loading logic
- `src/app/screen/wallet.tsx` — Hydrate cached balance on mount
- `src/app/screen/(tabs)/myaccount.tsx` — Hydrate cached balance on mount, clear cache on logout

## Testing

Run NestJS tests:
```bash
cd services/volteryde-nest
pnpm test -- --testPathPattern=payment
```

## Architecture Note

Two wallet implementations exist:
- **NestJS** (`Wallet` entity) — Simple balance, used by Client App
- **Spring Boot** (`WalletBalanceEntity`) — Dual balance (real/promo) with cryptographic signatures

The Client App talks directly to NestJS (port 3010). The Spring Boot payment-service is accessed via the API Gateway for internal/admin operations. The NestJS wallet response is mapped to the standardized format (`realBalance`, `promoBalance`, `totalBalance`) for future compatibility.
