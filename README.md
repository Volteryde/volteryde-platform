# Volteryde Platform - Monorepo

Production-grade electric mobility platform designed for high reliability and financial integrity.

## 🏗️ Architecture



The platform follows a hybrid microservices architecture, leveraging **Java Spring Boot** for security-critical financial operations and **NestJS** with **Temporal** for reliable operational workflows.

### 🔐 Financial Core (Spring Boot)
Located in `services/volteryde-springboot/`, these services manage identity and money.


*   **Payment Service**: Implements a **Dual-Ledger Wallet System** with cryptographic integrity.
    *   **Real Balance**: Reflects actual cash deposits (e.g., Paystack).
    *   **Promo Balance**: Reflects system credits/compensations.
    *   **Security Protocol (Validator & Signer)**:
        *   Every transaction is validated and cryptographically signed using **HMAC-SHA256**.
        *   Transactions are signed with `(customerId, amount, type, referenceId)`.
        *   Balance states are signed with `(customerId, realBalance, promoBalance)`.
        *   Any manual tampering with the database breaks the signature chain, causing the system to freeze the account (`SecurityException`).
*   **Auth Service**: Centralized authentication.
*   **User Management**: Customer profile management.

### ⚡ Operational Core (NestJS + Temporal)
Located in `services/volteryde-nest/` and `workers/temporal-workers/`. These services manage the physical world (Rides, Charging, Fleet) using the "Code Never Fails" pattern.

*   **Workflow-First Design**: Critical operations are orchestrated by **Temporal Workflows**, ensuring resilience against failures.
*   **Services**:
    *   `booking`: Manages ride requests. Includes a **Pre-Booking Gated Check** that verifies the user has at least 10 GHS liquidity by querying the Payment Service directly.
    *   `charging`: Manages EV charging sessions via reliable workflows (`chargeVehicleWorkflow`).
    *   `fleet`: Vehicle and driver management.
    *   `telematics`: Real-time tracking and IoT data.
    *   `notifications`: Centralized notification dispatch.

### 🔄 Internal Communication
*   **Temporal Activities**: The Temporal Worker (Node.js) executes business logic by making HTTP calls back to internal endpoints on the NestJS and Spring Boot services.
*   **Security**: These internal calls are secured via `X-Internal-Service-Key`.
*   **Endpoints**:
    *   NestJS exposes `/internal/*` endpoints for workflow triggers.
    *   Spring Boot exposes `/api/v1/wallet/deduct`, `/credit`, and `/refund` specifically for Temporal Activities.

### 💻 Frontend Applications
Located in `apps/`. Modern web applications built with **React Router 7**, **Vite**, and **Tailwind CSS**.

*   `customer-and-support-app`: Main portal for customers to book rides and support agents to manage tickets. (Port: 4004)
*   `admin-dashboard`: Super admin platform management. (Port: 4002)
*   `dispatcher-app`: Dispatching interface for fleet operations. (Port: 4005)
*   `auth-frontend`: Unified login/signup interface. (Port: 4001)
*   `bi-partner-app`: Business Intelligence dashboard for partners. (Port: 4003)
*   `landing-page`: Public facing marketing site. (Port: 4000)


### 🛠️ Shared Libraries
Located in `packages/`.
*   `shared-types`: Common TypeScript definitions (Enums, Interfaces).
*   `auth-sdk`: Authentication utilities.
*   `core`: Core logic shared across apps.
*   `config`: Shared configuration.

---

### 🔐 Default Credentials (Development)
*   **System Admin**:
    *   Email: `test@volteryde.com`
    *   Password: `P@s$1234`
    *   Access ID: `VR-A001`

## 🚀 Key Features Implemented

### 1. Dual-Ledger Wallet System
To ensure financial integrity, we do not simply "hold" money; we mirror verified transactions.
*   **Real Balance**: Immutable ledger of liquid cash (Paystack).
*   **Total Balance**: Real + Promo funds.
*   **Security Protocol**: Every transaction is validated and cryptographically signed. If a DB row is tampered with, the signature validation fails, freezing the account.

### 2. Reliable Workflows (Temporal)
*   **Booking Saga (`volteryde-booking` queue)**: Handles the entire booking lifecycle including seat reservation, atomic wallet deduction, and driver assignment.
    *   **Smart Cancellation**: Implements a **Time-Decay Penalty** logic (0% -> 10% -> 20% penalty based on elapsed time) via Temporal Signals (`cancelRideSignal`).
*   **Charging Orchestration (`volteryde-charging` queue)**: Manages charging sessions statefully, ensuring sessions are correctly started and stopped even in the event of service restarts.

### 3. Pre-Booking Thresholds
*   Users must meet a minimum liquidity threshold (10 GHS) before initiating a booking workflow, reducing system noise from unfunded requests.

---

## 🛠️ Quick Start

### Share local services with teammates (nginx + ngrok)

Follow these exact steps to expose your local API and Auth services for teammates to call:

1) Create the nginx proxy config

    - Create `Client-App/nginx/default.conf` (or update `deploy/nginx/conf.d/default.conf`) with proxy rules that forward `/api/` and `/auth/` to your local services. Use `host.docker.internal` as the upstream host so the container reaches services on your Mac.

2) Run nginx in Docker (bind host port 80)

```bash
# run nginx container with the mounted config
docker run -d \
    --name volteryde-nginx \
    -p 80:80 \
    -v "$PWD/Client-App/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro" \
    nginx:stable
```

3) Start ngrok and get the public HTTPS URL

```bash
# open a tunnel to port 80 (interactive)
ngrok http 80

# OR run ngrok in background and log its output
ngrok http 80 --log=stdout &>/tmp/ngrok.log &

# get the public URL programmatically
curl --silent http://127.0.0.1:4040/api/tunnels | jq .
```

4) Update the client `.env` to use the ngrok URL

```bash
# replace placeholders with the actual ngrok domain you received
EXPO_PUBLIC_API_URL=https://<your-ngrok-domain>.ngrok-free.app/api
EXPO_PUBLIC_CLIENT_AUTH_URL=https://<your-ngrok-domain>.ngrok-free.app/auth
```

5) Verify the endpoints from another machine

```bash
curl -v "https://<your-ngrok-domain>.ngrok-free.app/api/health"
curl -v "https://<your-ngrok-domain>.ngrok-free.app/auth/health"
```

6) Stop and clean up when finished

```bash
# stop ngrok (if backgrounded)
pkill -f "ngrok http 80" || true

# remove nginx container
docker rm -f volteryde-nginx || true
```

Quick notes:

- Use `host.docker.internal` inside the nginx config so the nginx container can reach services running on your macOS host.
- Ngrok public URLs are temporary unless you reserve a domain via an ngrok paid plan.
- Do not share ngrok URLs publicly; only share them with trusted teammates during testing.

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
**Built by the Volteryde Team**
