import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Smartphone, Monitor, Users, Car, Headphones, Building2, Shield } from 'lucide-react';

const frontendApps = [
  {
    name: "Passenger Mobile App",
    platform: "React Native",
    icon: Smartphone,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    description: "iOS & Android app for passengers to discover buses and book seats on Volteryde routes",
    techStack: ["React Native", "TypeScript", "React Navigation", "Redux Toolkit", "Socket.io Client", "React Native Maps", "Axios"],
    pages: [
      { name: "Splash Screen", description: "App loading and initialization" },
      { name: "Onboarding", description: "Welcome slides explaining Volteryde bus system" },
      { name: "Sign Up / Login", description: "Authentication screens with email, phone, social login" },
      { name: "Phone Verification", description: "OTP verification screen" },
      { name: "Home / Map View", description: "Main screen with map, current location, nearby buses" },
      { name: "Bus Discovery", description: "Search for buses/routes based on GPS location and destination" },
      { name: "Available Buses List", description: "View nearby buses with real-time locations and routes" },
      { name: "Bus Details", description: "View specific bus route, stops, schedule, and ETA" },
      { name: "Seat Map View", description: "Interactive seat map showing availability per route segment" },
      { name: "Select Pickup & Drop-off Stops", description: "Choose boarding and alighting stops from route" },
      { name: "Choose Seat", description: "Select available seat for chosen segment" },
      { name: "Passenger Manifest View", description: "See confirmed passengers boarding on same route" },
      { name: "Booking Confirmation", description: "Review seat number, stops, and fare before payment" },
      { name: "Payment", description: "Secure payment processing for seat booking" },
      { name: "Booking Success", description: "Booking confirmation with seat number and journey details" },
      { name: "Track Bus Live", description: "Real-time bus location tracking on map with ETA" },
      { name: "Boarding Notification", description: "Alert when bus arrives at pickup stop with auto-detection" },
      { name: "On-Board View", description: "Live ride tracking showing current position and upcoming stops" },
      { name: "Drop-off Notification", description: "Alert approaching destination stop" },
      { name: "Ride Complete", description: "Journey summary with receipt" },
      { name: "Rate Service", description: "Rate Volteryde service experience (not driver)" },
      { name: "Booking History", description: "List of past bus bookings with details" },
      { name: "Upcoming Bookings", description: "View active and scheduled bookings" },
      { name: "Payment Methods", description: "Add/manage credit cards, mobile money, wallet" },
      { name: "Wallet", description: "View balance, add money, transaction history" },
      { name: "Profile", description: "Edit personal information, avatar upload" },
      { name: "Saved Routes", description: "Frequently used routes and stops" },
      { name: "Notifications", description: "Booking updates, bus arrival alerts" },
      { name: "Settings", description: "App preferences, notification settings" },
      { name: "Help & Support", description: "FAQs, contact support, create ticket" },
      { name: "Promotions", description: "View available promo codes and offers" },
      { name: "Referral", description: "Refer friends, view referral rewards" }
    ]
  },
  {
    name: "Driver Web App",
    platform: "React PWA",
    icon: Car,
    color: "text-green-500",
    bgColor: "bg-green-50",
    description: "Progressive web app for drivers to manage bus routes and passengers on tablets/desktop",
    techStack: ["React", "TypeScript", "React Router", "Redux Toolkit", "Socket.io Client", "Google Maps API", "Geolocation API"],
    pages: [
      { name: "Login", description: "Authentication screen for drivers" },
      { name: "Sign Up", description: "Driver registration with document upload" },
      { name: "Document Verification", description: "Upload license, insurance, vehicle docs" },
      { name: "Dashboard / Home", description: "Route overview, shift status, earnings summary" },
      { name: "Active Route Map", description: "Live GPS map with full route visualization and turn-by-turn navigation" },
      { name: "Onboarded Passengers Panel", description: "Real-time manifest showing all passengers by seat with drop-off stops" },
      { name: "Upcoming Stops", description: "Next stop highlighted with passenger count waiting to board" },
      { name: "Passenger Boarding Confirmation", description: "Auto-detected boarding notifications with manual override option" },
      { name: "Report Issue", description: "Flag passengers who fail to board or alight properly" },
      { name: "Manual Drop-off", description: "Manual confirmation if auto-detection fails" },
      { name: "Booking Notifications", description: "Live alerts for new bus bookings" },
      { name: "Route History", description: "Completed routes and trips" },
      { name: "Earnings Today", description: "Daily earnings breakdown" },
      { name: "Earnings History", description: "Weekly/monthly earnings with filters" },
      { name: "Vehicle Status", description: "Bus battery level, maintenance alerts, diagnostics" },
      { name: "Charging Stations", description: "Find nearby charging stations for electric buses" },
      { name: "Profile", description: "Edit driver information" },
      { name: "Documents", description: "View and update uploaded documents" },
      { name: "Notifications", description: "Booking alerts, system messages" },
      { name: "Settings", description: "App preferences, route settings" },
      { name: "Help & Support", description: "Contact support, emergency button" },
      { name: "Performance Stats", description: "Routes completed, boarding success rate, on-time performance" }
    ]
  },
  {
    name: "Fleet Manager Mobile App",
    platform: "React Native",
    icon: Building2,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    description: "Mobile app for Volteryde staff to oversee daily bus operations, inspections, and maintenance on the go",
    techStack: ["React Native", "TypeScript", "React Navigation", "React Query", "Zustand", "Socket.io Client", "Victory Native (Charts)", "React Native Maps"],
    pages: [
      { name: "Login", description: "Fleet manager staff authentication" },
      { name: "Dashboard Overview", description: "Daily operations summary: buses returned, inspections pending, issues" },
      { name: "My Assigned Buses", description: "List of buses assigned to this fleet manager" },
      { name: "Live Fleet Map", description: "Real-time locations of all assigned buses" },
      { name: "Daily Bus Check-In", description: "Mark buses as returned to depot/base" },
      { name: "Battery Status Monitor", description: "View battery levels for all electric buses" },
      { name: "Initiate Charging", description: "Start charging process for buses at depot" },
      { name: "Charging Sessions", description: "Track active and completed charging sessions" },
      { name: "Bus Inspection Checklist", description: "Complete daily inspection checklist: cleanliness, damage, issues" },
      { name: "Report Maintenance Issue", description: "Flag bus for maintenance with photos and description" },
      { name: "Maintenance Workflow", description: "Track reported issues and maintenance status" },
      { name: "Cleanliness Inspection", description: "Check for dirt, litter, spills and log condition" },
      { name: "Mark Bus Ready", description: "Mark inspected bus as ready for next shift" },
      { name: "End-of-Day Report", description: "Submit daily report: buses present/absent, issues, overall status" },
      { name: "Maintenance History", description: "View past maintenance and inspection records" },
      { name: "Compliance Dashboard", description: "Ensure all buses meet safety and cleanliness standards" },
      { name: "Issue Photos", description: "View and upload photos of bus issues" },
      { name: "Supervisor Notifications", description: "Alerts from admin/supervisor about urgent tasks" },
      { name: "Shift Handover", description: "Handover notes to next shift fleet manager" },
      { name: "Bus Telemetry", description: "Real-time telemetry data: battery, location, diagnostics" },
      { name: "Alerts & Notifications", description: "Maintenance alerts, low battery warnings" },
      { name: "Settings", description: "App preferences and notification settings" },
      { name: "Profile", description: "Fleet manager personal information" }
    ]
  },
  {
    name: "Customer Support Portal",
    platform: "React",
    icon: Headphones,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    description: "Web portal for support agents to handle customer inquiries",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query", "Socket.io Client", "React Table"],
    pages: [
      { name: "Login", description: "Support agent authentication" },
      { name: "Dashboard", description: "Ticket queue, pending count, agent stats" },
      { name: "Ticket List", description: "All tickets with filters, search, priority" },
      { name: "Ticket Details", description: "Full ticket view with conversation history" },
      { name: "Live Chat", description: "Real-time messaging with users" },
      { name: "Create Ticket", description: "Manually create ticket for user" },
      { name: "Assign Ticket", description: "Assign to agent or escalate" },
      { name: "Booking Lookup", description: "Search and view booking details" },
      { name: "User Lookup", description: "Search user profiles and history" },
      { name: "Issue Refund", description: "Process refunds for bookings" },
      { name: "FAQ Management", description: "Add/edit FAQ articles" },
      { name: "Canned Responses", description: "Template messages for common issues" },
      { name: "Reports", description: "Ticket volume, resolution time, CSAT" },
      { name: "Knowledge Base", description: "Internal support documentation" },
      { name: "Settings", description: "Agent preferences, notification settings" }
    ]
  },
  {
    name: "Admin Dashboard",
    platform: "React",
    icon: Shield,
    color: "text-red-500",
    bgColor: "bg-red-50",
    description: "Comprehensive admin panel for platform management",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query", "Recharts", "React Table"],
    pages: [
      { name: "Login", description: "Admin authentication with 2FA" },
      { name: "Dashboard", description: "High-level KPIs, system health" },
      { name: "Analytics Overview", description: "Platform-wide analytics and charts" },
      { name: "User Management", description: "View, search, manage all users" },
      { name: "User Details", description: "Complete user profile with activity log" },
      { name: "Driver Approvals", description: "Review and approve driver applications" },
      { name: "Vehicle Management", description: "All vehicles across all fleets" },
      { name: "Booking Management", description: "Monitor and manage all bookings" },
      { name: "Booking Details", description: "Complete booking information and timeline" },
      { name: "Payment Transactions", description: "All transactions with filters" },
      { name: "Refund Management", description: "Process and track refunds" },
      { name: "Dispute Resolution", description: "Handle payment disputes" },
      { name: "Pricing Configuration", description: "Set base fares, surge pricing rules" },
      { name: "Promo Codes", description: "Create and manage promotional codes" },
      { name: "Geofencing", description: "Define service areas and zones" },
      { name: "Partner Management", description: "Manage partner accounts" },
      { name: "Commission Settings", description: "Configure commission rates" },
      { name: "System Logs", description: "View audit logs and system events" },
      { name: "Reports", description: "Generate financial and operational reports" },
      { name: "Push Notifications", description: "Send bulk notifications to users" },
      { name: "App Configuration", description: "Feature flags, app settings" },
      { name: "Role Management", description: "Define roles and permissions" },
      { name: "Admin Users", description: "Manage admin accounts" },
      { name: "Settings", description: "System-wide configurations" }
    ]
  },
  {
    name: "Partner Dashboard",
    platform: "Next.js",
    icon: Users,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    description: "Portal for business partners and affiliates",
    techStack: ["Next.js 14", "TypeScript", "Tailwind CSS", "React Query", "Chart.js"],
    pages: [
      { name: "Login", description: "Partner authentication" },
      { name: "Dashboard", description: "Referrals, commissions, performance" },
      { name: "Referral Link", description: "Generate and share unique referral links" },
      { name: "Referrals List", description: "Track referred users and status" },
      { name: "Earnings", description: "Commission breakdown and history" },
      { name: "Payouts", description: "Request and track payouts" },
      { name: "Analytics", description: "Conversion rates, performance metrics" },
      { name: "Marketing Materials", description: "Download banners, logos, assets" },
      { name: "API Documentation", description: "Partner API docs (if applicable)" },
      { name: "Profile", description: "Partner account details" },
      { name: "Settings", description: "Payment preferences, notifications" }
    ]
  },
  {
    name: "Dispatcher Dashboard",
    platform: "React",
    icon: Monitor,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
    description: "Real-time dispatch and ride management interface",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "Socket.io Client", "Mapbox GL", "React Table"],
    pages: [
      { name: "Login", description: "Dispatcher authentication" },
      { name: "Live Map Dashboard", description: "Real-time view of all active rides and drivers" },
      { name: "Pending Requests", description: "Queue of unassigned ride requests" },
      { name: "Manual Assignment", description: "Manually assign drivers to rides" },
      { name: "Active Rides", description: "Monitor ongoing rides" },
      { name: "Driver Availability", description: "View online/offline drivers" },
      { name: "Ride History", description: "Completed rides log" },
      { name: "Emergency Override", description: "Cancel rides, reassign drivers in emergencies" },
      { name: "Broadcast Messages", description: "Send messages to drivers" },
      { name: "Settings", description: "Dispatch rules and preferences" }
    ]
  },
  {
    name: "Web Customer Portal",
    platform: "React",
    icon: Users,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    description: "Web portal for customers to book bus rides online",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query", "React Router", "Google Maps API"],
    pages: [
      { name: "Landing Page", description: "Public homepage with service overview" },
      { name: "Sign Up / Login", description: "User authentication" },
      { name: "Route Search", description: "Search buses by origin and destination" },
      { name: "Available Buses", description: "Browse available buses and schedules" },
      { name: "Seat Selection", description: "Choose seat from interactive seat map" },
      { name: "Booking Summary", description: "Review booking details before payment" },
      { name: "Payment", description: "Secure online payment processing" },
      { name: "Booking Confirmation", description: "Booking success with e-ticket download" },
      { name: "Track Live", description: "Real-time bus tracking on map" },
      { name: "My Bookings", description: "View upcoming and past bookings" },
      { name: "Cancel/Modify", description: "Cancel or reschedule bookings" },
      { name: "Profile", description: "Manage account information" },
      { name: "Payment Methods", description: "Saved payment methods" },
      { name: "Transaction History", description: "View all transactions" },
      { name: "Help Center", description: "FAQs and customer support" }
    ]
  },
  {
    name: "Station Manager App",
    platform: "React",
    icon: Car,
    color: "text-teal-500",
    bgColor: "bg-teal-50",
    description: "Web portal for charging station operators to manage charging sessions",
    techStack: ["React 18", "TypeScript", "Tailwind CSS", "React Query", "Socket.io Client", "Recharts"],
    pages: [
      { name: "Login", description: "Station manager authentication" },
      { name: "Dashboard", description: "Station overview with active sessions" },
      { name: "Charging Stations", description: "List of all charging stations under management" },
      { name: "Station Details", description: "Individual station status and metrics" },
      { name: "Active Charging Sessions", description: "Monitor ongoing charging sessions in real-time" },
      { name: "Initiate Charging", description: "Start new charging session for bus" },
      { name: "Stop Charging", description: "End charging session manually" },
      { name: "Charging History", description: "Past charging sessions with energy consumed" },
      { name: "Station Maintenance", description: "Report and track station maintenance issues" },
      { name: "Energy Monitoring", description: "Real-time energy consumption graphs" },
      { name: "Billing Summary", description: "Charging fees and revenue reports" },
      { name: "Station Availability", description: "Set station online/offline status" },
      { name: "Usage Analytics", description: "Station utilization and performance metrics" },
      { name: "Alerts & Notifications", description: "Station faults, overcurrent, emergency stops" },
      { name: "Settings", description: "Station configuration and pricing" }
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
          Complete breakdown of all user-facing applications with pages, features, and technical specifications.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Mobile Apps (React Native)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Passenger App</span>
                <Badge className="bg-blue-500">iOS & Android</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Driver App</span>
                <Badge className="bg-green-500">iOS & Android</Badge>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Web Portals (React)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Admin Dashboard</span>
                <Badge className="bg-red-500">React</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Fleet Manager</span>
                <Badge className="bg-purple-500">React</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Customer Portal</span>
                <Badge className="bg-indigo-500">React</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Driver Portal</span>
                <Badge className="bg-green-500">React PWA</Badge>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Specialized Dashboards</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Support Dashboard</span>
                <Badge className="bg-pink-500">React</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Corporate Portal</span>
                <Badge className="bg-orange-500">Next.js</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Station Manager</span>
                <Badge className="bg-teal-500">React</Badge>
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
              <p className="text-slate-900">All apps connect to:</p>
              <div className="space-y-1 text-slate-700">
                <p>• Java Auth Service: <code className="text-xs bg-white px-2 py-1 rounded">api.volteryde.com/auth</code></p>
                <p>• Java Payment Service: <code className="text-xs bg-white px-2 py-1 rounded">api.volteryde.com/payments</code></p>
                <p>• NestJS Services: <code className="text-xs bg-white px-2 py-1 rounded">api.volteryde.com/v1</code></p>
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
                        <h4 className="text-slate-900">{app.name}</h4>
                        <Badge className={app.color.replace('text-', 'bg-')}>{app.platform}</Badge>
                      </div>
                      <p className="text-slate-500 text-sm">{app.description} • {app.pages.length} pages</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {/* Tech Stack */}
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-slate-700 mb-2">Tech Stack:</p>
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
                      <p className="text-slate-700 mb-2">Pages to Build:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {app.pages.map((page, pageIdx) => (
                          <div key={pageIdx} className="p-3 bg-white border border-slate-200 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-900 text-sm">{page.name}</p>
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
              <p className="text-slate-900 mb-1">1. Login</p>
              <code className="text-xs text-slate-600">POST /auth/login</code>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-slate-900 mb-1">2. Store Token</p>
              <code className="text-xs text-slate-600">localStorage/SecureStore</code>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-slate-900 mb-1">3. Attach Header</p>
              <code className="text-xs text-slate-600">Authorization: Bearer</code>
            </div>
            <div className="bg-white p-3 rounded-lg text-center">
              <p className="text-slate-900 mb-1">4. Refresh</p>
              <code className="text-xs text-slate-600">POST /auth/refresh</code>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <p className="text-slate-700 text-sm mb-2">Protected Route Example:</p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs font-mono">
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
