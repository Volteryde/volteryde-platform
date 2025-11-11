import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Car, Settings, Plug, Shield, CreditCard, MapPin, Zap, Database } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2 } from 'lucide-react';

export function DomainArchitecture() {
  const domains = [
    {
      name: "Vehicle & Telematics Domain",
      emoji: "🎯",
      subtitle: "Single Source of Truth",
      icon: Car,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Real-time vehicle data ingestion, normalization, and event publishing. Authoritative source for all vehicle state.",
      database: {
        primary: "InfluxDB / TimescaleDB",
        cache: "Redis",
        optimization: "Write-heavy (IoT streams)"
      },
      services: [
        { name: "GPS Location Service", api: "GET /vehicles/{id}/location" },
        { name: "Battery Service", api: "GET /vehicles/{id}/battery" },
        { name: "Diagnostics Service", api: "GET /vehicles/{id}/diagnostics" },
        { name: "Telemetry Aggregator", api: "WS /vehicles/{id}/stream" }
      ],
      responsibilities: [
        "Ingest IoT data from vehicles",
        "Normalize and validate telemetry",
        "Store time-series data efficiently",
        "Publish real-time events to Kafka/RabbitMQ",
        "Provide REST API for current vehicle state",
        "Implement geofencing logic"
      ],
      doesNotOwn: [
        "Fleet schedules (Fleet Operations)",
        "Maintenance decisions (Fleet Operations)",
        "Charging reservations (Charging Infrastructure)"
      ],
      events: ["vehicle-location-updated", "battery-level-updated", "diagnostics-warning"]
    },
    {
      name: "Fleet Operations Domain",
      emoji: "🏗️",
      subtitle: "Business Logic Consumer",
      icon: Settings,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      description: "Consumes telemetry data to provide fleet analytics, maintenance scheduling, and operational insights.",
      database: {
        primary: "PostgreSQL",
        cache: "Redis",
        optimization: "Read-heavy (analytics)"
      },
      services: [
        { name: "Vehicle Management Service", api: "GET /fleet/vehicles" },
        { name: "Maintenance Service", api: "POST /fleet/vehicles/{id}/schedule-maintenance" },
        { name: "Fleet Analytics Service", api: "GET /fleet/analytics/utilization" },
        { name: "Fleet Reporting Service", api: "GET /fleet/reports/cost-breakdown" }
      ],
      responsibilities: [
        "Vehicle roster and assignments",
        "Maintenance scheduling and tracking",
        "Fleet analytics and reporting",
        "Cost calculations",
        "Utilization metrics"
      ],
      consumesFrom: [
        "Vehicle & Telematics Domain (battery health, diagnostics)",
        "Charging Infrastructure Domain (charging events, costs)"
      ],
      events: ["maintenance-scheduled", "vehicle-assigned", "fleet-report-generated"]
    },
    {
      name: "Charging Infrastructure Domain",
      emoji: "⚡",
      subtitle: "Independent Business Capability",
      icon: Plug,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      description: "Manages charging stations, reservations, and sessions. Consumes battery data from Telematics.",
      database: {
        primary: "PostgreSQL",
        cache: "Redis",
        optimization: "Balanced (reservations + sessions)"
      },
      services: [
        { name: "Charging Station Service", api: "GET /charging/stations" },
        { name: "Reservation Service", api: "POST /charging/reservations" },
        { name: "Charging Session Service", api: "POST /charging/sessions/start" },
        { name: "Charging Analytics", api: "GET /charging/history" }
      ],
      responsibilities: [
        "Charging station management",
        "Reservation system",
        "Charging session tracking",
        "Pricing logic",
        "Availability calendar"
      ],
      consumesFrom: [
        "Vehicle & Telematics Domain (battery level)",
        "Fleet Operations Domain (charging requests)"
      ],
      events: ["reservation-confirmed", "session-started", "session-completed"]
    },
    {
      name: "Booking & Dispatch Domain",
      emoji: "🚌",
      subtitle: "Core Business Logic",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Handles bus discovery, dynamic seat allocation, and ride booking with segment-based substitution.",
      database: {
        primary: "PostgreSQL + PostGIS",
        cache: "Redis",
        optimization: "Geospatial queries"
      },
      services: [
        { name: "Bus Discovery Service", api: "GET /buses/nearby" },
        { name: "Seat Booking Service", api: "POST /bookings" },
        { name: "Boarding Detection Service", api: "Auto geofence-based" },
        { name: "Active Booking Tracking", api: "GET /bookings/{id}/track" }
      ],
      responsibilities: [
        "Find available buses and routes",
        "Dynamic seat allocation per segment",
        "Real-time booking tracking",
        "Boarding/drop-off auto-detection",
        "Passenger manifest management"
      ],
      consumesFrom: [
        "Vehicle & Telematics Domain (real-time GPS)",
        "Payment Domain (payment confirmation)"
      ],
      events: ["booking-created", "passenger-boarded", "passenger-alighted"]
    },
    {
      name: "Payment Domain",
      emoji: "💳",
      subtitle: "Enterprise Security (Java)",
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Secure payment processing with Paystack, wallet management, and financial transactions.",
      database: {
        primary: "PostgreSQL",
        cache: "Redis",
        optimization: "Transaction integrity"
      },
      services: [
        { name: "Payment Processing Service", api: "POST /payments/process" },
        { name: "Wallet Service", api: "GET /wallet/balance" },
        { name: "Fare Calculation Service", api: "POST /fares/calculate" },
        { name: "Refund Service", api: "POST /refunds" }
      ],
      responsibilities: [
        "Paystack integration (cards, mobile money)",
        "Wallet balance management",
        "Fare calculation with surge pricing",
        "Invoice generation (PDF)",
        "Refund processing"
      ],
      whyJava: [
        "Spring Security for PCI compliance",
        "Robust transaction management",
        "Enterprise-grade reliability",
        "Strong typing for financial operations",
        "Better audit trails"
      ],
      events: ["payment-processed", "wallet-topup", "refund-issued"]
    },
    {
      name: "Authentication & User Management Domain",
      emoji: "🔐",
      subtitle: "Centralized Auth (Java)",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Centralized authentication, authorization, and user profile management for all user types.",
      database: {
        primary: "PostgreSQL",
        cache: "Redis",
        optimization: "Session lookups"
      },
      services: [
        { name: "User Authentication Service", api: "POST /auth/login" },
        { name: "OAuth2 Provider Service", api: "GET /oauth/authorize" },
        { name: "RBAC System", api: "GET /users/{id}/permissions" },
        { name: "Profile Services", api: "GET /users/profile" }
      ],
      responsibilities: [
        "User registration and login",
        "JWT token management",
        "Role-based access control (RBAC)",
        "Multi-factor authentication (MFA)",
        "Profile management (all user types)",
        "Session tracking and management"
      ],
      whyJava: [
        "Spring Security framework",
        "OAuth2 / OpenID Connect support",
        "Mature session management",
        "Enterprise authentication standards"
      ],
      events: ["user-registered", "user-logged-in", "session-expired"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-900">
          <strong>✅ Architecture Validated:</strong> This Domain-Driven Design (DDD) approach is architecturally sound
          and follows microservices best practices for scalability, maintainability, and clear separation of concerns.
        </AlertDescription>
      </Alert>

      {/* Overview Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-slate-900 text-xl mb-4">Domain-Driven Design Architecture</h3>
        <p className="text-slate-600 mb-6">
          Volteryde's backend is organized into <strong>6 core domains</strong>, each with clear boundaries,
          single responsibilities, and independent scalability. This structure eliminates data conflicts,
          reduces coupling, and enables efficient scaling.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <Database className="w-8 h-8 text-blue-500 mb-2" />
            <h4 className="text-slate-900 mb-1">Database per Domain</h4>
            <p className="text-slate-600 text-sm">Each domain owns its data with optimized storage strategy</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <Zap className="w-8 h-8 text-purple-500 mb-2" />
            <h4 className="text-slate-900 mb-1">Event-Driven</h4>
            <p className="text-slate-600 text-sm">Domains communicate via Kafka/RabbitMQ for loose coupling</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <Settings className="w-8 h-8 text-green-500 mb-2" />
            <h4 className="text-slate-900 mb-1">Independent Scaling</h4>
            <p className="text-slate-600 text-sm">Each domain scales based on its specific load pattern</p>
          </div>
        </div>
      </Card>

      {/* Domain Cards */}
      <Accordion type="multiple" className="space-y-4" defaultValue={["item-0"]}>
        {domains.map((domain, idx) => {
          const Icon = domain.icon;
          return (
            <AccordionItem key={idx} value={`item-${idx}`} className={`border-2 ${domain.borderColor} rounded-lg bg-white`}>
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <div className={`p-3 rounded-lg ${domain.bgColor}`}>
                    <Icon className={`w-6 h-6 ${domain.color}`} />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{domain.emoji}</span>
                      <h4 className="text-slate-900 font-semibold">{domain.name}</h4>
                    </div>
                    <p className="text-slate-500 text-sm">{domain.subtitle}</p>
                  </div>
                  <Badge className={`${domain.bgColor} ${domain.color} border-0`}>
                    {domain.services.length} services
                  </Badge>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  {/* Description */}
                  <div className={`p-4 rounded-lg ${domain.bgColor} border ${domain.borderColor}`}>
                    <p className="text-slate-700">{domain.description}</p>
                  </div>

                  {/* Database Strategy */}
                  <div>
                    <h5 className="text-slate-900 font-medium mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" /> Database Strategy
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-slate-500 mb-1">Primary Database</p>
                        <p className="text-sm font-medium text-slate-900">{domain.database.primary}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-slate-500 mb-1">Cache Layer</p>
                        <p className="text-sm font-medium text-slate-900">{domain.database.cache}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded">
                        <p className="text-xs text-slate-500 mb-1">Optimization</p>
                        <p className="text-sm font-medium text-slate-900">{domain.database.optimization}</p>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h5 className="text-slate-900 font-medium mb-2">Core Services</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {domain.services.map((service, sIdx) => (
                        <Card key={sIdx} className="p-3 bg-slate-50">
                          <p className="text-sm font-medium text-slate-900 mb-1">{service.name}</p>
                          <code className="text-xs text-slate-600 bg-white px-2 py-1 rounded">{service.api}</code>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Responsibilities */}
                  <div>
                    <h5 className="text-slate-900 font-medium mb-2">✅ Responsibilities</h5>
                    <ul className="space-y-1">
                      {domain.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What it consumes/doesn't own */}
                  {domain.consumesFrom && (
                    <div>
                      <h5 className="text-slate-900 font-medium mb-2">📥 Consumes From</h5>
                      <ul className="space-y-1">
                        {domain.consumesFrom.map((consume, cIdx) => (
                          <li key={cIdx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">→</span>
                            {consume}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {domain.doesNotOwn && (
                    <div>
                      <h5 className="text-slate-900 font-medium mb-2">❌ Does NOT Own</h5>
                      <ul className="space-y-1">
                        {domain.doesNotOwn.map((notOwn, nIdx) => (
                          <li key={nIdx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">×</span>
                            {notOwn}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Why Java */}
                  {domain.whyJava && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h5 className="text-slate-900 font-medium mb-2">☕ Why Java?</h5>
                      <ul className="space-y-1">
                        {domain.whyJava.map((reason, wIdx) => (
                          <li key={wIdx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">✓</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Published Events */}
                  <div>
                    <h5 className="text-slate-900 font-medium mb-2">📡 Published Events</h5>
                    <div className="flex flex-wrap gap-2">
                      {domain.events.map((event, eIdx) => (
                        <Badge key={eIdx} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Event Bus Architecture */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
        <h3 className="text-slate-900 text-xl mb-4">Event-Driven Communication</h3>
        <p className="text-slate-600 mb-4">
          Domains communicate asynchronously via <strong>Kafka/RabbitMQ</strong> to reduce coupling and enable independent scaling.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 font-medium mb-2">Example: Maintenance Alert</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>1. Telematics →</strong> Publishes "battery-health-degraded"</p>
              <p><strong>2. Fleet Ops →</strong> Subscribes and creates maintenance ticket</p>
              <p><strong>3. Fleet Ops →</strong> Publishes "maintenance-scheduled"</p>
              <p><strong>4. Notifications →</strong> Alerts fleet manager</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 font-medium mb-2">Event Bus Best Practices</h4>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>✓ Retry logic with exponential backoff</li>
              <li>✓ Dead-letter queues for failed events</li>
              <li>✓ Event versioning for compatibility</li>
              <li>✓ Schema registry for documentation</li>
              <li>✓ Idempotency for duplicate handling</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
