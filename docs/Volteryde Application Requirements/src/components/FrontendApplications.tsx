import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Smartphone, Shield, Car, Headphones, BarChart3 } from 'lucide-react';

const frontendApps = [
  // MOBILE APPS (2)
  {
    name: "mobile-passenger-app",
    displayName: "Passenger Mobile App",
    platform: "React Native",
    icon: Smartphone,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    description: "iOS & Android app for passengers to discover buses, book seats, and track rides in real-time",
    techStack: ["React Native", "TypeScript", "React Navigation", "Redux Toolkit", "Socket.io", "React Native Maps", "Axios"],
    pages: [
      { name: "Onboarding & Auth", description: "Welcome, sign up, login, phone verification" },
      { name: "Home / Map View", description: "Main screen with map, current location, nearby buses" },
      { name: "Bus Discovery", description: "Search buses by origin/destination" },
      { name: "Seat Selection", description: "Interactive seat map with availability per segment" },
      { name: "Booking & Payment", description: "Booking confirmation and secure payment" },
      { name: "Live Tracking", description: "Real-time bus location with ETA" },
      { name: "Boarding/Drop-off", description: "Auto-detection notifications" },
      { name: "Booking History", description: "Past and upcoming bookings" },
      { name: "Wallet & Payments", description: "Wallet balance, top-up, payment methods" },
      { name: "Profile & Settings", description: "User profile, preferences, notifications" },
      { name: "Help & Support", description: "FAQs, contact support, create ticket" }
    ]
  },
  {
    name: "mobile-driver-app",
    displayName: "Driver Mobile App",
    platform: "React Native",
    icon: Car,
    color: "text-green-500",
    bgColor: "bg-green-50",
    description: "iOS & Android app for drivers to manage routes, passengers, and vehicle operations",
    techStack: ["React Native", "TypeScript", "React Navigation", "Redux Toolkit", "Socket.io", "React Native Maps", "Geolocation"],
    pages: [
      { name: "Login & Registration", description: "Driver authentication and document upload" },
      { name: "Dashboard", description: "Route overview, shift status, earnings summary" },
      { name: "Active Route Map", description: "Live GPS navigation with passenger stops" },
      { name: "Passenger Manifest", description: "Real-time list of onboarded passengers by seat" },
      { name: "Boarding Confirmation", description: "Auto-detect boarding with manual override" },
      { name: "Route Management", description: "Start/end routes, upcoming stops" },
      { name: "Earnings", description: "Daily/weekly earnings breakdown" },
      { name: "Vehicle Status", description: "Battery level, maintenance alerts, diagnostics" },
      { name: "Charging Stations", description: "Find nearby charging stations" },
      { name: "Profile & Documents", description: "Driver info, license, insurance docs" },
      { name: "Performance Stats", description: "Routes completed, on-time performance" }
    ]
  },

  // WEB APPS (4)
  {
    name: "admin-dashboard",
    displayName: "Admin Dashboard",
    platform: "React",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-50",
    description: "Comprehensive admin panel for platform-wide management, analytics, and configuration",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query", "Recharts", "React Table", "React Router"],
    pages: [
      { name: "Login (2FA)", description: "Admin authentication with two-factor authentication" },
      { name: "Dashboard Overview", description: "High-level KPIs, system health, real-time metrics" },
      { name: "Analytics", description: "Platform-wide analytics, charts, performance metrics" },
      { name: "User Management", description: "View, search, manage all users (passengers, drivers, staff)" },
      { name: "Driver Approvals", description: "Review and approve driver applications" },
      { name: "Fleet Management", description: "All vehicles across fleets, status, assignments" },
      { name: "Booking Management", description: "Monitor and manage all bookings" },
      { name: "Payment Transactions", description: "All transactions, refunds, disputes" },
      { name: "Pricing Configuration", description: "Base fares, surge pricing rules" },
      { name: "Promo Codes", description: "Create and manage promotional codes" },
      { name: "Geofencing", description: "Define service areas and operational zones" },
      { name: "System Logs", description: "Audit logs and system events" },
      { name: "Reports", description: "Financial and operational reports" },
      { name: "Role Management", description: "Define roles and permissions (RBAC)" },
      { name: "Settings", description: "System-wide configurations and feature flags" }
    ]
  },
  {
    name: "driver-app",
    displayName: "Driver Web App",
    platform: "React PWA",
    icon: Car,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    description: "Progressive web app for drivers to manage routes and operations on tablets/desktop",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "Socket.io", "Mapbox GL", "React Query", "PWA"],
    pages: [
      { name: "Login", description: "Driver authentication" },
      { name: "Dashboard", description: "Route overview, shift status, today's earnings" },
      { name: "Active Route Map", description: "Full-screen map with route and passenger stops" },
      { name: "Passenger Manifest", description: "Real-time passenger list with boarding status" },
      { name: "Boarding Management", description: "Confirm passenger boarding/drop-off" },
      { name: "Route History", description: "Completed routes and trips" },
      { name: "Earnings Dashboard", description: "Daily/weekly/monthly earnings with charts" },
      { name: "Vehicle Diagnostics", description: "Battery, maintenance alerts, system health" },
      { name: "Charging Stations", description: "Map of nearby charging stations" },
      { name: "Profile & Documents", description: "Driver profile, license, certifications" },
      { name: "Help & Support", description: "Contact support, emergency button" }
    ]
  },
  {
    name: "support-app",
    displayName: "Support App",
    platform: "React",
    icon: Headphones,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    description: "Web app for customer support agents to handle inquiries, tickets, and live chat",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query", "Socket.io", "React Table"],
    pages: [
      { name: "Login", description: "Support agent authentication" },
      { name: "Dashboard", description: "Ticket queue, pending count, agent performance" },
      { name: "Ticket List", description: "All tickets with filters (status, priority, type)" },
      { name: "Ticket Details", description: "Full ticket view with conversation history" },
      { name: "Live Chat", description: "Real-time messaging with customers" },
      { name: "Create Ticket", description: "Manually create ticket for customer" },
      { name: "Booking Lookup", description: "Search and view booking details" },
      { name: "User Lookup", description: "Search user profiles and booking history" },
      { name: "Issue Refund", description: "Process refunds for cancelled bookings" },
      { name: "FAQ Management", description: "Add/edit FAQ articles" },
      { name: "Canned Responses", description: "Template messages for common issues" },
      { name: "Reports", description: "Ticket volume, resolution time, CSAT scores" },
      { name: "Knowledge Base", description: "Internal support documentation" }
    ]
  },
  {
    name: "bi-partner-app",
    displayName: "BI Partner App",
    platform: "React",
    icon: BarChart3,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    description: "Business intelligence and partner dashboard for corporate clients and affiliates",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query", "Recharts", "D3.js"],
    pages: [
      { name: "Login", description: "Partner authentication with company branding" },
      { name: "Dashboard", description: "Key metrics, bookings, revenue, utilization" },
      { name: "Analytics Overview", description: "Interactive charts and performance metrics" },
      { name: "Booking Reports", description: "Corporate booking history and patterns" },
      { name: "Employee Management", description: "Manage corporate employee accounts" },
      { name: "Billing & Invoices", description: "View invoices, payment history, statements" },
      { name: "Usage Analytics", description: "Route utilization, peak times, cost analysis" },
      { name: "Referral Program", description: "Affiliate links, referrals, commissions" },
      { name: "Custom Reports", description: "Generate custom reports with filters" },
      { name: "Export Data", description: "Export data in CSV/Excel format" },
      { name: "API Access", description: "API keys and integration documentation" },
      { name: "Settings", description: "Company profile, payment preferences" }
    ]
  }
];

export function FrontendApplications() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Frontend Applications Overview</h3>
        <p className="text-slate-600 text-sm sm:text-base mb-4">
          6 production-ready applications: 2 mobile apps (React Native) + 4 web apps (React/PWA)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <h4 className="text-slate-900 font-semibold mb-3">📱 Mobile Apps (React Native)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">mobile-passenger-app</span>
                <Badge className="bg-blue-500">iOS & Android</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">mobile-driver-app</span>
                <Badge className="bg-green-500">iOS & Android</Badge>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
            <h4 className="text-slate-900 font-semibold mb-3">💻 Web Apps (React)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">admin-dashboard</span>
                <Badge className="bg-red-500">React</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">driver-app</span>
                <Badge className="bg-emerald-500">React PWA</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">support-app</span>
                <Badge className="bg-pink-500">React</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">bi-partner-app</span>
                <Badge className="bg-purple-500">React</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Shared Components & Libraries */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Shared Frontend Infrastructure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-slate-900 mb-3">Common Dependencies</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">TypeScript</Badge>
                <span className="text-slate-600">Type safety across all apps</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Axios</Badge>
                <span className="text-slate-600">HTTP client with interceptors</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Socket.io</Badge>
                <span className="text-slate-600">Real-time bidirectional communication</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">React Query</Badge>
                <span className="text-slate-600">Data fetching and caching</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Tailwind CSS</Badge>
                <span className="text-slate-600">Utility-first styling (web apps)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 mb-3">API Integration</h4>
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <p className="text-slate-900 font-semibold">All apps connect to:</p>
              <div className="space-y-1 text-slate-700">
                <p>• Java Auth API: <code className="text-xs bg-white px-2 py-1 rounded">api.volteryde.com/auth</code></p>
                <p>• Java Payment API: <code className="text-xs bg-white px-2 py-1 rounded">api.volteryde.com/payments</code></p>
                <p>• NestJS APIs: <code className="text-xs bg-white px-2 py-1 rounded">api.volteryde.com/v1</code></p>
                <p>• WebSocket: <code className="text-xs bg-white px-2 py-1 rounded">ws.volteryde.com</code></p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Application Details */}
      <div>
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Application Pages & Features</h3>
        <Accordion type="multiple" className="space-y-4">
          {frontendApps.map((app, idx) => {
            const Icon = app.icon;
            return (
              <AccordionItem key={idx} value={`app-${idx}`} className="border rounded-lg bg-white">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-2 rounded-lg ${app.bgColor}`}>
                      <Icon className={`w-5 h-5 ${app.color}`} />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-slate-900 font-semibold">{app.displayName}</h4>
                        <Badge className={app.color.replace('text-', 'bg-')}>{app.platform}</Badge>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">{app.description}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        <code className="bg-slate-100 px-2 py-0.5 rounded">{app.name}</code> • {app.pages.length} pages
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {/* Tech Stack */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-slate-700 mb-2 font-semibold">Tech Stack:</p>
                      <div className="flex flex-wrap gap-1">
                        {app.techStack.map((tech, techIdx) => (
                          <Badge key={techIdx} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Pages */}
                    <div>
                      <p className="text-slate-700 mb-2 font-semibold">Pages to Build:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {app.pages.map((page, pageIdx) => (
                          <div key={pageIdx} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-900 text-sm font-medium">{page.name}</p>
                                <p className="text-slate-600 text-xs mt-0.5">{page.description}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {pageIdx + 1}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Development Guidelines */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Frontend Development Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-slate-900 mb-3">Code Organization</h4>
            <div className="bg-slate-50 p-4 rounded-lg text-sm space-y-2 font-mono">
              <p className="text-slate-700">/src</p>
              <p className="text-slate-700 pl-4">/components</p>
              <p className="text-slate-700 pl-4">/pages (or /screens)</p>
              <p className="text-slate-700 pl-4">/services (API calls)</p>
              <p className="text-slate-700 pl-4">/hooks</p>
              <p className="text-slate-700 pl-4">/store (Redux/Zustand)</p>
              <p className="text-slate-700 pl-4">/utils</p>
              <p className="text-slate-700 pl-4">/types</p>
              <p className="text-slate-700 pl-4">/config</p>
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 mb-3">Best Practices</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <p>✓ Component-based architecture</p>
              <p>✓ TypeScript for type safety</p>
              <p>✓ Centralized API service layer</p>
              <p>✓ Error boundary components</p>
              <p>✓ Loading and empty states</p>
              <p>✓ Accessibility (WCAG 2.1)</p>
              <p>✓ Responsive design (mobile-first)</p>
              <p>✓ Unit tests with Jest/React Testing Library</p>
              <p>✓ E2E tests with Cypress/Playwright</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Authentication Integration */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-green-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Authentication Integration (All Apps)</h3>
        <div className="space-y-4">
          <p className="text-slate-700">
            All applications use the centralized Java Authentication Service with the following flow:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-slate-900 mb-1 font-semibold">1. Login</p>
              <code className="text-xs text-slate-600">POST /auth/login</code>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-slate-900 mb-1 font-semibold">2. Store Token</p>
              <code className="text-xs text-slate-600">localStorage/SecureStore</code>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-slate-900 mb-1 font-semibold">3. Attach Header</p>
              <code className="text-xs text-slate-600">Authorization: Bearer</code>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-slate-900 mb-1 font-semibold">4. Refresh</p>
              <code className="text-xs text-slate-600">POST /auth/refresh</code>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <p className="text-slate-700 text-sm mb-2">Protected Route Example:</p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono overflow-x-auto">
              <p>// Check token on app init</p>
              <p>const token = await getStoredToken();</p>
              <p>if (token && !isExpired(token)) {'{'}</p>
              <p className="pl-4">// Navigate to authenticated screen</p>
              <p>{'}'} else {'{'}</p>
              <p className="pl-4">// Navigate to login</p>
              <p>{'}'}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
