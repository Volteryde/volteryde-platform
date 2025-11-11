import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Database, Shield, Activity, FileText, Users, Car, CreditCard, MapPin, Bell } from 'lucide-react';

const databaseSchema = [
  {
    schema: "authentication",
    icon: Shield,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    description: "Centralized authentication and authorization",
    tables: [
      {
        name: "users",
        fields: ["id (UUID)", "email (unique)", "phone (unique)", "password_hash", "user_type (enum)", "status", "email_verified", "phone_verified", "created_at", "updated_at", "deleted_at"],
        relationships: ["Has many: sessions, user_roles, login_history"],
        indexes: ["email", "phone", "user_type", "status"]
      },
      {
        name: "roles",
        fields: ["id", "name", "description", "permissions (JSONB)", "created_at", "updated_at"],
        relationships: ["Has many: user_roles"],
        indexes: ["name"]
      },
      {
        name: "user_roles",
        fields: ["id", "user_id (FK)", "role_id (FK)", "assigned_by", "assigned_at", "expires_at"],
        relationships: ["Belongs to: users, roles"],
        indexes: ["user_id", "role_id"]
      },
      {
        name: "sessions",
        fields: ["id (UUID)", "user_id (FK)", "token_hash", "device_info (JSONB)", "ip_address", "expires_at", "created_at", "revoked_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id", "token_hash", "expires_at"]
      },
      {
        name: "oauth_providers",
        fields: ["id", "user_id (FK)", "provider", "provider_user_id", "access_token", "refresh_token", "created_at", "updated_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id", "provider"]
      },
      {
        name: "audit_logs",
        fields: ["id", "user_id", "action", "resource_type", "resource_id", "ip_address", "user_agent", "changes (JSONB)", "timestamp"],
        relationships: [],
        indexes: ["user_id", "action", "resource_type", "timestamp"]
      }
    ]
  },
  {
    schema: "user_profiles",
    icon: Users,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    description: "User profile information for all user types",
    tables: [
      {
        name: "passenger_profiles",
        fields: ["id", "user_id (FK unique)", "first_name", "last_name", "avatar_url", "date_of_birth", "preferences (JSONB)", "emergency_contact (JSONB)", "created_at", "updated_at"],
        relationships: ["Belongs to: users", "Has many: addresses, payment_methods"],
        indexes: ["user_id"]
      },
      {
        name: "driver_profiles",
        fields: ["id", "user_id (FK unique)", "first_name", "last_name", "avatar_url", "license_number", "license_expiry", "vehicle_id (FK)", "status", "rating", "total_trips", "acceptance_rate", "created_at", "updated_at"],
        relationships: ["Belongs to: users, vehicles", "Has many: documents, earnings"],
        indexes: ["user_id", "vehicle_id", "status"]
      },
      {
        name: "fleet_manager_profiles",
        fields: ["id", "user_id (FK unique)", "first_name", "last_name", "employee_id", "department", "shift", "avatar_url", "created_at", "updated_at"],
        relationships: ["Belongs to: users", "Has many: bus_assignments, inspection_reports, daily_reports"],
        indexes: ["user_id", "employee_id"]
      },
      {
        name: "partner_profiles",
        fields: ["id", "user_id (FK unique)", "partner_type", "business_name", "business_registration", "contact_person", "avatar_url", "commission_rate", "status", "created_at", "updated_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id", "partner_type", "status"]
      },
      {
        name: "addresses",
        fields: ["id", "user_id (FK)", "label", "address_line1", "address_line2", "city", "state", "country", "postal_code", "latitude", "longitude", "is_default", "created_at", "updated_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id", "is_default", "location (PostGIS)"]
      }
    ]
  },
  {
    schema: "bus_bookings",
    icon: MapPin,
    color: "text-green-500",
    bgColor: "bg-green-50",
    description: "Bus seat booking and route segment management",
    tables: [
      {
        name: "routes",
        fields: ["id (UUID)", "name", "code", "start_location", "end_location", "total_stops", "active", "created_at", "updated_at"],
        relationships: ["Has many: route_stops, buses, bookings"],
        indexes: ["code", "active"]
      },
      {
        name: "route_stops",
        fields: ["id (UUID)", "route_id (FK)", "stop_name", "location (PostGIS POINT)", "stop_order", "arrival_time_offset", "created_at", "updated_at"],
        relationships: ["Belongs to: routes"],
        indexes: ["route_id", "stop_order", "location"]
      },
      {
        name: "buses",
        fields: ["id (UUID)", "vehicle_id (FK)", "route_id (FK)", "driver_id (FK)", "total_seats", "status", "current_location (PostGIS POINT)", "next_stop_id (FK)", "schedule_start", "schedule_end", "created_at", "updated_at"],
        relationships: ["Belongs to: vehicles, routes, drivers", "Has many: bookings"],
        indexes: ["route_id", "driver_id", "status", "current_location"]
      },
      {
        name: "bookings",
        fields: ["id (UUID)", "passenger_id (FK)", "bus_id (FK)", "seat_number", "boarding_stop_id (FK)", "dropoff_stop_id (FK)", "status", "fare", "payment_method", "boarded_at", "completed_at", "booking_time", "created_at", "updated_at"],
        relationships: ["Belongs to: passengers, buses, route_stops (boarding & dropoff)", "Has many: booking_events, seat_segments"],
        indexes: ["passenger_id", "bus_id", "status", "created_at", "boarding_stop_id", "dropoff_stop_id"]
      },
      {
        name: "seat_segments",
        fields: ["id (UUID)", "booking_id (FK)", "seat_number", "from_stop_id (FK)", "to_stop_id (FK)", "is_occupied", "created_at"],
        relationships: ["Belongs to: bookings, route_stops"],
        indexes: ["booking_id", "seat_number", "from_stop_id", "to_stop_id"]
      },
      {
        name: "booking_events",
        fields: ["id", "booking_id (FK)", "event_type", "timestamp", "location (PostGIS)", "detection_method", "metadata (JSONB)"],
        relationships: ["Belongs to: bookings"],
        indexes: ["booking_id", "event_type", "timestamp"]
      },
      {
        name: "bus_locations",
        fields: ["id", "bus_id (FK)", "driver_id (FK)", "location (PostGIS)", "speed", "heading", "accuracy", "timestamp"],
        relationships: ["Belongs to: buses, drivers"],
        indexes: ["bus_id", "driver_id", "timestamp", "location"]
      },
      {
        name: "service_ratings",
        fields: ["id", "booking_id (FK unique)", "rating", "comment", "service_quality", "bus_condition", "rated_at"],
        relationships: ["Belongs to: bookings"],
        indexes: ["booking_id", "rating"]
      }
    ]
  },
  {
    schema: "fleet",
    icon: Car,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    description: "Vehicle and fleet management",
    tables: [
      {
        name: "vehicles",
        fields: ["id", "vin", "license_plate", "make", "model", "year", "color", "vehicle_type", "battery_capacity", "status", "current_location (PostGIS)", "owned_by", "created_at", "updated_at"],
        relationships: ["Has many: maintenance_records, telemetry, bus_assignments, inspection_reports"],
        indexes: ["license_plate", "status"]
      },
      {
        name: "vehicle_telemetry",
        fields: ["id", "vehicle_id (FK)", "battery_level", "speed", "location (PostGIS)", "odometer", "temperature", "diagnostics (JSONB)", "timestamp"],
        relationships: ["Belongs to: vehicles"],
        indexes: ["vehicle_id", "timestamp"]
      },
      {
        name: "maintenance_records",
        fields: ["id", "vehicle_id (FK)", "maintenance_type", "description", "cost", "odometer_reading", "performed_by", "performed_at", "next_maintenance_date", "created_at"],
        relationships: ["Belongs to: vehicles"],
        indexes: ["vehicle_id", "performed_at", "next_maintenance_date"]
      },
      {
        name: "charging_stations",
        fields: ["id", "name", "location (PostGIS)", "address", "total_slots", "available_slots", "charging_speed", "price_per_kwh", "operator", "status", "created_at", "updated_at"],
        relationships: ["Has many: charging_sessions"],
        indexes: ["location", "status"]
      },
      {
        name: "charging_sessions",
        fields: ["id", "vehicle_id (FK)", "station_id (FK)", "initiated_by (FK)", "start_time", "end_time", "energy_consumed", "cost", "status"],
        relationships: ["Belongs to: vehicles, charging_stations"],
        indexes: ["vehicle_id", "station_id", "start_time"]
      },
      {
        name: "bus_assignments",
        fields: ["id", "vehicle_id (FK)", "fleet_manager_id (FK)", "assigned_date", "status", "created_at"],
        relationships: ["Belongs to: vehicles, fleet_managers"],
        indexes: ["vehicle_id", "fleet_manager_id", "assigned_date"]
      },
      {
        name: "inspection_reports",
        fields: ["id", "vehicle_id (FK)", "fleet_manager_id (FK)", "inspection_date", "cleanliness_status", "maintenance_issues (JSONB)", "photos (JSONB)", "notes", "bus_ready", "created_at"],
        relationships: ["Belongs to: vehicles, fleet_managers"],
        indexes: ["vehicle_id", "fleet_manager_id", "inspection_date"]
      },
      {
        name: "daily_reports",
        fields: ["id", "fleet_manager_id (FK)", "report_date", "total_buses_assigned", "buses_returned", "buses_absent", "buses_inspected", "issues_reported", "summary", "created_at"],
        relationships: ["Belongs to: fleet_managers"],
        indexes: ["fleet_manager_id", "report_date"]
      },
      {
        name: "maintenance_issues",
        fields: ["id", "vehicle_id (FK)", "reported_by (FK)", "issue_type", "description", "severity", "photos (JSONB)", "status", "resolved_at", "created_at"],
        relationships: ["Belongs to: vehicles, fleet_managers (reported_by)"],
        indexes: ["vehicle_id", "reported_by", "status", "created_at"]
      }
    ]
  },
  {
    schema: "payments",
    icon: CreditCard,
    color: "text-red-500",
    bgColor: "bg-red-50",
    description: "Payment processing and financial transactions",
    tables: [
      {
        name: "payment_methods",
        fields: ["id", "user_id (FK)", "type", "provider", "provider_payment_method_id", "last4", "brand", "expiry_month", "expiry_year", "is_default", "created_at", "updated_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id", "is_default"]
      },
      {
        name: "transactions",
        fields: ["id (UUID)", "user_id (FK)", "booking_id (FK)", "type", "amount", "currency", "status", "payment_method_id (FK)", "provider_transaction_id", "metadata (JSONB)", "created_at", "updated_at"],
        relationships: ["Belongs to: users, bookings, payment_methods"],
        indexes: ["user_id", "booking_id", "status", "created_at"]
      },
      {
        name: "wallets",
        fields: ["id", "user_id (FK unique)", "balance", "currency", "created_at", "updated_at"],
        relationships: ["Belongs to: users", "Has many: wallet_transactions"],
        indexes: ["user_id"]
      },
      {
        name: "wallet_transactions",
        fields: ["id", "wallet_id (FK)", "type", "amount", "balance_before", "balance_after", "reference_type", "reference_id", "description", "created_at"],
        relationships: ["Belongs to: wallets"],
        indexes: ["wallet_id", "created_at"]
      },
      {
        name: "invoices",
        fields: ["id", "transaction_id (FK)", "invoice_number", "user_id (FK)", "amount", "tax", "total", "pdf_url", "status", "issued_at", "due_at", "paid_at"],
        relationships: ["Belongs to: transactions, users"],
        indexes: ["transaction_id", "user_id", "invoice_number"]
      },
      {
        name: "refunds",
        fields: ["id", "transaction_id (FK)", "amount", "reason", "status", "processed_by", "processed_at", "created_at"],
        relationships: ["Belongs to: transactions"],
        indexes: ["transaction_id", "status"]
      },
      {
        name: "driver_earnings",
        fields: ["id", "driver_id (FK)", "bus_id (FK)", "route_id (FK)", "date", "total_bookings", "gross_amount", "commission", "net_amount", "status", "paid_at", "created_at"],
        relationships: ["Belongs to: drivers, buses, routes"],
        indexes: ["driver_id", "status", "date", "created_at"]
      }
    ]
  },
  {
    schema: "notifications",
    icon: Bell,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
    description: "Notification and communication management",
    tables: [
      {
        name: "notifications",
        fields: ["id", "user_id (FK)", "type", "channel", "title", "message", "data (JSONB)", "read_at", "created_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id", "read_at", "created_at"]
      },
      {
        name: "notification_preferences",
        fields: ["id", "user_id (FK unique)", "email_enabled", "sms_enabled", "push_enabled", "notification_types (JSONB)", "updated_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id"]
      },
      {
        name: "push_tokens",
        fields: ["id", "user_id (FK)", "token", "platform", "device_id", "created_at", "updated_at"],
        relationships: ["Belongs to: users"],
        indexes: ["user_id", "token"]
      }
    ]
  },
  {
    schema: "support",
    icon: FileText,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    description: "Customer support and ticketing",
    tables: [
      {
        name: "tickets",
        fields: ["id", "user_id (FK)", "ride_id (FK)", "category", "priority", "subject", "description", "status", "assigned_to", "created_at", "updated_at", "resolved_at"],
        relationships: ["Belongs to: users, rides", "Has many: ticket_messages, ticket_attachments"],
        indexes: ["user_id", "status", "priority", "created_at"]
      },
      {
        name: "ticket_messages",
        fields: ["id", "ticket_id (FK)", "sender_id (FK)", "message", "created_at"],
        relationships: ["Belongs to: tickets, users"],
        indexes: ["ticket_id", "created_at"]
      },
      {
        name: "ticket_attachments",
        fields: ["id", "ticket_id (FK)", "message_id (FK)", "file_url", "file_type", "file_size", "created_at"],
        relationships: ["Belongs to: tickets, ticket_messages"],
        indexes: ["ticket_id", "message_id"]
      },
      {
        name: "faqs",
        fields: ["id", "category", "question", "answer", "order", "views", "helpful_count", "created_at", "updated_at"],
        relationships: [],
        indexes: ["category", "order"]
      }
    ]
  },
  {
    schema: "analytics",
    icon: Activity,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    description: "Analytics and reporting data",
    tables: [
      {
        name: "driver_performance",
        fields: ["id", "driver_id (FK)", "date", "total_rides", "completed_rides", "cancelled_rides", "total_earnings", "average_rating", "acceptance_rate", "online_hours"],
        relationships: ["Belongs to: drivers"],
        indexes: ["driver_id", "date"]
      },
      {
        name: "ride_analytics",
        fields: ["id", "date", "total_rides", "completed_rides", "cancelled_rides", "total_revenue", "average_fare", "peak_hours (JSONB)", "popular_routes (JSONB)"],
        relationships: [],
        indexes: ["date"]
      },
      {
        name: "financial_reports",
        fields: ["id", "report_type", "period_start", "period_end", "total_revenue", "total_expenses", "net_profit", "data (JSONB)", "generated_at"],
        relationships: [],
        indexes: ["report_type", "period_start"]
      }
    ]
  }
];

export function DatabaseArchitecture() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Database Architecture Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-slate-900 mb-3">Core Principles</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-blue-500" />
                <div>
                  <p className="text-slate-900">Centralized Authentication</p>
                  <p className="text-slate-600 text-xs">Single source of truth for all user authentication across apps</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Database className="w-4 h-4 mt-0.5 text-green-500" />
                <div>
                  <p className="text-slate-900">Schema Separation</p>
                  <p className="text-slate-600 text-xs">Logical separation by domain for better organization</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 mt-0.5 text-purple-500" />
                <div>
                  <p className="text-slate-900">Full Audit Trail</p>
                  <p className="text-slate-600 text-xs">Every critical action is logged for compliance and security</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 text-orange-500" />
                <div>
                  <p className="text-slate-900">Data Integrity</p>
                  <p className="text-slate-600 text-xs">Foreign keys, constraints, and transactions ensure consistency</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 mb-3">Technical Specifications</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-slate-700 text-sm">Primary Database</span>
                <Badge>PostgreSQL 15+</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-slate-700 text-sm">Geospatial Extension</span>
                <Badge>PostGIS 3.3+</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-slate-700 text-sm">Time-series Data</span>
                <Badge>TimescaleDB</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-slate-700 text-sm">Caching Layer</span>
                <Badge>Redis</Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <span className="text-slate-700 text-sm">Connection Pooling</span>
                <Badge>PgBouncer</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Authentication Flow */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Unified Authentication Architecture</h3>
        <p className="text-slate-600 text-sm sm:text-base mb-4">
          All applications (Passenger, Driver, Fleet Manager, Partner, Admin, Support) use the same authentication service with role-based access control.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-slate-900 mb-2">User Types</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• PASSENGER</p>
              <p>• DRIVER</p>
              <p>• FLEET_MANAGER</p>
              <p>• PARTNER</p>
              <p>• ADMIN</p>
              <p>• SUPPORT_AGENT</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="text-slate-900 mb-2">Authentication Methods</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• Email + Password</p>
              <p>• Phone + OTP</p>
              <p>• Google OAuth</p>
              <p>• Facebook OAuth</p>
              <p>• Apple Sign In</p>
              <p>• 2FA (SMS/TOTP)</p>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="text-slate-900 mb-2">Security Features</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• JWT with refresh tokens</p>
              <p>• Session management</p>
              <p>• Device tracking</p>
              <p>• Rate limiting</p>
              <p>• Password policies</p>
              <p>• Audit logging</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Schema Details */}
      <div>
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Database Schemas</h3>
        <Accordion type="multiple" className="space-y-4">
          {databaseSchema.map((schema, idx) => {
            const Icon = schema.icon;
            return (
              <AccordionItem key={idx} value={`schema-${idx}`} className="border rounded-lg bg-white">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${schema.bgColor}`}>
                      <Icon className={`w-5 h-5 ${schema.color}`} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-slate-900">{schema.schema}</h4>
                      <p className="text-slate-500 text-sm">{schema.description} • {schema.tables.length} tables</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-4">
                    {schema.tables.map((table, tableIdx) => (
                      <Card key={tableIdx} className="p-4 bg-slate-50">
                        <h5 className="text-slate-900 mb-3">{table.name}</h5>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-slate-600 text-xs mb-1">Fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {table.fields.map((field, fieldIdx) => (
                                <Badge key={fieldIdx} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {table.relationships.length > 0 && (
                            <div>
                              <p className="text-slate-600 text-xs mb-1">Relationships:</p>
                              <div className="flex flex-wrap gap-1">
                                {table.relationships.map((rel, relIdx) => (
                                  <Badge key={relIdx} variant="outline" className="text-xs">
                                    {rel}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-slate-600 text-xs mb-1">Indexes:</p>
                            <div className="flex flex-wrap gap-1">
                              {table.indexes.map((index, indexIdx) => (
                                <Badge key={indexIdx} className="text-xs bg-purple-100 text-purple-700">
                                  {index}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Data Flow & Security */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Data Flow & Security Measures</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-slate-900 mb-3">Data Flow Pattern</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-slate-900 mb-1">1. Request Authentication</p>
                <p className="text-slate-600 text-xs">Every API request validated against auth.sessions table</p>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <p className="text-slate-900 mb-1">2. Authorization Check</p>
                <p className="text-slate-600 text-xs">User roles and permissions verified from auth.user_roles</p>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-slate-900 mb-1">3. Business Logic</p>
                <p className="text-slate-600 text-xs">Microservice processes request with database transactions</p>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <p className="text-slate-900 mb-1">4. Audit Logging</p>
                <p className="text-slate-600 text-xs">All changes recorded in auth.audit_logs</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 mb-3">Security Measures</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge className="bg-green-500">✓</Badge>
                <div>
                  <p className="text-slate-900">Encryption at Rest</p>
                  <p className="text-slate-600 text-xs">AES-256 encryption for sensitive fields</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-500">✓</Badge>
                <div>
                  <p className="text-slate-900">Row-Level Security</p>
                  <p className="text-slate-600 text-xs">PostgreSQL RLS policies on all tables</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-500">✓</Badge>
                <div>
                  <p className="text-slate-900">Soft Deletes</p>
                  <p className="text-slate-600 text-xs">deleted_at timestamps for data recovery</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-500">✓</Badge>
                <div>
                  <p className="text-slate-900">Connection Security</p>
                  <p className="text-slate-600 text-xs">SSL/TLS for all database connections</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Badge className="bg-green-500">✓</Badge>
                <div>
                  <p className="text-slate-900">Backup Strategy</p>
                  <p className="text-slate-600 text-xs">Automated backups every 6 hours, 30-day retention</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Migration Strategy */}
      <Card className="p-6 bg-slate-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Database Migration & Versioning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-slate-900 mb-2">Migration Tools</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• Java: Flyway / Liquibase</p>
              <p>• NestJS: TypeORM Migrations</p>
              <p>• Version control for all schema changes</p>
              <p>• Rollback scripts for every migration</p>
            </div>
          </div>
          <div>
            <h4 className="text-slate-900 mb-2">Best Practices</h4>
            <div className="space-y-1 text-sm text-slate-700">
              <p>• Never modify existing migrations</p>
              <p>• Test migrations on staging first</p>
              <p>• Zero-downtime deployment strategy</p>
              <p>• Automated schema validation</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
