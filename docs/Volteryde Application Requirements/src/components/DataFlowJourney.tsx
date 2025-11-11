import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Smartphone, 
  Car, 
  Users, 
  ShieldCheck, 
  Database, 
  CheckCircle, 
  MapPin,
  CreditCard,
  Bell,
  Radio,
  ArrowRight,
  ArrowDown,
  UserCheck,
  Navigation,
  Clock,
  MessageSquare,
  Settings,
  BarChart3,
  Truck,
  Headphones,
  Layers,
  Bus,
  Wallet,
  Route,
  Users2,
  LogIn,
  Locate,
  Calendar,
  X,
  Vibrate,
  Eye,
  MapPinned,
  Armchair,
  Repeat,
  TrendingUp,
  Activity,
  AlertCircle,
  CircleDot
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function DataFlowJourney() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-slate-900 mb-2">Data Flow & User Journey</h2>
        <p className="text-slate-600">
          Complete visualization of Volteryde's revolutionary electric bus system with dynamic seat substitution and location-based auto-detection
        </p>
      </div>

      <Tabs defaultValue="passenger-flow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="passenger-flow">Passenger Journey</TabsTrigger>
          <TabsTrigger value="driver-flow">Driver Journey</TabsTrigger>
          <TabsTrigger value="seat-algorithm">Seat Substitution</TabsTrigger>
          <TabsTrigger value="data-flow">Data Flow</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Events</TabsTrigger>
        </TabsList>

        {/* Passenger Journey */}
        <TabsContent value="passenger-flow" className="space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-slate-900">Passenger Journey Flow</h3>
                <p className="text-slate-600 text-sm">From authentication to ride completion with dynamic seat booking and location-based detection</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1: Authentication */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                    1
                  </div>
                  <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Authentication</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Passenger Mobile, Driver Web App
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> Auth Service → User Service
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Data:</span> JWT token, profile loaded from PostgreSQL
                  </p>
                </div>
              </div>

              {/* Step 2: Bus and Seat Discovery */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                    2
                  </div>
                  <Armchair className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Bus & Seat Discovery</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Passenger Mobile
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> Geospatial Service → Bus Discovery Service → Seat Map Service → Map API
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Data:</span> Current location, available buses, <span className="font-semibold text-purple-700">dynamic seat availability per route segment</span>, passenger manifest (via Redis/PostGIS and PostgreSQL)
                  </p>
                </div>
              </div>

              {/* Step 3: Single Seat Booking */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">
                    3
                  </div>
                  <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Seat Booking</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Passenger Mobile
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> Ride Reservation Service → Seat Booking Service → Payment Service
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Data:</span> User selects <span className="font-semibold">1 seat</span> for specific boarding and drop-off stops, system locks seat for that segment only, payment processed (stored in PostgreSQL)
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">UI:</span> User sees selected seat number, boarding stop, drop-off stop, and booking confirmation
                  </p>
                </div>
              </div>

              {/* Step 4: Booking Notification to Driver */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                    4
                  </div>
                  <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Driver Notification</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Driver Web App
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> Notification Service → WebSocket or Push
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Data:</span> New booking notification sent to driver, passenger added to manifest with boarding stop, drop-off stop, and seat number visible
                  </p>
                </div>
              </div>

              {/* Step 5: Bus Approaching Stop */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex-shrink-0">
                    5
                  </div>
                  <MapPin className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Approaching Stop</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Driver Web App / Passenger Mobile
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">UI:</span> Driver sees map with route and passengers waiting at next stop highlighted; Passenger receives notification "Bus arriving in 3 minutes"
                  </p>
                </div>
              </div>

              {/* Step 6: Auto-Detection Boarding */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex-shrink-0">
                    6
                  </div>
                  <Locate className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Auto-Detect Boarding</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Driver Web App, Passenger Mobile
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Process:</span> <span className="font-semibold text-indigo-700">Backend algorithm uses location services and geofencing</span> to automatically detect when passenger boards the bus
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> Boarding Detection Service → Location Service → Geofence Validation → Manifest Service
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Data:</span> Passenger location matched with bus location at stop; status automatically updated to "ON_BOARD" (Redis/PostgreSQL)
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Driver Option:</span> Driver can manually confirm or report issues if auto-detection needs override
                  </p>
                </div>
              </div>

              {/* Step 7: Real-Time Feedback */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex-shrink-0">
                    7
                  </div>
                  <Vibrate className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Boarding Confirmed</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Passenger Mobile
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Process:</span> Once auto-detected or driver-confirmed, user's app receives instant haptic (vibration) feedback and visual confirmation (e.g., "You're on board! Destination: Madina"), live ride view activates
                  </p>
                </div>
              </div>

              {/* Step 8: Live Ride Tracking */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">
                    8
                  </div>
                  <Navigation className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Live Ride Tracking</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Passenger Mobile & Driver Web App
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> Location Service → WebSocket → Map Service
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Data:</span> Live bus location on map, next stops, ETA to drop-off, seat status visible in real time
                  </p>
                </div>
              </div>

              {/* Step 9: Auto-Detection Drop-off */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 flex-shrink-0">
                    9
                  </div>
                  <LogIn className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Auto-Detect Drop-off</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Passenger Mobile/Driver Web App
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Process:</span> <span className="font-semibold text-red-700">Algorithm automatically detects</span> when bus reaches passenger's drop-off stop using geofencing and location data
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> Drop-off Detection Service → Location Service → Manifest Service
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Data:</span> Ride status = "COMPLETED", journey end time, seat becomes available for substitution for next segment; Driver can manually mark drop-off if needed
                  </p>
                </div>
              </div>

              {/* Step 10: Post-Ride */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                    10
                  </div>
                  <Clock className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  <div>
                    <p className="text-slate-900 text-sm">Post-Ride</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 hidden md:block" />
                <div className="flex-1 bg-slate-50 p-3 rounded-lg ml-11 md:ml-0">
                  <p className="text-xs text-slate-700 mb-2">
                    <span className="font-medium">App:</span> Passenger Mobile, Driver Mobile
                  </p>
                  <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">
                    <span className="font-medium">Services:</span> History Service, Rating and Support Service
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Data:</span> Ride logs, payment receipts, <span className="font-semibold">ratings for Volteryde service</span> (not driver), support access
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Location-Based Auto-Detection Info */}
          <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
            <div className="flex items-center gap-3 mb-3">
              <Locate className="w-6 h-6 text-indigo-600" />
              <h4 className="text-slate-900">Location-Based Auto-Detection Algorithm</h4>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h5 className="text-sm text-slate-900 mb-3">Boarding Detection</h5>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• Geofence created around bus stop (30m radius)</li>
                  <li>• Passenger GPS location monitored when bus arrives</li>
                  <li>• If passenger & bus locations match at stop, auto-boarding triggered</li>
                  <li>• Status updated to "ON_BOARD" automatically</li>
                  <li>• Driver receives notification and can override if needed</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h5 className="text-sm text-slate-900 mb-3">Drop-off Detection</h5>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• System monitors bus location and passenger's destination</li>
                  <li>• When bus reaches drop-off stop, auto-detection triggered</li>
                  <li>• Ride marked as "COMPLETED" automatically</li>
                  <li>• Seat immediately becomes available for next segment</li>
                  <li>• Driver can manually confirm or report if passenger hasn't alighted</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Driver Journey */}
        <TabsContent value="driver-flow" className="space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Bus className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-slate-900">Driver Journey Flow</h3>
                <p className="text-slate-600 text-sm">Driver workflow with map services, route management, and manifest monitoring</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Driver App Features */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
                  <h4 className="text-slate-900 mb-3">Driver App Core Features</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded">
                      <h5 className="text-sm text-slate-900 mb-2 flex items-center gap-2">
                        <MapPinned className="w-4 h-4 text-blue-600" />
                        Map Services & Route
                      </h5>
                      <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Full route visualization with live navigation</p>
                      <ul className="text-xs text-slate-500 space-y-1">
                        <li>• Live GPS tracking and route adherence</li>
                        <li>• Next stop highlighted with passenger count</li>
                        <li>• Turn-by-turn navigation to stops</li>
                        <li>• Traffic and route optimization alerts</li>
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <h5 className="text-sm text-slate-900 mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-green-600" />
                        Onboarded Passengers Panel
                      </h5>
                      <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Real-time manifest with passenger status</p>
                      <ul className="text-xs text-slate-500 space-y-1">
                        <li>• Shows all onboarded passengers with seats</li>
                        <li>• Drop-off stops clearly indicated</li>
                        <li>• Auto-updates when passengers board/alight</li>
                        <li>• Organized by upcoming drop-offs</li>
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <h5 className="text-sm text-slate-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        Driver Actions & Reporting
                      </h5>
                      <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Manual controls for edge cases</p>
                      <div className="space-y-2 mt-2">
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-xs text-slate-700 mb-1"><span className="font-medium">Report Issue</span></p>
                          <p className="text-xs text-slate-500">Flag passenger who didn't board or alight</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-xs text-slate-700 mb-1"><span className="font-medium">Manual Drop-off</span></p>
                          <p className="text-xs text-slate-500">Override auto-detection if needed</p>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-slate-700 mb-1"><span className="font-medium">Manual Boarding</span></p>
                          <p className="text-xs text-slate-500">Confirm boarding if auto-detection fails</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded">
                      <h5 className="text-sm text-slate-900 mb-2 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-600" />
                        Live Notifications
                      </h5>
                      <p className="text-xs text-slate-600">Real-time alerts for bookings and events</p>
                      <ul className="text-xs text-slate-500 space-y-1 mt-2">
                        <li>• New booking notifications</li>
                        <li>• Auto-boarding confirmations</li>
                        <li>• Upcoming drop-off alerts</li>
                        <li>• System alerts and emergencies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Driver App Screen Mockup */}
              <div className="space-y-4">
                <div className="bg-slate-900 p-4 rounded-lg">
                  <h4 className="text-white mb-3">Driver App Screen</h4>
                  <div className="bg-white rounded-lg p-4 space-y-3">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div>
                        <p className="text-sm text-slate-900">Route: Circle → Madina</p>
                        <p className="text-xs text-slate-500">Bus #VT-042</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>

                    {/* Map Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs text-slate-700 flex items-center gap-1">
                          <MapPinned className="w-3 h-3 text-blue-600" />
                          Live Route Map
                        </h5>
                        <Badge variant="outline" className="text-xs">Next: Lapaz</Badge>
                      </div>
                      <div className="bg-white rounded h-20 flex items-center justify-center border border-blue-300">
                        <p className="text-xs text-slate-500">🗺️ Interactive Map View</p>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs text-slate-500">ETA to Lapaz</p>
                          <p className="text-sm text-slate-900">3 min</p>
                        </div>
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs text-slate-500">Waiting</p>
                          <p className="text-sm text-slate-900">2 passengers</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Onboarded Passengers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-xs text-slate-500">ONBOARDED (5)</h5>
                        <Badge className="bg-blue-600 text-white text-xs">Auto-detected</Badge>
                      </div>
                      
                      <div className="space-y-1.5">
                        {/* Passenger 1 */}
                        <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded border border-yellow-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-xs">
                                KM
                              </div>
                              <div>
                                <p className="text-xs text-slate-900">Kwame M.</p>
                                <p className="text-xs text-slate-500">Seat A1</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-orange-700 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Drops: Lapaz
                            </p>
                            <Badge className="bg-orange-100 text-orange-700 text-xs mt-1">Next Stop</Badge>
                          </div>
                          <button className="bg-orange-600 text-white px-2 py-1 rounded text-xs">
                            Report
                          </button>
                        </div>

                        {/* Passenger 2 */}
                        <div className="flex items-center gap-2 bg-green-50 p-2 rounded border border-green-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center text-xs">
                                AA
                              </div>
                              <div>
                                <p className="text-xs text-slate-900">Ama A.</p>
                                <p className="text-xs text-slate-500">Seat A2</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Drops: Madina
                            </p>
                          </div>
                          <button className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs">
                            Report
                          </button>
                        </div>

                        {/* Passenger 3 */}
                        <div className="flex items-center gap-2 bg-green-50 p-2 rounded border border-green-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-xs">
                                KD
                              </div>
                              <div>
                                <p className="text-xs text-slate-900">Kofi D.</p>
                                <p className="text-xs text-slate-500">Seat B1</p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Drops: Legon
                            </p>
                          </div>
                          <button className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs">
                            Report
                          </button>
                        </div>

                        {/* More passengers */}
                        <p className="text-xs text-slate-400 text-center pt-1">+ 2 more passengers</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Summary */}
                    <div className="bg-slate-50 p-2 rounded">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Total Seats</span>
                        <span className="text-slate-900">20</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600">Currently Onboard</span>
                        <span className="text-green-700">5 passengers</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Available (this segment)</span>
                        <span className="text-slate-900">15 seats</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Backend Services */}
          <Card className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200">
            <h4 className="text-slate-900 mb-3">Backend Auto-Detection Services</h4>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded">
                <h5 className="text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Boarding Detection
                </h5>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• GPS geofencing (30m radius)</li>
                  <li>• Real-time location matching</li>
                  <li>• Auto-status update to ON_BOARD</li>
                  <li>• WebSocket notification to apps</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <h5 className="text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  Drop-off Detection
                </h5>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Monitors bus at drop-off stop</li>
                  <li>• Auto-completes ride on arrival</li>
                  <li>• Seat freed for substitution</li>
                  <li>• Payment confirmation sent</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <h5 className="text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-600" />
                  Manual Override
                </h5>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Driver can report issues</li>
                  <li>• Manual boarding confirmation</li>
                  <li>• Manual drop-off marking</li>
                  <li>• All actions audit-logged</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Seat Substitution Algorithm */}
        <TabsContent value="seat-algorithm" className="space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Repeat className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-slate-900">Real-Time Dynamic Seat Availability and Substitution Algorithm</h3>
                <p className="text-slate-600 text-sm">Revolutionary seat optimization that maximizes bus utilization through segment-based availability</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Core Concept */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-lg border-2 border-emerald-200">
                <h4 className="text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Core Concept: Segment-Based Seat Availability
                </h4>
                <p className="text-sm text-slate-700 mb-4">
                  Seats are <span className="font-bold">NOT</span> blocked for the entire bus route. Instead, they are dynamically available per route segment, allowing multiple passengers to book the same physical seat for different non-overlapping portions of the journey.
                </p>
                <div className="bg-white p-4 rounded-lg">
                  <h5 className="text-sm text-slate-900 mb-3">Key Principles:</h5>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><span className="font-semibold">Segmental Booking:</span> A seat is occupied only from boarding stop to drop-off stop, not for the entire route</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><span className="font-semibold">Dynamic Substitution:</span> After a passenger alights, their seat immediately becomes available for the next segment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><span className="font-semibold">Pre-emptive Booking:</span> Passengers can book a seat even if currently occupied, as long as it's free for their segment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span><span className="font-semibold">Maximized Efficiency:</span> Reduces seat idle time and allows continuous bookings across route segments</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Visual Example */}
              <div>
                <h4 className="text-slate-700 mb-3">Visual Example: Seat A1 Journey</h4>
                <div className="bg-white p-5 rounded-lg border-2 border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Bus className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-slate-700">Route: <span className="font-semibold">Circle → Lapaz → Madina → Legon → Ashongman</span></p>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-4">
                    {/* Segment 1 */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0">
                        <Badge className="bg-blue-600 text-white">Segment 1</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-blue-900 flex items-center gap-2">
                                <CircleDot className="w-3 h-3" />
                                <span className="font-medium">Circle → Lapaz</span>
                              </p>
                              <p className="text-xs text-blue-700 mt-1">Passenger: Kwame M. (Seat A1)</p>
                            </div>
                            <Badge className="bg-blue-600 text-white">OCCUPIED</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Segment 2 */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0">
                        <Badge className="bg-purple-600 text-white">Segment 2</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-purple-900 flex items-center gap-2">
                                <CircleDot className="w-3 h-3" />
                                <span className="font-medium">Lapaz → Madina</span>
                              </p>
                              <p className="text-xs text-purple-700 mt-1">Passenger: Ama A. (Seat A1) - <span className="font-semibold">Substitution!</span></p>
                            </div>
                            <Badge className="bg-purple-600 text-white">OCCUPIED</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Segment 3 */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0">
                        <Badge className="bg-green-600 text-white">Segment 3</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="bg-green-50 p-3 rounded-lg border-2 border-green-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-green-900 flex items-center gap-2">
                                <CircleDot className="w-3 h-3" />
                                <span className="font-medium">Madina → Legon</span>
                              </p>
                              <p className="text-xs text-green-700 mt-1">Passenger: Kofi D. (Seat A1) - <span className="font-semibold">Another Substitution!</span></p>
                            </div>
                            <Badge className="bg-green-600 text-white">OCCUPIED</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Segment 4 */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0">
                        <Badge className="bg-slate-400 text-white">Segment 4</Badge>
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-50 p-3 rounded-lg border-2 border-slate-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-slate-900 flex items-center gap-2">
                                <CircleDot className="w-3 h-3" />
                                <span className="font-medium">Legon → Ashongman</span>
                              </p>
                              <p className="text-xs text-slate-600 mt-1">No booking for this segment</p>
                            </div>
                            <Badge className="bg-slate-300 text-slate-700">AVAILABLE</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-emerald-50 rounded border border-emerald-200">
                    <p className="text-xs text-emerald-900">
                      <span className="font-bold">Result:</span> Seat A1 served 3 different passengers on a single bus trip, maximizing utilization and revenue!
                    </p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div>
                <h4 className="text-slate-700 mb-3">How the Algorithm Works</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      Booking Stage
                    </h5>
                    <ol className="space-y-2 text-xs text-slate-600">
                      <li>1. User selects boarding stop and drop-off stop</li>
                      <li>2. System queries seat availability for that <span className="font-semibold">specific segment</span></li>
                      <li>3. Shows only seats free between those two stops</li>
                      <li>4. User books seat; segment locked in database</li>
                      <li>5. Seat remains available for other segments</li>
                    </ol>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h5 className="text-sm text-slate-900 mb-3 flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-green-600" />
                      Drop-off Stage
                    </h5>
                    <ol className="space-y-2 text-xs text-slate-600">
                      <li>1. Auto-detection confirms passenger alighted</li>
                      <li>2. Booking status updated to "COMPLETED"</li>
                      <li>3. Seat segment freed in real-time (Redis)</li>
                      <li>4. Immediately available for next segment bookings</li>
                      <li>5. Other passengers' pre-bookings auto-activated</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Database Schema */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <h4 className="text-slate-900 mb-3">Database Schema for Segment Tracking</h4>
                <div className="bg-white p-4 rounded font-mono text-xs">
                  <p className="text-blue-600 mb-2">Table: seat_bookings</p>
                  <div className="space-y-1 text-slate-700">
                    <p>- booking_id (UUID)</p>
                    <p>- bus_id (UUID)</p>
                    <p>- seat_number (VARCHAR)</p>
                    <p>- passenger_id (UUID)</p>
                    <p className="text-emerald-600 font-bold">- boarding_stop_id (UUID) ← Critical for segment tracking</p>
                    <p className="text-emerald-600 font-bold">- drop_off_stop_id (UUID) ← Critical for segment tracking</p>
                    <p>- status (ENUM: BOOKED, ON_BOARD, COMPLETED, CANCELLED)</p>
                    <p>- booking_time (TIMESTAMP)</p>
                    <p>- boarding_time (TIMESTAMP)</p>
                    <p>- drop_off_time (TIMESTAMP)</p>
                  </div>
                  <p className="text-slate-500 mt-3 text-xs">
                    Query: SELECT seats WHERE NOT EXISTS (conflicting segment bookings)
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-lg border-2 border-orange-200">
                <h4 className="text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Business Benefits
                </h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-slate-900 mb-1">Higher Revenue</p>
                    <p className="text-xs text-slate-600">Same seat = multiple fares per trip</p>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-slate-900 mb-1">Better UX</p>
                    <p className="text-xs text-slate-600">More seat options for passengers</p>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-slate-900 mb-1">Optimized Fleet</p>
                    <p className="text-xs text-slate-600">Reduced idle seat time</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Data Flow */}
        <TabsContent value="data-flow" className="space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-slate-900">Complete Data Flow Architecture</h3>
                <p className="text-slate-600 text-sm">How data moves across all services in Volteryde's segment-based booking system</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Layer 1: Applications */}
              <div>
                <h4 className="text-slate-700 mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Layer 1: Frontend Applications (6 Apps)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                    <Smartphone className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-700">Passenger App</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                    <Bus className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-700">Driver App</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-center">
                    <Truck className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-700">Fleet Manager</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                    <Headphones className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-700">Customer Support</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                    <Settings className="w-5 h-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-700">Admin</p>
                  </div>
                  <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200 text-center">
                    <Users className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-700">Partner Dashboard</p>
                  </div>
                </div>
                <div className="flex justify-center my-3">
                  <ArrowDown className="w-6 h-6 text-slate-400" />
                </div>
              </div>

              {/* Layer 2: API Gateway */}
              <div>
                <h4 className="text-slate-700 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Layer 2: API Gateway & Authentication
                </h4>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 mb-1">API Gateway (Kong/AWS)</p>
                      <p className="text-xs text-slate-600">Routes all requests, rate limiting, SSL termination</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-green-600 hidden md:block" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 mb-1">Auth Service (Java + Security)</p>
                      <p className="text-xs text-slate-600">JWT validation, OAuth2, session management</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center my-3">
                  <ArrowDown className="w-6 h-6 text-slate-400" />
                </div>
              </div>

              {/* Layer 3: Microservices */}
              <div>
                <h4 className="text-slate-700 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Layer 3: Microservices (47+ Services)
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-600">Java</Badge>
                      <p className="text-sm text-slate-900">Core Services (13)</p>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Auth & Security</li>
                      <li>• Payment Processing</li>
                      <li>• Transaction Management</li>
                      <li>• Compliance & Audit</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-600">NestJS</Badge>
                      <p className="text-sm text-slate-900">Business Services (34)</p>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Bus Discovery & Routes</li>
                      <li>• Segment-based Seat Booking</li>
                      <li>• Boarding/Drop-off Detection</li>
                      <li>• Notifications & Analytics</li>
                    </ul>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-600">Shared</Badge>
                      <p className="text-sm text-slate-900">Infrastructure</p>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• WebSocket Server</li>
                      <li>• Location/Geofencing Service</li>
                      <li>• SMS/Push Notifications</li>
                      <li>• Mobile Money Gateway</li>
                    </ul>
                  </div>
                </div>
                <div className="flex justify-center my-3">
                  <ArrowDown className="w-6 h-6 text-slate-400" />
                </div>
              </div>

              {/* Layer 4: Data Layer */}
              <div>
                <h4 className="text-slate-700 mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Layer 4: Data Storage & Caching
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <Database className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="text-sm text-slate-900 mb-1">PostgreSQL</p>
                    <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Primary database (8 schemas, 45+ tables)</p>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>• Users & Auth</p>
                      <p>• Segment-based Bookings</p>
                      <p>• Manifest Records</p>
                      <p>• Payments & Analytics</p>
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <Database className="w-6 h-6 text-red-600 mb-2" />
                    <p className="text-sm text-slate-900 mb-1">Redis Cache</p>
                    <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Real-time data & sessions</p>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>• Live bus locations</p>
                      <p>• Seat availability (segment)</p>
                      <p>• Active manifest</p>
                      <p>• Session tokens</p>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <Database className="w-6 h-6 text-green-600 mb-2" />
                    <p className="text-sm text-slate-900 mb-1">MongoDB</p>
                    <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Document storage</p>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>• Auto-detection logs</p>
                      <p>• Incident reports</p>
                      <p>• Audit trails</p>
                      <p>• Location events</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <Database className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="text-sm text-slate-900 mb-1">PostGIS</p>
                    <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Geospatial queries</p>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>• Bus locations</p>
                      <p>• Route geometry</p>
                      <p>• Stop coordinates</p>
                      <p>• Geofencing data</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Flow Example */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-lg border-2 border-indigo-200">
                <h4 className="text-slate-900 mb-3">Example: Segment Booking & Auto-Detection Data Flow</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0">1</div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Passenger App</span> → Geospatial Service → Bus Discovery → Seat Map Service (segment-based availability from Redis)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0">2</div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">User selects seat for segment</span> → Seat Booking Service locks seat for boarding_stop → drop_off_stop (PostgreSQL + Redis)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0">3</div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Payment processed</span> → Booking confirmed → Driver notified via WebSocket
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0">4</div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Bus arrives at stop</span> → Location Service detects geofence match → Auto-boarding triggered
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0">5</div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Boarding Detection Service</span> → Updates status to ON_BOARD (Redis + PostgreSQL) → Haptic feedback sent
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0">6</div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">Bus reaches drop-off</span> → Auto-detection triggers → Status = COMPLETED → Seat freed for next segment
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0">7</div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">All actions logged</span> → MongoDB audit trail + Analytics Service updates real-time metrics
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Real-time Events */}
        <TabsContent value="realtime" className="space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Bell className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-slate-900">Real-time Events & Notifications</h3>
                <p className="text-slate-600 text-sm">WebSocket events, haptic feedback, and live updates across Volteryde's bus network</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Event Types */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <h5 className="text-slate-900 mb-3 flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-blue-600" />
                    Booking Events
                  </h5>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">booking.created</span></p>
                      <p className="text-slate-500">Seat booked for specific segment</p>
                    </div>
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">seat.segment.locked</span></p>
                      <p className="text-slate-500">Seat reserved for boarding → drop-off</p>
                    </div>
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">driver.notified</span></p>
                      <p className="text-slate-500">New passenger added to manifest</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                  <h5 className="text-slate-900 mb-3 flex items-center gap-2">
                    <Locate className="w-4 h-4 text-orange-600" />
                    Auto-Detection Events
                  </h5>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">boarding.auto.detected</span></p>
                      <p className="text-slate-500">Geofence match, auto-boarded</p>
                    </div>
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">dropoff.auto.detected</span></p>
                      <p className="text-slate-500">Bus reached destination, auto-completed</p>
                    </div>
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">seat.substitution.activated</span></p>
                      <p className="text-slate-500">Seat freed for next segment</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <h5 className="text-slate-900 mb-3 flex items-center gap-2">
                    <Vibrate className="w-4 h-4 text-green-600" />
                    Haptic & Feedback
                  </h5>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">haptic.boarding.success</span></p>
                      <p className="text-slate-500">Vibration + "You're on board!"</p>
                    </div>
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">notification.bus.arriving</span></p>
                      <p className="text-slate-500">Bus ETA alert to passengers</p>
                    </div>
                    <div className="bg-white p-2 rounded text-xs">
                      <p className="text-slate-700 mb-1"><span className="font-medium">haptic.dropoff.approaching</span></p>
                      <p className="text-slate-500">Destination approaching alert</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Matrix */}
              <div>
                <h4 className="text-slate-700 mb-3">Notification Delivery Matrix</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-2 text-left text-slate-700">Event</th>
                        <th className="p-2 text-center text-slate-700">WebSocket</th>
                        <th className="p-2 text-center text-slate-700">Push</th>
                        <th className="p-2 text-center text-slate-700">Haptic</th>
                        <th className="p-2 text-center text-slate-700">SMS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr className="bg-white">
                        <td className="p-2 text-slate-700">Booking Confirmed</td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center text-slate-400">—</td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-2 text-slate-700">Driver Notified (New Booking)</td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center text-slate-400">—</td>
                        <td className="p-2 text-center text-slate-400">—</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="p-2 text-slate-700">Auto-Boarding Detected</td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center text-slate-400">—</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-2 text-slate-700">Auto-Drop-off Detected</td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center text-slate-400">—</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="p-2 text-slate-700">Seat Substitution Available</td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center text-slate-400">—</td>
                        <td className="p-2 text-center text-slate-400">—</td>
                        <td className="p-2 text-center text-slate-400">—</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="p-2 text-slate-700">Payment Success</td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                        <td className="p-2 text-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Real-time Dashboard Updates */}
              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                <h4 className="text-slate-900 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Real-time Dashboard Updates
                </h4>
                <p className="text-sm text-slate-700 mb-4">
                  Admin, Fleet Manager, and Customer Support dashboards receive live updates on segment bookings and substitutions
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded">
                    <p className="text-xs text-slate-700 mb-2">Admin Dashboard</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Segment utilization metrics</li>
                      <li>• Substitution efficiency rate</li>
                      <li>• Revenue per seat per trip</li>
                      <li>• System health monitoring</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-xs text-slate-700 mb-2">Fleet Manager (Staff)</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Bus check-in status</li>
                      <li>• Battery levels & charging</li>
                      <li>• Inspection reports</li>
                      <li>• Maintenance issues flagged</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-xs text-slate-700 mb-2">Customer Support</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• Passenger bookings & status</li>
                      <li>• Incident reports from drivers</li>
                      <li>• Failed auto-detections</li>
                      <li>• Volteryde service ratings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
