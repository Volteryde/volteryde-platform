import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Cloud, Shield, Car, Settings } from 'lucide-react';

const backendServices = [
  {
    name: "☕ volteryde-springboot",
    tech: "Java/Spring Boot",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Security-critical services: Authentication & Authorization + Payment Processing",
    database: "PostgreSQL + Redis",
    modules: [
      {
        name: "Authentication Module",
        endpoints: 13,
        features: [
          "User registration and login with JWT",
          "OAuth2 social login integration",
          "Multi-factor authentication (SMS, TOTP)",
          "Role-based access control (RBAC)",
          "Session management and device tracking",
          "Password reset and policies",
          "User profile management for all user types"
        ]
      },
      {
        name: "Payment Module",
        endpoints: 13,
        features: [
          "Paystack payment gateway integration",
          "Wallet management (top-up, withdraw, balance)",
          "Transaction history and receipts",
          "Refund processing",
          "Payment method management",
          "Webhook handling for payment events",
          "Secure payment tokenization"
        ]
      }
    ]
  },
  {
    name: "🟢 volteryde-nest",
    tech: "NestJS/TypeScript",
    icon: Car,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "Business logic services: Telematics + Booking + Fleet Operations + Charging",
    database: "PostgreSQL + InfluxDB + Redis + PostGIS",
    modules: [
      {
        name: "Telematics Module",
        endpoints: 8,
        features: [
          "Real-time GPS tracking and location history",
          "Battery monitoring and state of charge",
          "Vehicle diagnostics and error codes",
          "Telemetry data ingestion (MQTT, IoT)",
          "WebSocket streams for live updates",
          "Geofencing and route tracking",
          "Single source of truth for vehicle state"
        ]
      },
      {
        name: "Booking Module",
        endpoints: 11,
        features: [
          "Bus discovery based on location",
          "Real-time seat availability",
          "Segment-based seat allocation",
          "Booking creation and confirmation",
          "Booking cancellation and refunds",
          "Ride tracking with ETA",
          "Passenger check-in and manifest",
          "Active ride monitoring"
        ]
      },
      {
        name: "Fleet Operations Module",
        endpoints: 10,
        features: [
          "Vehicle fleet management",
          "Maintenance scheduling and tracking",
          "Fleet utilization analytics",
          "Efficiency metrics and reporting",
          "Daily operational reports",
          "Vehicle inspection logging",
          "Maintenance history",
          "Compliance tracking"
        ]
      },
      {
        name: "Charging Infrastructure Module",
        endpoints: 10,
        features: [
          "Charging station management",
          "Station location and availability",
          "Charging session tracking",
          "Charging slot reservations",
          "Real-time session monitoring",
          "Charging history and analytics",
          "Energy consumption tracking",
          "Billing and cost management"
        ]
      }
    ]
  },
  {
    name: "⚙️ temporal-workers",
    tech: "Temporal/TypeScript",
    icon: Settings,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Background workflow orchestration with automatic retry and compensation logic",
    database: "Temporal Server + PostgreSQL",
    modules: [
      {
        name: "Booking Workflow Worker",
        workflows: 4,
        features: [
          "End-to-end booking workflow with compensation",
          "Durable seat locking and payment processing",
          "Automatic retry on transient failures",
          "Booking cancellation with refund",
          "Email and SMS notifications",
          "Human-in-the-loop for edge cases",
          "Booking reminder workflows"
        ]
      },
      {
        name: "Payment Workflow Worker",
        workflows: 4,
        features: [
          "Payment processing with retry logic",
          "Refund workflow orchestration",
          "Dispute resolution workflows",
          "Wallet top-up processing",
          "Payment receipt generation",
          "Webhook event handling",
          "Transaction reconciliation"
        ]
      },
      {
        name: "Fleet Maintenance Workflow Worker",
        workflows: 4,
        features: [
          "Maintenance scheduling based on telemetry",
          "Predictive maintenance workflows",
          "Maintenance progress tracking",
          "Daily vehicle inspection workflows",
          "Fleet manager notifications",
          "Maintenance record logging",
          "Vehicle availability management"
        ]
      }
    ]
  }
];

export function ServiceCatalog() {
  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-green-50">
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Backend Services Architecture</h3>
        <p className="text-slate-700 mb-6">
          Three technology-grouped backend services with modular architecture for scalability and maintainability.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {backendServices.map((service, idx) => (
            <div key={idx} className={`${service.bgColor} p-4 rounded-lg border-2 border-slate-200`}>
              <div className="flex items-center gap-2 mb-2">
                <service.icon className={`w-6 h-6 ${service.color}`} />
                <h4 className="font-bold text-slate-900">{service.name}</h4>
              </div>
              <Badge className="mb-2">{service.tech}</Badge>
              <p className="text-sm text-slate-600 mb-2">{service.description}</p>
              <p className="text-xs text-slate-500">
                <strong>Database:</strong> {service.database}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                <strong>Modules:</strong> {service.modules.length}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* API Gateway */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Cloud className="w-8 h-8 text-orange-500" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">API Gateway & Infrastructure</h3>
            <p className="text-sm text-slate-600">Request routing, load balancing, and security</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Kong API Gateway</h4>
            <p className="text-sm text-slate-600">Routes requests to backend services with JWT validation</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Rate Limiting</h4>
            <p className="text-sm text-slate-600">Token bucket algorithm with Redis for abuse prevention</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">AWS ALB</h4>
            <p className="text-sm text-slate-600">Load balancer for traffic distribution and health checks</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">Security Headers</h4>
            <p className="text-sm text-slate-600">CORS policies, SSL/TLS termination, security headers</p>
          </div>
        </div>
      </Card>

      {/* Service Details */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">Service Details</h3>
        <Accordion type="multiple" className="space-y-4">
          {backendServices.map((service, idx) => (
            <AccordionItem key={idx} value={`service-${idx}`} className="border rounded-lg bg-white">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${service.bgColor}`}>
                    <service.icon className={`w-6 h-6 ${service.color}`} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-slate-900">{service.name}</h4>
                    <p className="text-sm text-slate-600">{service.tech} • {service.modules.length} modules</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 mb-1"><strong>Description:</strong> {service.description}</p>
                    <p className="text-sm text-slate-700"><strong>Database:</strong> {service.database}</p>
                  </div>

                  {service.modules.map((module, modIdx) => (
                    <div key={modIdx} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold text-slate-900">{module.name}</h5>
                        <Badge variant="secondary">
                          {'endpoints' in module ? `${module.endpoints} endpoints` : `${module.workflows} workflows`}
                        </Badge>
                      </div>
                      <ul className="space-y-1">
                        {module.features.map((feature, featIdx) => (
                          <li key={featIdx} className="text-sm text-slate-600 flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Tech Stack Summary */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Technology Stack</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Languages & Frameworks</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• Java 17 with Spring Boot 3.x</p>
              <p>• TypeScript with NestJS 10.x</p>
              <p>• Temporal TypeScript SDK</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Databases</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• PostgreSQL (relational data)</p>
              <p>• InfluxDB (time-series telemetry)</p>
              <p>• Redis (caching & sessions)</p>
              <p>• PostGIS (geospatial queries)</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Messaging & Events</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• Apache Kafka (event bus)</p>
              <p>• MQTT (IoT telemetry)</p>
              <p>• Socket.io (real-time updates)</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Infrastructure</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• Docker containers</p>
              <p>• Kubernetes (AWS EKS)</p>
              <p>• Kong API Gateway</p>
              <p>• AWS Application Load Balancer</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
