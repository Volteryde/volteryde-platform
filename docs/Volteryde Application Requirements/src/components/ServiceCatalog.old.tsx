import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Cloud, Plug, Shield, Bell, CreditCard, MapPin, Car, MessageSquare, BarChart, Settings } from 'lucide-react';

const serviceCatalog = [
  // ============================================================
  // BACKEND SERVICE: VOLTERYDE-SPRINGBOOT (Java)
  // ============================================================
  {
    category: "☕ volteryde-springboot (Java/Spring Boot)",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Security-critical services built with Java Spring Boot: Authentication & Authorization, Payment Processing & Wallet Management.",
    database: "PostgreSQL (users, payments) + Redis (sessions, cache)",
    modules: [
      {
        name: "Authentication Module",
        description: "Complete authentication and authorization system with JWT, OAuth2, RBAC, and MFA support.",
        endpoints: [
          "POST /auth/register - User registration",
          "POST /auth/login - User login with JWT",
          "POST /auth/logout - User logout",
          "POST /auth/refresh - Refresh JWT token",
          "GET /oauth/authorize - OAuth2 authorization",
          "POST /oauth/token - OAuth2 token exchange",
          "POST /auth/mfa/enable - Enable MFA",
          "POST /auth/mfa/verify - Verify MFA code",
          "POST /auth/password/reset - Reset password",
          "GET /users/profile - Get user profile",
          "PUT /users/profile - Update user profile",
          "GET /users/sessions - List active sessions",
          "DELETE /users/sessions/{id} - Force logout session"
        ],
        tech: ["Spring Security", "JWT", "OAuth2", "bcrypt", "Redis", "PostgreSQL", "Twilio (SMS)", "Spring JPA"],
        responsibility: "Manage all user authentication, authorization, sessions, and profiles for passengers, drivers, fleet managers, and admins."
      },
      {
        name: "Payment Module", 
        description: "Secure payment processing with Paystack integration, wallet management, refunds, and transaction history.",
        endpoints: [
          "POST /payments/initialize - Initialize payment",
          "POST /payments/verify - Verify payment",
          "POST /payments/webhooks/paystack - Paystack webhook",
          "GET /payments/transactions - List transactions",
          "GET /payments/transactions/{id} - Get transaction details",
          "POST /payments/refund - Process refund",
          "GET /wallet/balance - Get wallet balance",
          "POST /wallet/topup - Top up wallet",
          "POST /wallet/withdraw - Withdraw from wallet",
          "GET /wallet/transactions - Wallet transaction history",
          "POST /payments/methods - Add payment method",
          "GET /payments/methods - List payment methods",
          "DELETE /payments/methods/{id} - Remove payment method"
        ],
        tech: ["Spring Boot", "Paystack SDK", "PostgreSQL", "Redis", "Stripe (fallback)", "Transaction management", "Webhook handlers"],
        responsibility: "Handle all payment processing, wallet management, refunds, disputes, and financial transactions."
      }
    ]
  },
  
  // ============================================================
  // BACKEND SERVICE: VOLTERYDE-NEST (NestJS)
  // ============================================================
  {
    category: "🟢 volteryde-nest (NestJS/TypeScript)",
    icon: Car,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Business logic services built with NestJS: Telematics, Booking, Fleet Operations, and Charging Infrastructure.",
    database: "PostgreSQL + InfluxDB (telemetry) + Redis (cache) + PostGIS (geospatial)",
    modules: [
      {
        name: "Telematics Module",
        description: "Real-time vehicle data ingestion, GPS tracking, battery monitoring, and diagnostics. Single source of truth for all vehicle state.",
        endpoints: [
          "GET /vehicles/{id}/location - Get current location",
          "WS /vehicles/{id}/stream - Real-time telemetry stream",
          "GET /vehicles/{id}/battery - Battery status",
          "GET /vehicles/{id}/diagnostics - Vehicle diagnostics",
          "GET /vehicles/{id}/history - Historical telemetry",
          "POST /vehicles/{id}/telemetry - Ingest telemetry data",
          "GET /vehicles - List all vehicles",
          "GET /vehicles/{id} - Get vehicle details"
        ],
        tech: ["NestJS", "TypeORM", "InfluxDB", "MQTT", "WebSocket", "Redis", "Kafka", "PostGIS"],
        responsibility: "Track vehicle location, monitor battery state, collect diagnostics, and publish telemetry events."
      },
      {
        name: "Booking Module",
        description: "Bus discovery, seat selection, booking management, and ride tracking with segment-based seat allocation.",
        endpoints: [
          "GET /buses/search - Search available buses",
          "GET /buses/{id}/route - Get bus route details",
          "GET /buses/{id}/seats - Get seat availability",
          "POST /bookings - Create booking",
          "GET /bookings/{id} - Get booking details",
          "PUT /bookings/{id}/cancel - Cancel booking",
          "GET /bookings/user/{userId} - User booking history",
          "GET /bookings/active - Active bookings",
          "POST /bookings/{id}/checkin - Check in passenger",
          "GET /rides/active - Active rides",
          "GET /rides/{id}/passengers - Ride passengers manifest"
        ],
        tech: ["NestJS", "TypeORM", "PostgreSQL", "Redis", "PostGIS", "Kafka events", "Socket.io"],
        responsibility: "Handle bus discovery, seat reservations, booking lifecycle, and real-time ride tracking."
      },
      {
        name: "Fleet Operations Module",
        description: "Vehicle management, maintenance scheduling, fleet analytics, and operational insights based on telemetry data.",
        endpoints: [
          "GET /fleet/vehicles - List fleet vehicles",
          "GET /fleet/vehicles/{id} - Vehicle details",
          "PUT /fleet/vehicles/{id} - Update vehicle info",
          "POST /fleet/vehicles/{id}/maintenance - Schedule maintenance",
          "GET /fleet/maintenance - Maintenance schedule",
          "PUT /fleet/maintenance/{id} - Update maintenance status",
          "GET /fleet/analytics/utilization - Fleet utilization",
          "GET /fleet/analytics/efficiency - Efficiency metrics",
          "GET /fleet/reports/daily - Daily fleet report",
          "POST /fleet/vehicles/{id}/inspect - Log inspection"
        ],
        tech: ["NestJS", "TypeORM", "PostgreSQL", "Redis", "Analytics pipeline", "Cron jobs", "Event subscribers"],
        responsibility: "Manage fleet roster, schedule maintenance, track vehicle lifecycle, and generate operational analytics."
      },
      {
        name: "Charging Infrastructure Module",
        description: "Charging station management, session tracking, reservation system, and charging analytics.",
        endpoints: [
          "GET /charging/stations - List charging stations",
          "GET /charging/stations/{id} - Station details",
          "GET /charging/stations/nearby - Find nearby stations",
          "POST /charging/reservations - Reserve charging slot",
          "GET /charging/reservations/{id} - Reservation details",
          "POST /charging/sessions/start - Start charging session",
          "POST /charging/sessions/stop - Stop charging session",
          "GET /charging/sessions/active - Active sessions",
          "GET /charging/sessions/history - Charging history",
          "GET /charging/analytics - Charging analytics"
        ],
        tech: ["NestJS", "TypeORM", "PostgreSQL", "Redis", "Maps API", "Event subscribers", "Analytics"],
        responsibility: "Manage charging stations, track charging sessions, handle reservations, and analyze charging patterns."
      }
    ]
  },
  
  // ============================================================
  // BACKGROUND WORKERS: TEMPORAL-WORKERS (TypeScript)
  // ============================================================
  {
    category: "⚙️ temporal-workers (Temporal Workflows)",
    icon: Settings,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Background workflow workers for long-running, durable business processes with automatic retry and compensation logic.",
    database: "Temporal Server (workflow state) + PostgreSQL (business data)",
    modules: [
      {
        name: "Booking Workflow Worker",
        description: "Durable booking workflow with seat locking, payment processing, and automatic rollback on failure.",
        workflows: [
          "BookingWorkflow - End-to-end booking process",
          "SeatReservationWorkflow - Segment-based seat locking",
          "BookingCancellationWorkflow - Refund and seat release",
          "BookingReminderWorkflow - Send booking reminders"
        ],
        activities: [
          "reserveSeat - Lock seat for booking",
          "processPayment - Call payment service",
          "confirmBooking - Finalize booking",
          "releaseSeat - Release seat on failure",
          "sendConfirmationEmail - Send email notification",
          "processRefund - Handle refund"
        ],
        tech: ["Temporal SDK", "TypeScript", "NestJS activities", "Kafka events"],
        responsibility: "Orchestrate booking process with automatic retry, compensation, and human-in-the-loop for failures."
      },
      {
        name: "Payment Workflow Worker",
        description: "Payment processing workflows with retry logic, dispute handling, and refund orchestration.",
        workflows: [
          "PaymentProcessingWorkflow - Process payment with retry",
          "RefundWorkflow - Handle refund process",
          "DisputeResolutionWorkflow - Manage payment disputes",
          "WalletTopUpWorkflow - Process wallet top-up"
        ],
        activities: [
          "initiatePayment - Start payment",
          "verifyPayment - Verify payment status",
          "updateWallet - Update wallet balance",
          "processRefund - Execute refund",
          "sendReceipt - Send payment receipt",
          "notifyUser - Send payment notifications"
        ],
        tech: ["Temporal SDK", "TypeScript", "Payment service integration", "Webhook handling"],
        responsibility: "Ensure reliable payment processing with automatic retry and comprehensive error handling."
      },
      {
        name: "Fleet Maintenance Workflow Worker",
        description: "Maintenance scheduling and tracking workflows based on telemetry data and usage patterns.",
        workflows: [
          "MaintenanceSchedulingWorkflow - Schedule maintenance",
          "PreventiveMaintenanceWorkflow - Predictive maintenance",
          "MaintenanceTrackingWorkflow - Track maintenance progress",
          "VehicleInspectionWorkflow - Daily inspection process"
        ],
        activities: [
          "checkMaintenanceNeeded - Analyze telemetry",
          "scheduleMaintenanceSlot - Book maintenance",
          "notifyFleetManager - Send notifications",
          "updateVehicleStatus - Update vehicle state",
          "logMaintenanceRecord - Record maintenance"
        ],
        tech: ["Temporal SDK", "TypeScript", "Telemetry integration", "Analytics"],
        responsibility: "Automate maintenance scheduling based on vehicle telemetry and ensure fleet availability."
      }
    ]
  },
  
  // ============================================================
  // API GATEWAY & INFRASTRUCTURE
  // ============================================================
  {
    category: "🌐 API Gateway & Infrastructure",
    icon: Cloud,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    description: "Request routing, load balancing, rate limiting, and security enforcement.",
    database: "Redis (rate limiting, caching)",
    modules: [
      { name: "Kong API Gateway", description: "Routes requests to backend services", tech: ["Kong", "Kubernetes Ingress", "JWT validation"] },
      { name: "Rate Limiting", description: "Prevents abuse with token bucket algorithm", tech: ["Redis", "Kong plugins"] },
      { name: "Load Balancer", description: "AWS ALB for traffic distribution", tech: ["AWS ALB", "Health checks"] },
      { name: "CORS & Security", description: "Security headers and CORS policies", tech: ["Kong plugins", "Middleware"] }
    ]
  },
  
  // ============================================================
  // CORE BUSINESS DOMAINS
  // ============================================================
  {
    category: "🎯 VEHICLE & TELEMATICS DOMAIN (Single Source of Truth)",
    icon: Car,
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "Real-time vehicle data ingestion, normalization, and event publishing. Authoritative source for all vehicle state.",
    database: "InfluxDB (time-series) + Redis (current state)",
    services: [
      { name: "GPS Location Service", endpoints: ["GET /vehicles/{id}/location", "Real-time coordinates", "Route tracking", "Geofencing logic"], tech: ["MQTT", "WebSocket", "PostGIS", "Redis"], backend: "NestJS", responsibility: "Track and publish vehicle location" },
      { name: "Battery Service", endpoints: ["GET /vehicles/{id}/battery", "State of charge", "Health metrics", "Charge rate"], tech: ["IoT protocols", "InfluxDB", "Event bus"], backend: "NestJS", responsibility: "Monitor battery state and publish events" },
      { name: "Diagnostics Service", endpoints: ["GET /vehicles/{id}/diagnostics", "Error codes", "Motor status", "Performance metrics"], tech: ["OBD-II", "CAN bus", "Time-series DB"], backend: "NestJS", responsibility: "Collect and expose diagnostic data" },
      { name: "Telemetry Aggregator", endpoints: ["WS /vehicles/{id}/stream", "Ingests IoT streams", "Time-series storage", "Event publishing"], tech: ["MQTT broker", "Kafka", "InfluxDB"], backend: "NestJS", responsibility: "High-frequency data ingestion and normalization" }
    ]
  },
  {
    category: "🏗️ FLEET OPERATIONS DOMAIN (Business Logic Consumer)",
    icon: Settings,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "Consumes telemetry data to provide fleet analytics, maintenance scheduling, and operational insights.",
    database: "PostgreSQL (business data) + Redis (aggregated stats)",
    services: [
      { name: "Vehicle Management Service", endpoints: ["GET /fleet/vehicles", "Vehicle roster", "Assignments", "Status tracking"], tech: ["TypeORM", "PostgreSQL"], backend: "NestJS", responsibility: "Manage fleet roster and assignments" },
      { name: "Maintenance Service", endpoints: ["POST /fleet/vehicles/{id}/schedule-maintenance", "Service history", "Failure alerts"], tech: ["TypeORM", "Cron", "Event subscribers"], backend: "NestJS", responsibility: "Schedule and track maintenance based on telemetry" },
      { name: "Fleet Analytics Service", endpoints: ["GET /fleet/analytics/utilization", "Efficiency metrics", "Cost calculations"], tech: ["Analytics pipeline", "PostgreSQL"], backend: "NestJS", responsibility: "Generate insights from telemetry history" },
      { name: "Fleet Reporting Service", endpoints: ["GET /fleet/reports/cost-breakdown", "Daily/weekly/monthly views", "Export capabilities"], tech: ["Report generator", "PDF export"], backend: "NestJS", responsibility: "Generate operational reports" }
    ]
  },
  {
    category: "⚡ CHARGING INFRASTRUCTURE DOMAIN (Independent)",
    icon: Plug,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    description: "Manages charging stations, reservations, and sessions. Consumes battery data from Telematics.",
    database: "PostgreSQL (stations, reservations) + Redis (availability)",
    services: [
      { name: "Charging Station Service", endpoints: ["GET /charging/stations", "Station locations", "Real-time availability", "Pricing rules"], tech: ["TypeORM", "Maps API"], backend: "NestJS", responsibility: "Manage charging station inventory" },
      { name: "Reservation Service", endpoints: ["POST /charging/reservations", "Reserve slots", "Availability calendar"], tech: ["TypeORM", "Redis"], backend: "NestJS", responsibility: "Handle charging slot bookings" },
      { name: "Charging Session Service", endpoints: ["POST /charging/sessions/start", "Track charging", "Session history"], tech: ["Event subscribers", "PostgreSQL"], backend: "NestJS", responsibility: "Track active and historical charging sessions" },
      { name: "Charging Analytics", endpoints: ["GET /charging/history", "Cost tracking", "Usage patterns"], tech: ["Analytics", "PostgreSQL"], backend: "NestJS", responsibility: "Analyze charging patterns and costs" }
    ]
  },
  {
    category: "🔐 AUTHENTICATION & USER MANAGEMENT DOMAIN",
    icon: Shield,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    description: "Centralized authentication, authorization, and user profile management for all user types.",
    database: "PostgreSQL (users, roles, sessions) + Redis (session cache)",
    services: [
      { name: "User Authentication Service", endpoints: ["POST /auth/register", "POST /auth/login", "POST /auth/logout", "POST /auth/refresh"], tech: ["Spring Security", "JWT", "bcrypt", "Redis"], backend: "Java", responsibility: "Handle user authentication and session management" },
      { name: "OAuth2 Provider Service", endpoints: ["GET /oauth/authorize", "POST /oauth/token", "Social login integrations"], tech: ["Spring OAuth2", "JWT"], backend: "Java", responsibility: "Integrate social login providers" },
      { name: "Role-Based Access Control (RBAC)", endpoints: ["User roles", "Permissions", "Access policies"], tech: ["Spring Security", "RBAC"], backend: "Java", responsibility: "Manage user roles and access control policies" },
      { name: "Multi-Factor Authentication", endpoints: ["SMS verification", "TOTP", "Backup codes"], tech: ["Twilio", "Google Authenticator"], backend: "Java", responsibility: "Provide MFA via SMS and TOTP" },
      { name: "Password Management", endpoints: ["Password reset", "Change password", "Password policies"], tech: ["Email service", "bcrypt"], backend: "Java", responsibility: "Handle password resets and enforce policies" },
      { name: "Session Management", endpoints: ["Active sessions", "Device tracking", "Force logout"], tech: ["Redis", "JWT blacklist"], backend: "Java", responsibility: "Track active sessions and enable remote logout" },
      { name: "Passenger Profile Service", endpoints: ["GET /users/profile", "PUT /users/profile", "Upload avatar"], tech: ["JPA", "S3"], backend: "Java", responsibility: "Manage passenger profile data and avatars" },
      { name: "Driver Profile Service", endpoints: ["Driver details", "Documents", "Certifications"], tech: ["JPA", "File storage"], backend: "Java", responsibility: "Manage driver profiles and documents" },
      { name: "Fleet Manager Service", endpoints: ["Daily operations", "Bus inspections", "Maintenance reports", "Charging management"], tech: ["JPA"], backend: "Java", responsibility: "Manage fleet manager user profiles" },
      { name: "Employee Management", endpoints: ["Admin users", "Roles", "Permissions"], tech: ["RBAC", "JPA"], backend: "Java", responsibility: "Manage employee accounts and roles" },
      { name: "KYC & Verification Service", endpoints: ["Identity verification", "Document upload", "Background checks"], tech: ["3rd party KYC APIs"], backend: "Java", responsibility: "Verify user identity and conduct background checks" },
      { name: "User Preferences Service", endpoints: ["Language", "Notifications", "Payment methods"], tech: ["JPA"], backend: "Java", responsibility: "Store and retrieve user preferences" }
    ]
  },
  {
    category: "🚌 BOOKING & DISPATCH DOMAIN",
    icon: MapPin,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Bus discovery, dynamic seat allocation, and ride booking with segment-based substitution.",
    database: "PostgreSQL + PostGIS (geospatial) + Redis (seat availability cache)",
    services: [
      { name: "Bus Discovery Service", endpoints: ["GET /buses/nearby", "Find available buses/routes", "Live bus locations"], tech: ["PostGIS", "Redis", "Geospatial queries"], backend: "NestJS", responsibility: "Find available buses based on passenger location and destination" },
      { name: "Seat Map Service", endpoints: ["GET /buses/:id/seats", "Real-time seat availability per segment", "Passenger manifest"], tech: ["TypeORM", "PostgreSQL", "Redis"], backend: "NestJS", responsibility: "Manage dynamic seat allocation per route segment" },
      { name: "Seat Booking Service", endpoints: ["POST /bookings", "Lock seat for segment", "Booking confirmation"], tech: ["TypeORM", "Redis", "Transaction handling"], backend: "NestJS", responsibility: "Process seat bookings with segment-based logic" },
      { name: "Boarding Detection Service", endpoints: ["Auto-detect boarding", "Geofence validation", "Update manifest"], tech: ["Geofencing", "GPS", "Socket.io"], backend: "NestJS", responsibility: "Auto-detect passenger boarding via geofencing" },
      { name: "Drop-off Detection Service", endpoints: ["Auto-detect drop-off", "Complete booking", "Free seat for next segment"], tech: ["Geofencing", "GPS", "Redis"], backend: "NestJS", responsibility: "Auto-detect passenger alighting and free seat" },
      { name: "Active Booking Tracking", endpoints: ["GET /bookings/:id/track", "Real-time bus location", "ETA calculation"], tech: ["Socket.io", "GPS"], backend: "NestJS", responsibility: "Track active bookings with real-time bus location (consumes from Telematics)" },
      { name: "Booking History Service", endpoints: ["GET /bookings/history", "Export trips", "Filters"], tech: ["TypeORM", "Pagination"], backend: "NestJS", responsibility: "Store and retrieve booking history" },
      { name: "Booking Cancellation Service", endpoints: ["PUT /bookings/:id/cancel", "Cancellation fees", "Refund logic"], tech: ["Payment integration"], backend: "NestJS", responsibility: "Handle booking cancellations and trigger refunds" }
    ]
  },
  {
    category: "💳 PAYMENT DOMAIN",
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Secure payment processing with Paystack, wallet management, and financial transactions.",
    database: "PostgreSQL (transactions, wallets) + Redis (payment session state)",
    services: [
      { name: "Payment Processing Service", endpoints: ["POST /payments/process", "Card payments", "Mobile money"], tech: ["Spring Boot", "Paystack SDK", "Paystack API"], backend: "Java", responsibility: "Process secure payments via Paystack (cards, mobile money)" },
      { name: "Wallet Service", endpoints: ["GET /wallet/balance", "POST /wallet/topup", "POST /wallet/withdraw"], tech: ["JPA", "PostgreSQL", "Ledger"], backend: "Java", responsibility: "Manage user wallet balances with ledger integrity" },
      { name: "Fare Calculation Service", endpoints: ["Calculate base fare", "Surge pricing", "Discounts"], tech: ["Pricing engine"], backend: "Java", responsibility: "Calculate fares based on segments, surge, and discounts" },
      { name: "Invoice Generation Service", endpoints: ["Generate invoices", "Tax calculation", "Email delivery"], tech: ["iText PDF", "Email"], backend: "Java", responsibility: "Generate PDF invoices and deliver via email" },
      { name: "Refund Service", endpoints: ["POST /refunds", "Partial refunds", "Dispute handling"], tech: ["Paystack Refund API"], backend: "Java", responsibility: "Process refunds and handle payment disputes" },
      { name: "Payment Analytics", endpoints: ["Revenue reports", "Transaction history", "Reconciliation"], tech: ["Analytics DB"], backend: "Java", responsibility: "Track revenue, transactions, and reconciliation" },
      { name: "Subscription Service", endpoints: ["Monthly plans", "Auto-renewal", "Free trials"], tech: ["Recurring billing"], backend: "Java", responsibility: "Handle recurring subscription billing" }
    ]
  },
  
  // ============================================================
  // SHARED / CROSS-CUTTING SERVICES
  // ============================================================
  {
    category: "📡 SHARED SERVICES - Notifications",
    icon: Bell,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    description: "Cross-cutting notification services consumed by multiple domains.",
    database: "PostgreSQL (templates, preferences) + Redis (delivery queue)",
    services: [
      { name: "SMS Notification Service", endpoints: ["Send OTP", "Booking confirmations", "Alerts"], tech: ["Twilio", "AWS SNS"], backend: "NestJS", responsibility: "Send SMS notifications for OTPs, bookings, and alerts" },
      { name: "Email Notification Service", endpoints: ["Welcome emails", "Receipts", "Newsletters"], tech: ["SendGrid", "Nodemailer"], backend: "NestJS", responsibility: "Send transactional and marketing emails" },
      { name: "Push Notification Service", endpoints: ["Mobile push", "In-app notifications", "Badge updates"], tech: ["FCM", "APNs"], backend: "NestJS", responsibility: "Deliver push notifications to mobile devices" },
      { name: "WebSocket Service", endpoints: ["Real-time updates", "Chat", "Live tracking"], tech: ["Socket.io", "WebSocket Gateway"], backend: "NestJS", responsibility: "Provide real-time bidirectional communication" },
      { name: "In-App Notification Service", endpoints: ["GET /notifications", "Mark as read", "Preferences"], tech: ["TypeORM", "Redis"], backend: "NestJS", responsibility: "Manage in-app notification center and user preferences" },
      { name: "Notification Template Service", endpoints: ["Template management", "Localization", "Dynamic content"], tech: ["Handlebars"], backend: "NestJS", responsibility: "Manage notification templates with localization support" }
    ]
  },

  {
    category: "📞 SHARED SERVICES - Customer Support",
    icon: MessageSquare,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    description: "Customer support services for handling tickets, chat, and complaints.",
    database: "PostgreSQL (tickets, FAQs) + MongoDB (chat history)",
    services: [
      { name: "Ticketing System", endpoints: ["POST /support/tickets", "GET /support/tickets/:id", "Status updates"], tech: ["TypeORM", "Email"], backend: "NestJS", responsibility: "Manage support tickets with status tracking and email notifications" },
      { name: "Live Chat Service", endpoints: ["Real-time messaging", "Agent assignment", "Chat history"], tech: ["Socket.io", "MongoDB"], backend: "NestJS", responsibility: "Provide real-time chat between users and support agents" },
      { name: "FAQ Management", endpoints: ["GET /faqs", "Search FAQs", "Categories"], tech: ["TypeORM", "ElasticSearch"], backend: "NestJS", responsibility: "Manage searchable FAQ database with categorization" },
      { name: "Complaint Handling", endpoints: ["File complaint", "Investigation", "Resolution"], tech: ["Workflow engine"], backend: "NestJS", responsibility: "Handle complaint workflow from filing to resolution" },
      { name: "Support Analytics", endpoints: ["Ticket volume", "Resolution time", "CSAT scores"], tech: ["Analytics"], backend: "NestJS", responsibility: "Track support metrics and customer satisfaction" }
    ]
  },
  {
    category: "📊 SHARED SERVICES - Analytics & Reporting",
    icon: BarChart,
    color: "text-violet-500",
    bgColor: "bg-violet-50",
    description: "Cross-domain analytics and business intelligence services.",
    database: "Data Warehouse (OLAP) + Redis (real-time metrics)",
    services: [
      { name: "Booking Analytics Service", endpoints: ["Total bookings", "Peak hours", "Popular routes"], tech: ["Data warehouse", "BI tools"], backend: "NestJS", responsibility: "Analyze booking patterns and route popularity" },
      { name: "Financial Analytics", endpoints: ["Revenue", "Expenses", "Profit margins"], tech: ["Analytics DB"], backend: "NestJS", responsibility: "Track financial metrics and profitability" },
      { name: "Driver Performance Analytics", endpoints: ["Top performers", "Efficiency metrics", "Incentive tracking"], tech: ["Analytics"], backend: "NestJS", responsibility: "Analyze driver performance and calculate incentives" },
      { name: "User Growth Analytics", endpoints: ["New signups", "Retention", "Churn rate"], tech: ["Analytics pipeline"], backend: "NestJS", responsibility: "Track user acquisition, retention, and churn metrics" },
      { name: "Real-time Dashboard Service", endpoints: ["Live metrics", "System health", "Active users"], tech: ["Redis", "Socket.io"], backend: "NestJS", responsibility: "Provide real-time operational dashboards" }
    ]
  },
  {
    category: "🗺️ SHARED SERVICES - Geolocation & Mapping",
    icon: MapPin,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    description: "Geospatial utilities and mapping services used across domains.",
    database: "PostgreSQL + PostGIS (geospatial data)",
    services: [
      { name: "Geocoding Service", endpoints: ["Address to coordinates", "Reverse geocoding"], tech: ["Google Maps", "Mapbox"], backend: "NestJS", responsibility: "Convert addresses to coordinates and vice versa" },
      { name: "Distance Calculation Service", endpoints: ["Calculate distance", "Route optimization", "ETA"], tech: ["Maps API", "Algorithm"], backend: "NestJS", responsibility: "Calculate distances and ETAs between locations" },
      { name: "Route Planning Service", endpoints: ["Best route", "Alternative routes", "Traffic-aware"], tech: ["Maps Directions API"], backend: "NestJS", responsibility: "Generate optimized routes considering traffic" },
      { name: "Geofencing Service", endpoints: ["Define zones", "Entry/exit events", "Service areas"], tech: ["PostGIS", "Geospatial queries"], backend: "NestJS", responsibility: "Define geographic boundaries and detect entry/exit events" }
    ]
  },
  {
    category: "⏰ SHARED SERVICES - Scheduling & Background Jobs",
    icon: Settings,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    description: "Task scheduling and asynchronous job processing infrastructure.",
    database: "Redis (job queue) + PostgreSQL (job history)",
    services: [
      { name: "Cron Job Service", endpoints: ["Scheduled tasks", "Recurring jobs", "Cleanup tasks"], tech: ["@nestjs/schedule", "Bull"], backend: "NestJS", responsibility: "Execute scheduled recurring tasks and cleanup operations" },
      { name: "Task Queue Service", endpoints: ["Async job processing", "Retry logic", "Job monitoring"], tech: ["Bull", "RabbitMQ"], backend: "NestJS", responsibility: "Process asynchronous jobs with retry and monitoring" },
      { name: "Scheduled Notifications", endpoints: ["Reminders", "Expiry alerts", "Promotional campaigns"], tech: ["Scheduler", "Bull Queue"], backend: "NestJS", responsibility: "Schedule time-based notifications and campaigns" }
    ]
  },
  {
    category: "📸 SHARED SERVICES - File & Media",
    icon: Cloud,
    color: "text-sky-500",
    bgColor: "bg-sky-50",
    description: "File storage, processing, and CDN services.",
    database: "S3 (file storage) + PostgreSQL (file metadata)",
    services: [
      { name: "File Upload Service", endpoints: ["POST /upload", "Profile pictures", "Documents"], tech: ["Multer", "S3", "Cloudinary"], backend: "NestJS", responsibility: "Handle file uploads with validation and storage" },
      { name: "File Storage Service", endpoints: ["Store files", "Retrieve files", "Delete files"], tech: ["AWS S3", "Google Cloud Storage"], backend: "NestJS", responsibility: "Manage file storage on cloud object storage" },
      { name: "Image Processing Service", endpoints: ["Resize", "Compress", "Thumbnails"], tech: ["Sharp"], backend: "NestJS", responsibility: "Process and optimize images for various use cases" },
      { name: "CDN Service", endpoints: ["Serve static assets", "Cache optimization"], tech: ["CloudFront", "Cloudflare"], backend: "Infrastructure", responsibility: "Deliver static assets via global CDN" }
    ]
  },
  
  // ============================================================
  // 🆕 PLATFORM ENHANCEMENT TOOLS (NEW!)
  // ============================================================
  {
    category: "🆕 PLATFORM ENHANCEMENT - Workflow Orchestration",
    icon: Settings,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "🚀 NEW: Temporal workflow orchestration for durable execution of critical business processes (FREE - Self-hosted)",
    database: "PostgreSQL (Temporal backend) + Temporal internal state storage",
    services: [
      { name: "Temporal Server", endpoints: ["Workflow execution", "Activity scheduling", "State persistence", "Durable timers"], tech: ["Temporal.io", "Docker", "PostgreSQL"], backend: "Infrastructure", responsibility: "Orchestrate long-running workflows with guaranteed execution and automatic retries" },
      { name: "Booking Workflow Engine", endpoints: ["Reserve seat workflow", "Payment processing workflow", "Booking confirmation workflow"], tech: ["@temporalio/workflow", "NestJS"], backend: "NestJS", responsibility: "Execute booking flow with automatic rollback on payment failure (99.5%+ success rate)" },
      { name: "Payment Workflow Engine", endpoints: ["Wallet top-up workflow", "Refund workflow", "Fare calculation workflow"], tech: ["Temporal Java SDK", "Spring Boot"], backend: "Java", responsibility: "Process payments with retry logic and exactly-once guarantees" },
      { name: "Fleet Operations Workflows", endpoints: ["Maintenance scheduling workflow", "Charging session workflow", "Vehicle assignment workflow"], tech: ["@temporalio/workflow", "NestJS"], backend: "NestJS", responsibility: "Orchestrate multi-day fleet operations with human-in-the-loop approvals" },
      { name: "Driver Onboarding Workflow", endpoints: ["Background check workflow", "Document verification workflow", "Interview scheduling workflow"], tech: ["Temporal Java SDK", "Spring Boot"], backend: "Java", responsibility: "Manage driver onboarding with approval gates and async external API calls (2-5 days duration)" },
      { name: "Temporal Monitoring", endpoints: ["Workflow dashboard", "Execution history", "Failure tracking", "Metrics export"], tech: ["Temporal UI", "Prometheus"], backend: "Infrastructure", responsibility: "Monitor all workflow executions with full audit trail and debugging capabilities" }
    ]
  },
  {
    category: "🆕 PLATFORM ENHANCEMENT - AI-Powered Support",
    icon: MessageSquare,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    description: "🚀 NEW: Inkeep AI assistant for instant user support and documentation search (FREE tier: 500 Q/month, $99/month at scale)",
    database: "Inkeep Cloud (managed AI service) + Vector embeddings",
    services: [
      { name: "Rider AI Support Assistant", endpoints: ["Answer booking questions", "Explain policies", "Troubleshoot issues", "Multi-language support"], tech: ["@inkeep/react-native", "React Native"], backend: "Inkeep Cloud", responsibility: "Provide instant 24/7 support to riders in mobile app (60-70% ticket deflection)" },
      { name: "Driver AI Support Assistant", endpoints: ["Vehicle operation help", "Earnings questions", "Route guidance", "Troubleshooting"], tech: ["@inkeep/react", "React"], backend: "Inkeep Cloud", responsibility: "Help drivers find answers without waiting for human support" },
      { name: "Internal Knowledge Base AI", endpoints: ["System architecture search", "Process documentation", "API reference search", "Troubleshooting guides"], tech: ["@inkeep/react", "Internal portal"], backend: "Inkeep Cloud", responsibility: "Give team instant access to technical docs and process guides (4-6x faster onboarding)" },
      { name: "Developer Documentation AI", endpoints: ["API documentation search", "Code examples", "Integration guides", "Webhook documentation"], tech: ["Inkeep Widget", "Fumadocs"], backend: "Inkeep Cloud", responsibility: "Help partners integrate via self-service documentation search" },
      { name: "AI Training Pipeline", endpoints: ["Upload knowledge base", "Import support tickets", "Sync documentation", "Optimize responses"], tech: ["Inkeep API", "Automated sync"], backend: "Inkeep Cloud", responsibility: "Continuously improve AI accuracy by learning from resolved support tickets" },
      { name: "Support Escalation Service", endpoints: ["Auto-create ticket when AI can't answer", "Include conversation context", "Route to appropriate agent"], tech: ["Inkeep → Ticketing integration"], backend: "NestJS", responsibility: "Seamlessly escalate complex questions to human agents with full context" }
    ]
  },
  {
    category: "🆕 PLATFORM ENHANCEMENT - Documentation Framework",
    icon: Cloud,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "🚀 NEW: Fumadocs for professional API documentation and knowledge base (FREE - Open-source)",
    database: "Static site generation (no database needed) + Git-based content",
    services: [
      { name: "API Documentation Generator", endpoints: ["Auto-generate from OpenAPI specs", "REST API reference", "WebSocket API docs", "Webhook events"], tech: ["Fumadocs", "OpenAPI 3.0", "Next.js"], backend: "Static Site", responsibility: "Generate beautiful, searchable API docs from OpenAPI specifications (docs.volteryde.com)" },
      { name: "User Knowledge Base", endpoints: ["Rider guides", "Driver guides", "Fleet manager guides", "FAQ database"], tech: ["Fumadocs MDX", "Next.js", "Algolia search"], backend: "Static Site", responsibility: "Provide self-service help center for all user types (help.volteryde.com)" },
      { name: "Internal Technical Documentation", endpoints: ["Architecture docs", "Development setup", "Deployment guides", "Coding standards"], tech: ["Fumadocs", "MDX", "Git"], backend: "Static Site", responsibility: "Document system architecture and processes for engineering team (internal.volteryde.com)" },
      { name: "Integration Guides", endpoints: ["Partner API integration", "Code examples (JS/Python/Java)", "SDK documentation", "Postman collections"], tech: ["Fumadocs", "Code snippets", "API playground"], backend: "Static Site", responsibility: "Enable self-service partner integrations with examples and interactive playground" },
      { name: "Documentation CI/CD", endpoints: ["Auto-deploy on doc changes", "Auto-generate API docs on spec updates", "Link validation", "SEO optimization"], tech: ["Vercel", "GitHub Actions", "Fumadocs CLI"], backend: "Infrastructure", responsibility: "Automatically deploy and update documentation when code or content changes" },
      { name: "Multi-Language Documentation", endpoints: ["English, Yoruba, Igbo, Hausa translations", "Auto-translation", "Language switcher"], tech: ["Fumadocs i18n", "Translation service"], backend: "Static Site", responsibility: "Provide documentation in multiple languages for accessibility" }
    ]
  },
  {
    category: "☁️ INFRASTRUCTURE & DEVOPS",
    icon: Cloud,
    color: "text-slate-500",
    bgColor: "bg-slate-50",
    description: "Platform infrastructure, deployment, and operational services.",
    database: "Monitoring DB (Prometheus) + Log Storage (Elasticsearch)",
    services: [
      { name: "Container Orchestration", endpoints: ["Deploy services", "Auto-scaling", "Health checks"], tech: ["Kubernetes", "Docker"], backend: "Infrastructure", responsibility: "Orchestrate container deployment and scaling" },
      { name: "Monitoring & Logging", endpoints: ["Logs aggregation", "Error tracking", "Performance monitoring"], tech: ["ELK Stack", "Datadog", "Sentry"], backend: "Infrastructure", responsibility: "Aggregate logs and monitor system health" },
      { name: "CI/CD Pipeline", endpoints: ["Automated testing", "Deployment", "Rollbacks"], tech: ["GitHub Actions", "Jenkins"], backend: "Infrastructure", responsibility: "Automate testing, builds, and deployments" },
      { name: "Backup & Disaster Recovery", endpoints: ["DB backups", "Point-in-time recovery", "Failover"], tech: ["Automated backups"], backend: "Infrastructure", responsibility: "Ensure data backup and disaster recovery capability" },
      { name: "Load Balancing", endpoints: ["Distribute traffic", "Health checks", "SSL termination"], tech: ["NGINX", "HAProxy"], backend: "Infrastructure", responsibility: "Distribute traffic and ensure high availability" }
    ]
  }
];

export function ServiceCatalog() {
  const [filter, setFilter] = useState<string>('all');
  const [backendFilter, setBackendFilter] = useState<string>('all');

  let categories = filter === 'all' ? serviceCatalog : serviceCatalog.filter(cat => cat.category.toLowerCase().includes(filter.toLowerCase()));
  
  // Apply backend filter
  if (backendFilter !== 'all') {
    categories = categories.map(cat => ({
      ...cat,
      services: cat.services.filter(service => service.backend === backendFilter)
    })).filter(cat => cat.services.length > 0);
  }

  const javaCount = serviceCatalog.reduce((acc, cat) => acc + cat.services.filter(s => s.backend === 'Java').length, 0);
  const nestCount = serviceCatalog.reduce((acc, cat) => acc + cat.services.filter(s => s.backend === 'NestJS').length, 0);
  const infraCount = serviceCatalog.reduce((acc, cat) => acc + cat.services.filter(s => s.backend === 'Infrastructure').length, 0);

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Complete Service Catalog</h3>
        <p className="text-slate-600 text-sm sm:text-base mb-4">
          Comprehensive list of all microservices, APIs, and components required to build Volteryde
        </p>
        
        {/* Tech Stack Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-slate-900 text-sm sm:text-base">Java (Spring Boot)</span>
            </div>
            <p className="text-slate-600 text-sm">{javaCount} services</p>
            <p className="text-slate-500 text-xs mt-1">Auth & Payments</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-900 text-sm sm:text-base">NestJS</span>
            </div>
            <p className="text-slate-600 text-sm">{nestCount} services</p>
            <p className="text-slate-500 text-xs mt-1">Core Business Logic</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
              <div className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-slate-900 text-sm sm:text-base">Infrastructure</span>
            </div>
            <p className="text-slate-600 text-sm">{infraCount} services</p>
            <p className="text-slate-500 text-xs mt-1">Platform Services</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-slate-600 text-sm mb-2">Filter by Category:</p>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={filter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                All Services
              </Badge>
              <Badge 
                variant={filter === 'api' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('api')}
              >
                API Services
              </Badge>
              <Badge 
                variant={filter === 'management' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('management')}
              >
                Management
              </Badge>
              <Badge 
                variant={filter === 'analytics' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setFilter('analytics')}
              >
                Analytics
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-slate-600 text-sm mb-2">Filter by Backend:</p>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant={backendFilter === 'all' ? 'default' : 'outline'} 
                className="cursor-pointer"
                onClick={() => setBackendFilter('all')}
              >
                All Backend
              </Badge>
              <Badge 
                variant={backendFilter === 'Java' ? 'default' : 'outline'} 
                className="cursor-pointer bg-orange-500 hover:bg-orange-600"
                onClick={() => setBackendFilter('Java')}
              >
                Java ({javaCount})
              </Badge>
              <Badge 
                variant={backendFilter === 'NestJS' ? 'default' : 'outline'} 
                className="cursor-pointer bg-red-500 hover:bg-red-600"
                onClick={() => setBackendFilter('NestJS')}
              >
                NestJS ({nestCount})
              </Badge>
              <Badge 
                variant={backendFilter === 'Infrastructure' ? 'default' : 'outline'} 
                className="cursor-pointer bg-slate-500 hover:bg-slate-600"
                onClick={() => setBackendFilter('Infrastructure')}
              >
                Infrastructure ({infraCount})
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Accordion type="multiple" className="space-y-4">
        {categories.map((category, idx) => {
          const Icon = category.icon;
          return (
            <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-lg bg-white">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <Icon className={`w-5 h-5 ${category.color}`} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-900">{category.category}</h4>
                    <p className="text-slate-500 text-sm">{category.services.length} services</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  {category.services.map((service, serviceIdx) => {
                    const getBackendColor = (backend: string) => {
                      switch (backend) {
                        case 'Java': return 'bg-orange-500';
                        case 'NestJS': return 'bg-red-500';
                        case 'Infrastructure': return 'bg-slate-500';
                        default: return 'bg-gray-500';
                      }
                    };

                    return (
                      <Card key={serviceIdx} className="p-4 bg-slate-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h5 className="text-slate-900">{service.name}</h5>
                            <Badge className={`text-xs text-white ${getBackendColor(service.backend)}`}>
                              {service.backend}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {service.endpoints.length} features
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Key Endpoints/Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {service.endpoints.map((endpoint, epIdx) => (
                                <Badge key={epIdx} variant="secondary" className="text-xs">
                                  {endpoint}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Technologies:</p>
                            <div className="flex flex-wrap gap-1">
                              {service.tech.map((tech, techIdx) => (
                                <Badge key={techIdx} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
