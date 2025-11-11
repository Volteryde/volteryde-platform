import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { FileText, Code, Shield, Lock } from 'lucide-react';

const apiEndpoints = [
  {
    service: "Authentication Service (Java)",
    baseUrl: "/auth",
    color: "bg-blue-500",
    endpoints: [
      {
        method: "POST",
        path: "/register",
        description: "Register new user account",
        auth: "None",
        request: {
          email: "string",
          password: "string",
          phone: "string",
          user_type: "PASSENGER | DRIVER | FLEET_MANAGER | PARTNER"
        },
        response: {
          user_id: "uuid",
          access_token: "string",
          refresh_token: "string"
        }
      },
      {
        method: "POST",
        path: "/login",
        description: "Authenticate user and get tokens",
        auth: "None",
        request: {
          email: "string",
          password: "string"
        },
        response: {
          access_token: "string",
          refresh_token: "string",
          expires_in: "number",
          user: "object"
        }
      },
      {
        method: "POST",
        path: "/refresh",
        description: "Refresh access token",
        auth: "Refresh Token",
        request: {
          refresh_token: "string"
        },
        response: {
          access_token: "string",
          expires_in: "number"
        }
      },
      {
        method: "POST",
        path: "/logout",
        description: "Revoke session tokens",
        auth: "Bearer Token",
        request: {},
        response: {
          message: "string"
        }
      },
      {
        method: "POST",
        path: "/verify-phone",
        description: "Send OTP to phone number",
        auth: "Bearer Token",
        request: {
          phone: "string"
        },
        response: {
          sent: "boolean",
          expires_in: "number"
        }
      },
      {
        method: "POST",
        path: "/confirm-phone",
        description: "Verify phone with OTP code",
        auth: "Bearer Token",
        request: {
          phone: "string",
          code: "string"
        },
        response: {
          verified: "boolean"
        }
      },
      {
        method: "GET",
        path: "/me",
        description: "Get current user profile",
        auth: "Bearer Token",
        request: {},
        response: {
          id: "uuid",
          email: "string",
          user_type: "string",
          profile: "object"
        }
      }
    ]
  },
  {
    service: "Payment Service (Java)",
    baseUrl: "/payments",
    color: "bg-green-500",
    endpoints: [
      {
        method: "POST",
        path: "/process",
        description: "Process payment for seat booking",
        auth: "Bearer Token",
        request: {
          booking_id: "uuid",
          payment_method_id: "string",
          amount: "number"
        },
        response: {
          transaction_id: "uuid",
          status: "SUCCESS | FAILED",
          receipt_url: "string"
        }
      },
      {
        method: "GET",
        path: "/wallet/balance",
        description: "Get user wallet balance",
        auth: "Bearer Token",
        request: {},
        response: {
          balance: "number",
          currency: "string"
        }
      },
      {
        method: "POST",
        path: "/wallet/topup",
        description: "Add funds to wallet",
        auth: "Bearer Token",
        request: {
          amount: "number",
          payment_method_id: "string"
        },
        response: {
          transaction_id: "uuid",
          new_balance: "number"
        }
      },
      {
        method: "POST",
        path: "/payment-methods",
        description: "Add payment method",
        auth: "Bearer Token",
        request: {
          type: "CARD | MOBILE_MONEY",
          token: "string (from payment provider)"
        },
        response: {
          id: "uuid",
          last4: "string",
          brand: "string"
        }
      },
      {
        method: "GET",
        path: "/transactions",
        description: "Get transaction history",
        auth: "Bearer Token",
        request: {
          page: "number",
          limit: "number",
          status: "optional filter"
        },
        response: {
          data: "array",
          total: "number",
          page: "number"
        }
      },
      {
        method: "POST",
        path: "/refunds",
        description: "Request refund for transaction",
        auth: "Bearer Token",
        request: {
          transaction_id: "uuid",
          reason: "string"
        },
        response: {
          refund_id: "uuid",
          status: "PENDING | APPROVED | REJECTED"
        }
      }
    ]
  },
  {
    service: "Bus Discovery & Booking Service (NestJS)",
    baseUrl: "/buses",
    color: "bg-purple-500",
    endpoints: [
      {
        method: "GET",
        path: "/nearby",
        description: "Find available buses/routes near passenger GPS location",
        auth: "Bearer Token",
        request: {
          lat: "number",
          lng: "number",
          destination_lat: "number (optional)",
          destination_lng: "number (optional)"
        },
        response: {
          buses: "array of bus objects",
          routes: "array",
          count: "number"
        }
      },
      {
        method: "GET",
        path: "/:bus_id/seats",
        description: "Get seat availability map for specific bus route segments",
        auth: "Bearer Token",
        request: {},
        response: {
          bus_id: "uuid",
          route: "object with all stops",
          seat_map: "array showing seat availability per segment",
          passenger_manifest: "array of confirmed passengers"
        }
      },
      {
        method: "POST",
        path: "/bookings",
        description: "Book a seat for specific route segment",
        auth: "Bearer Token",
        request: {
          bus_id: "uuid",
          seat_number: "number",
          boarding_stop_id: "uuid",
          dropoff_stop_id: "uuid"
        },
        response: {
          booking_id: "uuid",
          seat_number: "number",
          fare: "number",
          status: "PENDING_PAYMENT"
        }
      },
      {
        method: "GET",
        path: "/bookings/:id",
        description: "Get booking details",
        auth: "Bearer Token",
        request: {},
        response: {
          id: "uuid",
          passenger: "object",
          bus: "object",
          seat_number: "number",
          boarding_stop: "object",
          dropoff_stop: "object",
          status: "string",
          fare: "number"
        }
      },
      {
        method: "PUT",
        path: "/bookings/:id/board",
        description: "Auto-detect or manually confirm passenger boarding",
        auth: "Bearer Token (Driver or System)",
        request: {
          method: "AUTO | MANUAL"
        },
        response: {
          boarded: "boolean",
          boarded_at: "timestamp"
        }
      },
      {
        method: "PUT",
        path: "/bookings/:id/complete",
        description: "Auto-detect or complete drop-off and free seat",
        auth: "Bearer Token (Driver or System)",
        request: {
          method: "AUTO | MANUAL"
        },
        response: {
          completed: "boolean",
          completed_at: "timestamp",
          receipt: "object"
        }
      },
      {
        method: "GET",
        path: "/bookings/history",
        description: "Get user's booking history",
        auth: "Bearer Token",
        request: {
          page: "number",
          limit: "number"
        },
        response: {
          data: "array of booking objects",
          total: "number"
        }
      },
      {
        method: "PUT",
        path: "/bookings/:id/cancel",
        description: "Cancel seat booking",
        auth: "Bearer Token",
        request: {
          reason: "string"
        },
        response: {
          cancelled: "boolean",
          refund_amount: "number"
        }
      }
    ]
  },
  {
    service: "Driver Service (NestJS)",
    baseUrl: "/drivers",
    color: "bg-orange-500",
    endpoints: [
      {
        method: "POST",
        path: "/available",
        description: "Set driver as online/available",
        auth: "Bearer Token (Driver)",
        request: {
          location: { lat: "number", lng: "number" }
        },
        response: {
          status: "AVAILABLE",
          online_at: "timestamp"
        }
      },
      {
        method: "POST",
        path: "/offline",
        description: "Set driver as offline",
        auth: "Bearer Token (Driver)",
        request: {},
        response: {
          status: "OFFLINE",
          offline_at: "timestamp"
        }
      },
      {
        method: "PUT",
        path: "/location",
        description: "Update driver's current location",
        auth: "Bearer Token (Driver)",
        request: {
          lat: "number",
          lng: "number",
          heading: "number (optional)",
          speed: "number (optional)"
        },
        response: {
          updated: "boolean"
        }
      },
      {
        method: "GET",
        path: "/earnings",
        description: "Get driver earnings summary",
        auth: "Bearer Token (Driver)",
        request: {
          period: "today | week | month"
        },
        response: {
          total_rides: "number",
          gross_earnings: "number",
          commission: "number",
          net_earnings: "number"
        }
      },
      {
        method: "GET",
        path: "/performance",
        description: "Get driver performance metrics",
        auth: "Bearer Token (Driver)",
        request: {},
        response: {
          rating: "number",
          total_trips: "number",
          acceptance_rate: "number",
          cancellation_rate: "number"
        }
      }
    ]
  },
  {
    service: "Fleet Management Service (NestJS)",
    baseUrl: "/fleet",
    color: "bg-cyan-500",
    endpoints: [
      {
        method: "GET",
        path: "/assigned-buses",
        description: "Get buses assigned to fleet manager",
        auth: "Bearer Token (Fleet Manager Staff)",
        request: {
          status: "optional filter",
          date: "optional date"
        },
        response: {
          data: "array of assigned buses",
          total: "number"
        }
      },
      {
        method: "POST",
        path: "/check-in",
        description: "Mark bus as returned to depot",
        auth: "Bearer Token (Fleet Manager Staff)",
        request: {
          vehicle_id: "uuid",
          check_in_time: "timestamp",
          notes: "optional string"
        },
        response: {
          success: "boolean",
          check_in_id: "uuid"
        }
      },
      {
        method: "GET",
        path: "/vehicles/:id/telemetry",
        description: "Get vehicle telemetry data",
        auth: "Bearer Token (Fleet Manager)",
        request: {
          from: "timestamp",
          to: "timestamp"
        },
        response: {
          data: "array of telemetry points"
        }
      },
      {
        method: "POST",
        path: "/inspection",
        description: "Submit bus inspection report",
        auth: "Bearer Token (Fleet Manager Staff)",
        request: {
          vehicle_id: "uuid",
          cleanliness_status: "CLEAN | NEEDS_CLEANING | DIRTY",
          maintenance_issues: "array of issues",
          photos: "array of photo URLs",
          notes: "string",
          bus_ready: "boolean"
        },
        response: {
          inspection_id: "uuid",
          status: "SUBMITTED"
        }
      },
      {
        method: "POST",
        path: "/report-issue",
        description: "Report maintenance issue",
        auth: "Bearer Token (Fleet Manager Staff)",
        request: {
          vehicle_id: "uuid",
          issue_type: "string",
          description: "string",
          severity: "LOW | MEDIUM | HIGH | CRITICAL",
          photos: "array of photo URLs"
        },
        response: {
          issue_id: "uuid",
          workflow_initiated: "boolean"
        }
      },
      {
        method: "POST",
        path: "/charging/initiate",
        description: "Initiate charging for electric bus",
        auth: "Bearer Token (Fleet Manager Staff)",
        request: {
          vehicle_id: "uuid",
          station_id: "uuid",
          expected_duration: "minutes"
        },
        response: {
          session_id: "uuid",
          charging_started: "boolean"
        }
      },
      {
        method: "POST",
        path: "/daily-report",
        description: "Submit end-of-day report",
        auth: "Bearer Token (Fleet Manager Staff)",
        request: {
          report_date: "date",
          total_buses_assigned: "number",
          buses_returned: "number",
          buses_absent: "number",
          buses_inspected: "number",
          issues_reported: "number",
          summary: "string"
        },
        response: {
          report_id: "uuid",
          submitted: "boolean"
        }
      },
      {
        method: "GET",
        path: "/battery-status",
        description: "Get battery levels for all assigned buses",
        auth: "Bearer Token (Fleet Manager Staff)",
        request: {
          threshold: "optional percentage filter"
        },
        response: {
          buses: "array with battery levels",
          low_battery_count: "number"
        }
      }
    ]
  },
  {
    service: "Notification Service (NestJS)",
    baseUrl: "/notifications",
    color: "bg-yellow-500",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "Get user notifications",
        auth: "Bearer Token",
        request: {
          page: "number",
          limit: "number",
          unread_only: "boolean"
        },
        response: {
          data: "array",
          unread_count: "number",
          total: "number"
        }
      },
      {
        method: "PUT",
        path: "/:id/read",
        description: "Mark notification as read",
        auth: "Bearer Token",
        request: {},
        response: {
          read: "boolean"
        }
      },
      {
        method: "POST",
        path: "/preferences",
        description: "Update notification preferences",
        auth: "Bearer Token",
        request: {
          email_enabled: "boolean",
          sms_enabled: "boolean",
          push_enabled: "boolean"
        },
        response: {
          updated: "boolean"
        }
      }
    ]
  }
];

export function APIDocumentation() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">API Documentation & Standards</h3>
        <p className="text-slate-600 text-sm sm:text-base mb-4">
          RESTful API design with consistent patterns, comprehensive error handling, and OpenAPI/Swagger documentation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Base URLs</h4>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500">Java</Badge>
                <code>api.volteryde.com/auth</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500">Java</Badge>
                <code>api.volteryde.com/payments</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500">NestJS</Badge>
                <code>api.volteryde.com/v1/*</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">WS</Badge>
                <code>ws.volteryde.com</code>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Authentication</h4>
            <div className="space-y-1 text-xs">
              <p className="text-slate-700">All protected endpoints require:</p>
              <div className="bg-slate-50 p-2 rounded font-mono">
                Authorization: Bearer {'<token>'}
              </div>
              <p className="text-slate-600 mt-2">Token expires in 1 hour. Use refresh token to get new access token.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Response Format</h4>
            <div className="space-y-1 text-xs">
              <p className="text-slate-700">Standard response structure:</p>
              <div className="bg-slate-50 p-2 rounded font-mono text-xs">
                {'{'}<br/>
                &nbsp;&nbsp;"success": boolean,<br/>
                &nbsp;&nbsp;"data": object | array,<br/>
                &nbsp;&nbsp;"message": string,<br/>
                &nbsp;&nbsp;"errors": array<br/>
                {'}'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* HTTP Status Codes */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">HTTP Status Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <Badge className="bg-green-500 mb-2">2xx Success</Badge>
            <div className="space-y-1 text-xs text-slate-700">
              <p><code className="bg-white px-2 py-0.5 rounded">200</code> OK - Success</p>
              <p><code className="bg-white px-2 py-0.5 rounded">201</code> Created - Resource created</p>
              <p><code className="bg-white px-2 py-0.5 rounded">204</code> No Content - Success, no body</p>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <Badge className="bg-yellow-500 mb-2">4xx Client Errors</Badge>
            <div className="space-y-1 text-xs text-slate-700">
              <p><code className="bg-white px-2 py-0.5 rounded">400</code> Bad Request - Invalid input</p>
              <p><code className="bg-white px-2 py-0.5 rounded">401</code> Unauthorized - Auth required</p>
              <p><code className="bg-white px-2 py-0.5 rounded">403</code> Forbidden - No permission</p>
              <p><code className="bg-white px-2 py-0.5 rounded">404</code> Not Found - Resource missing</p>
              <p><code className="bg-white px-2 py-0.5 rounded">429</code> Too Many Requests - Rate limited</p>
            </div>
          </div>

          <div className="bg-red-50 p-3 rounded-lg">
            <Badge className="bg-red-500 mb-2">5xx Server Errors</Badge>
            <div className="space-y-1 text-xs text-slate-700">
              <p><code className="bg-white px-2 py-0.5 rounded">500</code> Internal Server Error</p>
              <p><code className="bg-white px-2 py-0.5 rounded">502</code> Bad Gateway</p>
              <p><code className="bg-white px-2 py-0.5 rounded">503</code> Service Unavailable</p>
              <p><code className="bg-white px-2 py-0.5 rounded">504</code> Gateway Timeout</p>
            </div>
          </div>
        </div>
      </Card>

      {/* API Endpoints */}
      <div>
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">API Endpoints by Service</h3>
        <Accordion type="multiple" className="space-y-4">
          {apiEndpoints.map((service, idx) => (
            <AccordionItem key={idx} value={`service-${idx}`} className="border rounded-lg bg-white">
              <AccordionTrigger className="px-6 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${service.color} text-white`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-slate-900">{service.service}</h4>
                    <p className="text-slate-500 text-sm">{service.baseUrl} • {service.endpoints.length} endpoints</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4">
                  {service.endpoints.map((endpoint, endpointIdx) => (
                    <Card key={endpointIdx} className="p-4 bg-slate-50">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge className={
                          endpoint.method === 'GET' ? 'bg-blue-500' :
                          endpoint.method === 'POST' ? 'bg-green-500' :
                          endpoint.method === 'PUT' ? 'bg-orange-500' :
                          'bg-red-500'
                        }>
                          {endpoint.method}
                        </Badge>
                        <div className="flex-1">
                          <code className="text-sm text-slate-900">{service.baseUrl}{endpoint.path}</code>
                          <p className="text-slate-600 text-xs mt-1">{endpoint.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {endpoint.auth === 'None' ? (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" /> No Auth
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" /> {endpoint.auth}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-slate-700 text-xs mb-1">Request:</p>
                          <div className="bg-slate-900 text-slate-100 p-2 rounded text-xs font-mono">
                            <pre>{JSON.stringify(endpoint.request, null, 2)}</pre>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-700 text-xs mb-1">Response:</p>
                          <div className="bg-slate-900 text-slate-100 p-2 rounded text-xs font-mono">
                            <pre>{JSON.stringify(endpoint.response, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* API Documentation Tools */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">API Documentation Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Java Services</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Swagger UI</Badge>
                <span className="text-slate-600 text-xs">SpringDoc OpenAPI</span>
              </div>
              <p className="text-xs text-slate-600">Access at: <code className="bg-white px-1 rounded">/swagger-ui.html</code></p>
              <p className="text-xs text-slate-600">OpenAPI spec: <code className="bg-white px-1 rounded">/v3/api-docs</code></p>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">NestJS Services</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Swagger UI</Badge>
                <span className="text-slate-600 text-xs">@nestjs/swagger</span>
              </div>
              <p className="text-xs text-slate-600">Access at: <code className="bg-white px-1 rounded">/api/docs</code></p>
              <p className="text-xs text-slate-600">OpenAPI spec: <code className="bg-white px-1 rounded">/api/docs-json</code></p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Testing Tools</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Postman</Badge>
                <span className="text-slate-600 text-xs">Collection available</span>
              </div>
              <p className="text-xs text-slate-600">Import OpenAPI spec into Postman for automated collection</p>
            </div>
          </div>
        </div>
      </Card>

      {/* WebSocket Documentation */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">WebSocket Events</h3>
        <p className="text-slate-600 text-sm sm:text-base mb-4 text-sm">
          Real-time bidirectional communication for live tracking, ride updates, and notifications
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-3">Client → Server Events</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <code className="text-purple-600">driver:location:update</code>
                <p className="text-slate-600 mt-1">Update driver's current location</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <code className="text-purple-600">ride:subscribe</code>
                <p className="text-slate-600 mt-1">Subscribe to ride updates</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <code className="text-purple-600">driver:available</code>
                <p className="text-slate-600 mt-1">Driver goes online</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-3">Server → Client Events</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <code className="text-blue-600">ride:request</code>
                <p className="text-slate-600 mt-1">New ride request for driver</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <code className="text-blue-600">ride:status:changed</code>
                <p className="text-slate-600 mt-1">Ride status update</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <code className="text-blue-600">driver:location</code>
                <p className="text-slate-600 mt-1">Real-time driver location</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <code className="text-blue-600">notification</code>
                <p className="text-slate-600 mt-1">Push notification to client</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Rate Limiting */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Rate Limiting</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <h5 className="text-slate-900 mb-2">Authenticated Users</h5>
            <p className="text-xs text-slate-600">1000 requests / hour</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <h5 className="text-slate-900 mb-2">Unauthenticated</h5>
            <p className="text-xs text-slate-600">100 requests / hour</p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <h5 className="text-slate-900 mb-2">WebSocket</h5>
            <p className="text-xs text-slate-600">Location updates: 1 / second</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Rate limit headers included in all responses: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>
        </p>
      </Card>
    </div>
  );
}
