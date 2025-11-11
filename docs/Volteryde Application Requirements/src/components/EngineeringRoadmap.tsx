import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked';

interface Task {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDays: number;
  dependencies?: string[];
  assignedTo?: string;
}

interface Phase {
  name: string;
  description: string;
  tasks: Task[];
}

const engineeringPhases: Phase[] = [
  {
    name: "Phase 1: Foundation & Infrastructure (Weeks 1-3)",
    description: "Set up core infrastructure, development environment, and foundational services",
    tasks: [
      { id: "infra-1", name: "Cloud Infrastructure Setup", description: "Configure AWS/GCP, VPC, subnets, security groups", priority: "critical", estimatedDays: 3 },
      { id: "infra-2", name: "Kubernetes Cluster Setup", description: "Set up K8s cluster, namespaces, RBAC", priority: "critical", estimatedDays: 3 },
      { id: "infra-3", name: "CI/CD Pipeline", description: "GitHub Actions/Jenkins for automated deployment", priority: "high", estimatedDays: 2 },
      { id: "infra-4", name: "Database Setup", description: "PostgreSQL primary, Redis cache, MongoDB setup", priority: "critical", estimatedDays: 2 },
      { id: "infra-5", name: "Message Queue Setup", description: "RabbitMQ/Kafka configuration", priority: "high", estimatedDays: 2 },
      { id: "infra-6", name: "Monitoring & Logging", description: "ELK stack, Datadog/Prometheus setup", priority: "high", estimatedDays: 2 },
      { id: "infra-7", name: "API Gateway", description: "Kong/NGINX gateway with routing, rate limiting", priority: "critical", estimatedDays: 3 },
      { id: "infra-8", name: "CDN & File Storage", description: "S3, CloudFront, media storage", priority: "medium", estimatedDays: 1 }
    ]
  },
  {
    name: "Phase 2: Authentication & User Management - Java (Weeks 4-5)",
    description: "Build Spring Boot-based authentication, authorization, and user management systems",
    tasks: [
      { id: "auth-1", name: "User Authentication Service (Java)", description: "Registration, login, JWT with Spring Security", priority: "critical", estimatedDays: 4, dependencies: ["infra-4"] },
      { id: "auth-2", name: "OAuth2 Integration (Java)", description: "Social login (Google, Facebook) via Spring OAuth2", priority: "high", estimatedDays: 3, dependencies: ["auth-1"] },
      { id: "auth-3", name: "RBAC System (Java)", description: "Role and permission management with Spring Security", priority: "critical", estimatedDays: 3, dependencies: ["auth-1"] },
      { id: "auth-4", name: "Multi-Factor Authentication (Java)", description: "SMS/TOTP 2FA", priority: "high", estimatedDays: 2, dependencies: ["auth-1"] },
      { id: "auth-5", name: "Password Management (Java)", description: "Reset, change, policies", priority: "medium", estimatedDays: 2, dependencies: ["auth-1"] },
      { id: "user-1", name: "User Profile Service (Java)", description: "CRUD for passenger/driver profiles + fleet manager operational staff with JPA", priority: "high", estimatedDays: 3, dependencies: ["auth-1"] },
      { id: "user-2", name: "KYC & Verification (Java)", description: "Document upload, identity verification", priority: "high", estimatedDays: 3 }
    ]
  },
  {
    name: "Phase 3: Bus Booking & Seat Management (Weeks 6-8)",
    description: "Implement bus discovery, dynamic seat allocation, and location-based detection",
    tasks: [
      { id: "ride-1", name: "Bus Discovery Service", description: "Find available buses/routes, real-time locations", priority: "critical", estimatedDays: 4, dependencies: ["auth-1", "user-1"] },
      { id: "ride-2", name: "Seat Availability Algorithm", description: "Dynamic segment-based seat availability & substitution", priority: "critical", estimatedDays: 5, dependencies: ["ride-1"] },
      { id: "ride-3", name: "Seat Booking Service", description: "Book seats for specific segments, lock & payment", priority: "critical", estimatedDays: 3, dependencies: ["ride-2"] },
      { id: "ride-4", name: "Real-Time Bus Tracking", description: "WebSocket for live bus location updates", priority: "critical", estimatedDays: 4, dependencies: ["ride-3"] },
      { id: "ride-5", name: "Boarding & Drop-off Detection", description: "Geofence-based auto-detection algorithm", priority: "critical", estimatedDays: 5, dependencies: ["ride-4"] },
      { id: "ride-6", name: "Booking History & Analytics", description: "Trip history, export data", priority: "medium", estimatedDays: 2, dependencies: ["ride-5"] },
      { id: "ride-7", name: "Route Management", description: "Create routes, stops, schedules", priority: "high", estimatedDays: 3 },
      { id: "ride-8", name: "Booking Cancellation", description: "Cancel logic, fees, refunds", priority: "high", estimatedDays: 2, dependencies: ["ride-1"] }
    ]
  },
  {
    name: "Phase 4: Payment System - Java (Weeks 9-10)",
    description: "Build Spring Boot-based payment processing, wallets, and invoicing",
    tasks: [
      { id: "pay-1", name: "Payment Gateway Integration (Java)", description: "Paystack integration with Spring Boot for card/mobile money payments", priority: "critical", estimatedDays: 4 },
      { id: "pay-2", name: "Wallet Service (Java)", description: "Balance, top-up, withdraw with ledger management", priority: "high", estimatedDays: 4, dependencies: ["pay-1"] },
      { id: "pay-3", name: "Fare Calculation Engine (Java)", description: "Segment-based fare, discounts", priority: "critical", estimatedDays: 3 },
      { id: "pay-4", name: "Invoice Generation (Java)", description: "PDF invoices with iText, email delivery", priority: "medium", estimatedDays: 2, dependencies: ["pay-1"] },
      { id: "pay-5", name: "Refund Service (Java)", description: "Full/partial refunds, disputes", priority: "high", estimatedDays: 3, dependencies: ["pay-1"] },
      { id: "pay-6", name: "Payment Analytics (Java)", description: "Revenue tracking, reconciliation", priority: "medium", estimatedDays: 2 }
    ]
  },
  {
    name: "Phase 5: Driver & Fleet Management (Weeks 11-12)",
    description: "Driver availability, assignment, payroll, fleet tracking",
    tasks: [
      { id: "driver-1", name: "Driver Availability Service", description: "Online/offline status, shift management", priority: "high", estimatedDays: 3 },
      { id: "driver-2", name: "Driver Document Management", description: "License, insurance, expiry alerts", priority: "high", estimatedDays: 3 },
      { id: "driver-3", name: "Service Rating System", description: "Volteryde service ratings, reviews, feedback", priority: "medium", estimatedDays: 2 },
      { id: "driver-4", name: "Driver Payroll Service", description: "Earnings calculation, commission", priority: "high", estimatedDays: 4 },
      { id: "fleet-1", name: "Vehicle Management", description: "Vehicle CRUD, assignments", priority: "high", estimatedDays: 3 },
      { id: "fleet-2", name: "Maintenance Tracking", description: "Schedule, history, alerts", priority: "medium", estimatedDays: 3 },
      { id: "fleet-3", name: "Fleet Analytics", description: "Utilization, efficiency metrics", priority: "medium", estimatedDays: 2 }
    ]
  },
  {
    name: "Phase 6: IoT & Vehicle Telematics (Weeks 13-14)",
    description: "Vehicle tracking, battery management, diagnostics",
    tasks: [
      { id: "iot-1", name: "Vehicle Telematics Service", description: "GPS tracking, speed monitoring", priority: "high", estimatedDays: 5 },
      { id: "iot-2", name: "Battery Management System", description: "State of charge, health monitoring", priority: "high", estimatedDays: 4 },
      { id: "iot-3", name: "Vehicle Diagnostics", description: "Error codes, maintenance alerts", priority: "medium", estimatedDays: 3 },
      { id: "iot-4", name: "Edge Computing Nodes", description: "Local processing, offline mode", priority: "medium", estimatedDays: 4 },
      { id: "iot-5", name: "Charging Station Management", description: "Station locations, availability", priority: "medium", estimatedDays: 3 }
    ]
  },
  {
    name: "Phase 7: Notifications & Communication (Weeks 15-16)",
    description: "SMS, email, push notifications, WebSocket",
    tasks: [
      { id: "notif-1", name: "SMS Service", description: "Twilio integration, OTP", priority: "high", estimatedDays: 2 },
      { id: "notif-2", name: "Email Service", description: "SendGrid, transactional emails", priority: "high", estimatedDays: 2 },
      { id: "notif-3", name: "Push Notifications", description: "FCM, APNs integration", priority: "high", estimatedDays: 3 },
      { id: "notif-4", name: "WebSocket Service", description: "Real-time bidirectional communication", priority: "high", estimatedDays: 3 },
      { id: "notif-5", name: "In-App Notifications", description: "Notification center, read status", priority: "medium", estimatedDays: 2 },
      { id: "notif-6", name: "Template Management", description: "Email/SMS templates, localization", priority: "low", estimatedDays: 2 }
    ]
  },
  {
    name: "Phase 8: Geolocation & Mapping (Weeks 17)",
    description: "Maps integration, geocoding, routing, distance calculation",
    tasks: [
      { id: "geo-1", name: "Maps Integration", description: "Google Maps/Mapbox setup", priority: "critical", estimatedDays: 2 },
      { id: "geo-2", name: "Geocoding Service", description: "Address ↔ coordinates", priority: "high", estimatedDays: 2 },
      { id: "geo-3", name: "Distance & Route Service", description: "Calculate distance, ETA, routes", priority: "critical", estimatedDays: 3 },
      { id: "geo-4", name: "Geofencing", description: "Service areas, zone management", priority: "medium", estimatedDays: 2 }
    ]
  },
  {
    name: "Phase 9: Support & Analytics (Weeks 18-19)",
    description: "Customer support, ticketing, analytics dashboards",
    tasks: [
      { id: "support-1", name: "Ticketing System", description: "Create, manage, resolve tickets", priority: "high", estimatedDays: 3 },
      { id: "support-2", name: "Live Chat Service", description: "Real-time support chat", priority: "medium", estimatedDays: 3 },
      { id: "support-3", name: "FAQ Management", description: "Self-service knowledge base", priority: "low", estimatedDays: 2 },
      { id: "analytics-1", name: "Booking Analytics", description: "Booking reports, peak hours", priority: "medium", estimatedDays: 3 },
      { id: "analytics-2", name: "Financial Analytics", description: "Revenue, expenses, profit", priority: "high", estimatedDays: 3 },
      { id: "analytics-3", name: "Real-time Dashboard", description: "Live metrics, system health", priority: "medium", estimatedDays: 3 }
    ]
  },
  {
    name: "Phase 10: Frontend Applications (Weeks 20-24)",
    description: "Mobile apps and web dashboards",
    tasks: [
      { id: "fe-1", name: "Passenger Mobile App", description: "React Native app for iOS/Android", priority: "critical", estimatedDays: 15 },
      { id: "fe-2", name: "Driver Web App", description: "React web app with real-time bus tracking and manifest management", priority: "critical", estimatedDays: 15 },
      { id: "fe-3", name: "Admin Dashboard", description: "React/Angular dashboard", priority: "high", estimatedDays: 10 },
      { id: "fe-4", name: "Fleet Manager Mobile App", description: "Mobile app for Volteryde staff to manage daily bus operations, inspections, charging", priority: "high", estimatedDays: 10 },
      { id: "fe-5", name: "Dispatcher Dashboard", description: "Real-time dispatch interface", priority: "high", estimatedDays: 8 },
      { id: "fe-6", name: "Customer Support Portal", description: "Support team interface", priority: "medium", estimatedDays: 5 }
    ]
  },
  {
    name: "🆕 Phase 11: Platform Enhancement - Temporal, Inkeep & Fumadocs (Weeks 25-30)",
    description: "🚀 NEW: Integrate workflow orchestration, AI support, and professional documentation (FREE TOOLS - $300K+ annual value)",
    tasks: [
      // Temporal - Workflow Orchestration (Weeks 25-27)
      { id: "temporal-1", name: "🔄 Temporal Server Setup", description: "Deploy Temporal server with Docker Compose, configure PostgreSQL backend", priority: "critical", estimatedDays: 2 },
      { id: "temporal-2", name: "🔄 Temporal SDK Integration", description: "Install @temporalio/client in NestJS services, setup Java SDK in Spring Boot", priority: "critical", estimatedDays: 2, dependencies: ["temporal-1"] },
      { id: "temporal-3", name: "🔄 Booking Workflow Implementation", description: "Create durable booking workflow (reserve → pay → confirm → notify) with automatic rollback", priority: "critical", estimatedDays: 4, dependencies: ["temporal-2"] },
      { id: "temporal-4", name: "🔄 Payment Workflows", description: "Implement wallet top-up, refund, and fare calculation workflows with retry logic", priority: "critical", estimatedDays: 3, dependencies: ["temporal-2"] },
      { id: "temporal-5", name: "🔄 Fleet Operations Workflows", description: "Build maintenance scheduling and charging session workflows (long-running 4-8 hours)", priority: "high", estimatedDays: 3, dependencies: ["temporal-2"] },
      { id: "temporal-6", name: "🔄 Driver Onboarding Workflow", description: "Implement human-in-the-loop workflow with background checks and approvals", priority: "medium", estimatedDays: 2, dependencies: ["temporal-2"] },
      { id: "temporal-7", name: "🔄 Temporal Monitoring Setup", description: "Configure Temporal UI dashboard, integrate metrics with Prometheus, setup alerts", priority: "high", estimatedDays: 2, dependencies: ["temporal-1"] },
      
      // Inkeep - AI Support (Weeks 26-28)
      { id: "inkeep-1", name: "🤖 Inkeep Account Setup", description: "Sign up at inkeep.com, create Volteryde project, get API keys", priority: "high", estimatedDays: 0.5 },
      { id: "inkeep-2", name: "🤖 Knowledge Base Upload", description: "Upload FAQs (riders, drivers), policies (cancellation, refund), user guides", priority: "high", estimatedDays: 2, dependencies: ["inkeep-1"] },
      { id: "inkeep-3", name: "🤖 AI Widget Integration - Mobile", description: "Embed Inkeep chat widget in React Native passenger and driver apps", priority: "high", estimatedDays: 2, dependencies: ["inkeep-2"] },
      { id: "inkeep-4", name: "🤖 AI Widget Integration - Web", description: "Add Inkeep to web dashboard and admin portal", priority: "medium", estimatedDays: 1, dependencies: ["inkeep-2"] },
      { id: "inkeep-5", name: "🤖 Multi-Language Support", description: "Configure auto-translation for Yoruba, Igbo, Hausa languages", priority: "medium", estimatedDays: 2, dependencies: ["inkeep-2"] },
      { id: "inkeep-6", name: "🤖 Support Ticket Integration", description: "Connect Inkeep to support system for escalation when AI can't answer", priority: "medium", estimatedDays: 2, dependencies: ["inkeep-3"] },
      { id: "inkeep-7", name: "🤖 AI Training & Optimization", description: "Import support ticket history, test accuracy, refine responses", priority: "low", estimatedDays: 3, dependencies: ["inkeep-2"] },
      
      // Fumadocs - Documentation (Weeks 27-30)
      { id: "fumadocs-1", name: "📖 Fumadocs Project Setup", description: "Create Next.js project with Fumadocs, configure branding and structure", priority: "high", estimatedDays: 1 },
      { id: "fumadocs-2", name: "📖 OpenAPI Spec Generation", description: "Create OpenAPI 3.0 specs for all API domains (booking, payment, fleet, etc.)", priority: "high", estimatedDays: 3, dependencies: ["fumadocs-1"] },
      { id: "fumadocs-3", name: "📖 Auto-Generate API Docs", description: "Use Fumadocs to auto-generate API reference from OpenAPI specs", priority: "high", estimatedDays: 2, dependencies: ["fumadocs-2"] },
      { id: "fumadocs-4", name: "📖 User Documentation", description: "Write rider guides, driver guides, fleet manager guides with step-by-step instructions", priority: "medium", estimatedDays: 4, dependencies: ["fumadocs-1"] },
      { id: "fumadocs-5", name: "📖 Internal Technical Docs", description: "Document architecture, development setup, deployment processes, coding standards", priority: "high", estimatedDays: 3, dependencies: ["fumadocs-1"] },
      { id: "fumadocs-6", name: "📖 Integration Guides", description: "Create partner integration guides with code examples (JS, Python, Java)", priority: "medium", estimatedDays: 2, dependencies: ["fumadocs-3"] },
      { id: "fumadocs-7", name: "📖 Interactive API Playground", description: "Add 'Try It Out' feature for API endpoints with authentication", priority: "low", estimatedDays: 2, dependencies: ["fumadocs-3"] },
      { id: "fumadocs-8", name: "📖 Deploy Documentation Sites", description: "Deploy to Vercel: docs.volteryde.com (API), help.volteryde.com (user guides)", priority: "high", estimatedDays: 1, dependencies: ["fumadocs-3", "fumadocs-4"] },
      { id: "fumadocs-9", name: "📖 Documentation CI/CD", description: "Setup auto-deploy on docs changes, auto-generate from OpenAPI on API updates", priority: "medium", estimatedDays: 1, dependencies: ["fumadocs-8"] }
    ]
  },
  {
    name: "Phase 12: Testing & QA (Weeks 31-33)",
    description: "Comprehensive testing and quality assurance",
    tasks: [
      { id: "test-1", name: "Unit Testing", description: "Write unit tests for all services", priority: "critical", estimatedDays: 10 },
      { id: "test-2", name: "Integration Testing", description: "Test service interactions", priority: "critical", estimatedDays: 8 },
      { id: "test-3", name: "Load Testing", description: "Performance and stress testing", priority: "high", estimatedDays: 5 },
      { id: "test-4", name: "Security Testing", description: "Penetration testing, vulnerability scans", priority: "critical", estimatedDays: 5 },
      { id: "test-5", name: "UAT", description: "User acceptance testing", priority: "high", estimatedDays: 5 },
      { id: "test-6", name: "🆕 Temporal Workflow Testing", description: "Test workflow reliability, failure recovery, compensation logic", priority: "critical", estimatedDays: 3 },
      { id: "test-7", name: "🆕 AI Support Accuracy Testing", description: "Validate Inkeep answer accuracy (target 85%+), test escalation flow", priority: "high", estimatedDays: 2 }
    ]
  },
  {
    name: "Phase 13: Deployment & Launch (Weeks 34-36)",
    description: "Production deployment and go-live with enhanced platform capabilities",
    tasks: [
      { id: "deploy-1", name: "Production Environment Setup", description: "Final production infrastructure", priority: "critical", estimatedDays: 3 },
      { id: "deploy-2", name: "Data Migration", description: "Migrate any existing data", priority: "high", estimatedDays: 2 },
      { id: "deploy-3", name: "Gradual Rollout", description: "Phased deployment strategy", priority: "high", estimatedDays: 5 },
      { id: "deploy-4", name: "Monitoring & Alerts", description: "Production monitoring setup", priority: "critical", estimatedDays: 2 },
      { id: "deploy-5", name: "Documentation", description: "API docs, runbooks, guides", priority: "high", estimatedDays: 5, dependencies: ["fumadocs-8"] },
      { id: "deploy-6", name: "Training", description: "Team training sessions", priority: "medium", estimatedDays: 3 },
      { id: "deploy-7", name: "🆕 Temporal Production Setup", description: "Deploy Temporal to production, configure high-availability, setup backups", priority: "critical", estimatedDays: 2, dependencies: ["temporal-7"] },
      { id: "deploy-8", name: "🆕 Inkeep Production Launch", description: "Enable AI support in production apps, monitor deflection rate", priority: "high", estimatedDays: 1, dependencies: ["inkeep-6"] },
      { id: "deploy-9", name: "🆕 Documentation Go-Live", description: "Launch docs.volteryde.com and help.volteryde.com with SEO optimization", priority: "high", estimatedDays: 1, dependencies: ["fumadocs-8"] }
    ]
  }
];

export function EngineeringRoadmap() {
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  const totalTasks = engineeringPhases.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const completedTasks = checkedTasks.size;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  const toggleTask = (taskId: string) => {
    const newChecked = new Set(checkedTasks);
    if (newChecked.has(taskId)) {
      newChecked.delete(taskId);
    } else {
      newChecked.add(taskId);
    }
    setCheckedTasks(newChecked);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
  };

  const totalEstimatedDays = 60; // 2 months

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-slate-900">Overall Progress</h3>
              <p className="text-slate-600 text-sm">Track your engineering team's progress</p>
            </div>
            <div className="text-right">
              <p className="text-slate-900 text-2xl">{completedTasks}/{totalTasks}</p>
              <p className="text-slate-500 text-sm">tasks completed</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-slate-500 text-sm">Total Timeline</p>
              <p className="text-slate-900">2 months</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Estimated Days</p>
              <p className="text-slate-900">{totalEstimatedDays} days</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm">Team Size</p>
              <p className="text-slate-900">22 members</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <p className="text-slate-600 text-sm">Priority:</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-slate-600">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-xs text-slate-600">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-slate-600">Low</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Phases */}
      <div className="space-y-6">
        {engineeringPhases.map((phase, phaseIdx) => {
          const phaseCompleted = phase.tasks.filter(task => checkedTasks.has(task.id)).length;
          const phaseProgress = (phaseCompleted / phase.tasks.length) * 100;
          const phaseEstimate = phase.tasks.reduce((sum, task) => sum + task.estimatedDays, 0);

          return (
            <Card key={phaseIdx} className="overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-slate-900 mb-1">{phase.name}</h4>
                    <p className="text-slate-600 text-sm">{phase.description}</p>
                  </div>
                  <Badge variant="outline">
                    {phaseCompleted}/{phase.tasks.length} tasks
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <Progress value={phaseProgress} className="flex-1 h-2" />
                  <span className="text-slate-600 text-sm whitespace-nowrap">
                    ~{phaseEstimate} days
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  {phase.tasks.map((task, taskIdx) => (
                    <div
                      key={taskIdx}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                        checkedTasks.has(task.id) ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Checkbox
                        checked={checkedTasks.has(task.id)}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h5 className={`text-slate-900 ${checkedTasks.has(task.id) ? 'line-through text-slate-500' : ''}`}>
                            {task.name}
                          </h5>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <Badge variant="outline" className="text-xs">
                              {task.estimatedDays}d
                            </Badge>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{task.description}</p>
                        {task.dependencies && task.dependencies.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <AlertCircle className="w-3 h-3" />
                            <span>Depends on: {task.dependencies.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Implementation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-slate-900">Volteryde Team (22 Members)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="p-2 text-left border-b border-slate-200">Name</th>
                    <th className="p-2 text-left border-b border-slate-200">Role</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Austin Bediako</td>
                    <td className="p-2">Founder CEO</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Theophilus Kanatey</td>
                    <td className="p-2">Chief Technology Officer</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Edmond Gbordzor</td>
                    <td className="p-2">Chief Product Officer</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Kenny Idan</td>
                    <td className="p-2">Chief Marketing Officer</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Jean Garibah</td>
                    <td className="p-2">Company Secretary</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Derrick Oware</td>
                    <td className="p-2">Backend Engineering Lead</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Mensah Kwame Anni</td>
                    <td className="p-2">Software Engineer (backend)</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Rosemary Honuvor Kwaw</td>
                    <td className="p-2">Software Engineer (backend)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Micheal Selby</td>
                    <td className="p-2">Software Engineer (backend)</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Richmond Nyamedor</td>
                    <td className="p-2">Software Engineer - Frontend (Mobile)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Richard Bright Asiedu-Bentum</td>
                    <td className="p-2">Software Engineer - Frontend (Mobile)</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Mawutor Afoh</td>
                    <td className="p-2">Software Engineer - Frontend (Web)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Caleb Adjei</td>
                    <td className="p-2">Chief Product Designer</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Francis Donkor</td>
                    <td className="p-2">Product Designer</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Kwabena Yeboah</td>
                    <td className="p-2">Product Designer</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Derrick Boateng</td>
                    <td className="p-2">Graphic Designer</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2">Michelle Fynn</td>
                    <td className="p-2">Marketing Director</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="p-2">Edward Sarfo</td>
                    <td className="p-2">Marketing Head</td>
                  </tr>
                  <tr>
                    <td className="p-2">Adorboe Prince Philips</td>
                    <td className="p-2">Marketer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-slate-900">Critical Path Items</h4>
            <ul className="text-slate-600 text-sm space-y-1">
              <li>• Infrastructure & Database setup first</li>
              <li>• Authentication before any business logic</li>
              <li>• Core bus booking flow is highest priority</li>
              <li>• Payment integration (Mobile Money) required before launch</li>
              <li>• Mobile apps parallel with backend work</li>
              <li>• Comprehensive testing before production</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
