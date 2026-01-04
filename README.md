# Volteryde Platform - Monorepo

Production-grade electric mobility platform designed for high reliability and financial integrity.

## 🏗️ Architecture

The platform follows a hybrid microservices architecture, leveraging **Java Spring Boot** for security-critical financial operations and **NestJS** with **Temporal** for reliable operational workflows.

### 🔐 Financial Core (Spring Boot)
Located in `services/volteryde-springboot/`, these services manage identity and money.

*   **Payment Service**: Implements a **Dual-Ledger Wallet System** with cryptographic integrity.
    *   **Real Balance**: Reflects actual cash deposits (e.g., Paystack).
    *   **Promo Balance**: Reflects system credits/compensations.
    *   **Security**: All transactions are signed with HMAC-SHA256 to prevent database tampering.
*   **Auth Service**: Centralized authentication.
*   **User Management**: Customer profile management.

### ⚡ Operational Core (NestJS + Temporal)
Located in `services/volteryde-nest/` and `workers/temporal-workers/`. These services manage the physical world (Rides, Charging, Fleet) using the "Code Never Fails" pattern.

*   **Workflow-First Design**: Critical operations (Booking, Charging) are orchestrated by **Temporal Workflows**, ensuring resilience against failures.
*   **Services**:
    *   `booking`: Manages ride requests, performs pre-booking balance checks (gated by 10 GHS threshold).
    *   `charging`: Manages EV charging sessions via reliable workflows.
    *   `fleet`: Vehicle and driver management.
    *   `telematics`: Real-time tracking and IoT data.
    *   `notifications`: Centralized notification dispatch.

### 💻 Frontend Applications
Located in `apps/`. Modern web applications built with **React Router 7**, **Vite**, and **Tailwind CSS**.

*   `customer-and-support-app`: Main portal for customers to book rides and support agents to manage tickets.
*   `admin-dashboard`: Super admin platform management.
*   `dispatcher-app`: Dispatching interface for fleet operations.
*   `auth-frontend`: Unified login/signup interface.
*   `bi-partner-app`: Business Intelligence dashboard for partners.
*   `landing-page`: Public facing marketing site.
*   `docs-platform`: Documentation portal.

### 🛠️ Shared Libraries
Located in `packages/`.
*   `shared-types`: Common TypeScript definitions (Enums, Interfaces).
*   `auth-sdk`: Authentication utilities.
*   `core`: Core logic shared across apps.
*   `config`: Shared configuration.

---

## 🚀 Key Features Implemented

### 1. Dual-Ledger Wallet System
To ensure financial integrity, we do not simply "hold" money; we mirror verified transactions.
*   **Real Balance**: Immutable ledger of liquid cash (Paystack).
*   **Total Balance**: Real + Promo funds.
*   **Security Protocol**: Every transaction is validated and cryptographically signed. If a DB row is tampered with, the signature validation fails, freezing the account.

### 2. Reliable Workflows (Temporal)
*   **Booking Saga**: Handles the entire booking lifecycle including seat reservation, atomic wallet deduction, and driver assignment.
    *   **Smart Cancellation**: Implements a **Time-Decay Penalty** logic (0% -> 10% -> 20% penalty based on elapsed time) via Temporal Signals.
*   **Charging Orchestration**: Manages charging sessions statefully, ensuring sessions are correctly started and stopped even in the event of service restarts.

### 3. Pre-Booking Thresholds
*   Users must meet a minimum liquidity threshold (10 GHS) before initiating a booking workflow, reducing system noise from unfunded requests.

---

## 🛠️ Quick Start

### Prerequisites
*   Node.js >= 20.0.0
*   pnpm >= 8.0.0
*   Java 17+ (for Spring Boot services)
*   Docker >= 24.0 (for Temporal, Postgres, Redis)

### Installation

```bash
# Install dependencies for all Node.js projects
pnpm install
```

### Running Locally

**1. Start Infrastructure (Databases, Temporal)**
```bash
docker-compose up -d
```

**2. Start Temporal Worker**
The worker drives the Booking and Charging workflows.
```bash
pnpm --filter @volteryde/temporal-workers dev
```

**3. Start Backend Services**
*   **Spring Boot (Payment/Auth)**:
    ```bash
    cd services/volteryde-springboot
    ./mvnw spring-boot:run -pl payment-service
    ```
*   **NestJS (Booking/Charging/etc)**:
    ```bash
    pnpm --filter @volteryde/nest start:dev
    ```

**4. Start Frontend**
```bash
pnpm --filter @volteryde/customer-and-support-app dev
```

## 🧪 Testing

```bash
# Run tests for a specific workspace
pnpm --filter @volteryde/nest test
pnpm --filter @volteryde/temporal-workers test
```

## 📁 Project Structure

```
volteryde-platform/
├── apps/                        # Frontend Applications
│   ├── customer-and-support-app/ # React Router 7 App
│   ├── admin-dashboard/
│   └── ...
├── services/                    # Backend Services
│   ├── volteryde-springboot/    # Java: Payment, Auth (Security Core)
│   └── volteryde-nest/          # Node: Booking, Charging (Operational Core)
├── workers/
│   └── temporal-workers/        # Temporal Workflows & Activities
├── packages/                    # Shared Libraries
├── infrastructure/              # Terraform & K8s
└── README.md
```

## 🤝 Contributing

1.  Create a feature branch.
2.  Ensure `pnpm build` passes for affected packages.
3.  Submit a Pull Request.

---
**Built with ❤️ by the Volteryde Team**
