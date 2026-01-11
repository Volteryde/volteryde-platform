Technical Architecture and Implementation Strategy for VolteRyde: A Fixed-Route Electric Bus Transportation System
1. Executive Summary
This technical design document outlines the architectural framework for VolteRyde, a proposed mobile application ecosystem supporting a fixed-route public electric bus network. Unlike dynamic ride-hailing services which rely on demand-responsive algorithms, VolteRyde operates within the deterministic constraints of predefined schedules, routes, and stops. This distinction necessitates a fundamental shift in engineering priorities: moving from dynamic matching engines to robust schedule adherence systems, high-precision geospatial discovery, and offline-first reliability. Furthermore, the integration of an electric vehicle (EV) fleet introduces critical variables—specifically State of Charge (SoC) and range anxiety—that must be exposed to the user to build trust in the system's reliability.
The proposed architecture leverages the Mapbox ecosystem for visualization and search, utilizing a hybrid of Vector Tiles and custom client-side indexing to achieve "restricted search" functionality that filters global noise. The data layer is built upon the General Transit Feed Specification (GTFS) for interoperability, extended with proprietary schemas for electric vehicle telemetry and complex seat inventory management. A critical innovation proposed is the "Automatic Boarding" logic, which employs a hybrid Geofence-to-Beacon wake-up mechanism to achieve frictionless fare validation without imposing unsustainable battery drain on passenger devices.
This report provides a comprehensive breakdown of the system components, data models, synchronization protocols, and algorithmic strategies required to deliver a seamless, modern public transit experience. It addresses the user's specific requirements for location-based discovery, restricted search, Mapbox integration, and automatic boarding, while expanding on the implicit needs of an EV-based, inventory-constrained transit network.
2. System Context and Architectural Principals
2.1 The Fixed-Route Operational Paradigm
The technical architecture of VolteRyde is defined by its operational model. In ride-hailing (e.g., Uber), the "supply" (vehicles) is dynamic and the "route" is transient. In VolteRyde's fixed-route system, the "supply" is static in terms of path and timing but variable in terms of capacity and energy. The engineering challenge is not to route the vehicle to the passenger, but to efficiently route the passenger to the vehicle's node (the bus stop).
This shifts the algorithmic focus from the Traveling Salesman Problem (TSP) to multi-modal trip planning and schedule optimization. The system must handle high-concurrency read operations (thousands of users checking the same schedule simultaneously) rather than high-concurrency write operations (thousands of users requesting distinct rides). This distinction favors a Read-Heavy Architecture where static data is cached aggressively on the client device, and dynamic updates (delays, battery levels) are pushed via lightweight telemetry channels.
2.2 Electric Vehicle (EV) Integration Strategy
The electrification of the fleet is not merely an operational detail; it fundamentally alters the data domain. Standard transit apps assume a vehicle will complete its block (sequence of trips). For VolteRyde, the system must continuously validate that Current_SoC > Required_SoC_For_Remaining_Route.
Implications for Architecture:
Telemetry Ingestion: The backend must ingest high-frequency telematics (CAN bus data) including voltage, amperage, and regenerative braking status, not just GPS coordinates.
Predictive Availability: The trip planning engine must filter out buses that are scheduled but lack the energy to complete the route, proactively preventing service disruptions from affecting the user experience.
Charging Awareness: The GTFS static schedule must account for dwell times at charging hubs, which may differ from standard layovers.
2.3 Offline-First Design Philosophy
Public transit users frequently traverse areas of low connectivity—subway tunnels, rural corridors, or congested urban centers where network saturation occurs. A "thin client" architecture, which relies on server communication for every interaction, will fail in these environments. VolteRyde must adopt an Offline-First architecture.
Local Truth: The mobile device must hold a local replica of the route network, schedule, and fare rules (SQLite).
Optimistic UI: Actions like "Boarding" or "Searching" must execute immediately against the local database, syncing with the server only when connectivity is restored.
Map Resilience: Map visualization must rely on pre-downloaded vector tile packs rather than streaming raster tiles.
3. Geospatial Architecture and Mapbox Integration
The map is the primary interface for VolteRyde. It serves two distinct functions: Visualization (rendering the network) and Discovery (finding the network). The request specifies Mapbox integration, which offers distinct advantages over Google Maps in terms of customization, offline capability, and cost control for custom datasets.
3.1 Visualization Strategy: Vector Tiles vs. GeoJSON
To display routes and stops, developers often default to loading GeoJSON files directly into the map instance. While simple, this approach creates significant performance bottlenecks as the dataset grows.
Performance Constraints:
GeoJSON is parsed as a single JavaScript object. A network with 5,000 stops and detailed polylines can easily exceed 5MB-10MB of JSON. Loading this into the Mapbox GL JS or Mobile SDK memory causes frame rate drops during panning and zooming, as the main thread is blocked by parsing.1 Mapbox documentation explicitly warns that large GeoJSON sources negatively impact "Source update time" and "Render time".1
The Vector Tile Solution:
For VolteRyde, the static network (routes and stops) should be processed into Vector Tiles using the Mapbox Tiling Service (MTS).3 Vector tiles chop the geospatial data into small, square "puzzles" (tiles) at various zoom levels.
Efficiency: The client only downloads the tiles for the current viewport (e.g., the user is looking at "Downtown," so they don't download "Suburbs").
Binary Format: Tiles use the Protocol Buffers (PBF) format, which is significantly lighter and faster to parse than text-based JSON.4
Styling: Since vector tiles retain feature data (attributes like route_color, stop_name), the mobile app can style them dynamically (e.g., coloring the "Active Route" blue and "Inactive Routes" gray) without re-downloading data.5
Implementation Recommendation:
Static Layer: Upload routes.txt and shapes.txt (converted to GeoJSON) to Mapbox Studio or MTS to create a volteryde.routes tileset.
Dynamic Layer: For real-time bus positions, use a GeoJSON Source. Since the number of active buses (e.g., 50-500) is much smaller than the number of stops, GeoJSON is acceptable here. Update this source every 3-5 seconds using the setData() method, which Mapbox GL optimizes by diffing the changes.1
3.2 Restricted Search: The "Walled Garden" Approach
The requirement for "restricted search" is critical. A standard geocoding query for "Central Station" via a public API (like Mapbox Geocoding API or Google Places) might return a gas station, a police station, or a train station in another city.6 VolteRyde users expect "Central Station" to map specifically to stop_id: 1045.
3.2.1 Limitations of Standard Geocoders
Mapbox's standard Geocoding API allows for "Bounding Box" (bbox) restrictions to limit results to a geographic area (e.g., a city), but it does not allow restricting results to a custom dataset exclusively.6 The API will still return public POIs (restaurants, shops) within that box, diluting the user experience.
3.2.2 Solution A: Client-Side Custom Indexing (Recommended for Mobile)
For the Android and iOS applications, the optimal approach is to bypass the remote Geocoding API entirely for stop discovery.
Mechanism: The app downloads the full stops table (via the GTFS sync process) into its local SQLite database.
Search Provider: We implement a custom class extending the Mapbox Search SDK's SearchDataProvider (iOS) or IndexableDataProvider (Android).7
Logic: When the user types "Centr...", the app queries the local SQLite database using a Full-Text Search (FTS) index (e.g., SELECT * FROM stops WHERE name MATCH 'Centr*').
Integration: These results are injected into the Mapbox Search UI component.
Advantages:
Zero Latency: No network request required.
100% Relevance: Results are guaranteed to be VolteRyde stops.
Cost: Zero API usage costs for geocoding.9
3.2.3 Solution B: Mapbox Tilequery API (Server-Side Fallback)
For scenarios where the dataset is too large for local storage (e.g., a multi-city system with >100,000 stops), VolteRyde should utilize the Mapbox Tilequery API.10
Workflow: The search query is sent to a VolteRyde backend endpoint. The backend uses the Tilequery API to spatially search the custom volteryde.stops tileset uploaded to Mapbox.
Benefit: This offloads processing but introduces network dependency.
Recommendation: Given typical bus networks (1,000 - 10,000 stops), Solution A (Client-Side SQLite) is vastly superior for UX and reliability.
3.3 Location-Based Bus Stop Discovery
To answer the user's implicit question—"Where is the nearest stop?"—the system utilizes geospatial indexing.
The Algorithm:
Acquire Location: The app retrieves the user's coordinates ($Lat_u, Lon_u$) via the OS Location Services (FusedLocationProvider on Android, CoreLocation on iOS).
Spatial Filter:
Offline: Query the local SQLite database. To optimize performance, first apply a bounding box filter (approx. $\pm 0.01$ degrees lat/lon) to reduce the search space, then calculate the precise Haversine distance for the remaining candidates.12
Online: Use the Mapbox Tilequery API to retrieve features from the volteryde.stops tileset within a radius (e.g., radius=500 meters).11
Visual Interaction: The app calculates the bearing and distance to the nearest stop and updates the UI (e.g., "Nearest stop: Main St, 2 min walk").
Map Behavior: Using the mapboxMap.flyTo() method, the camera centers on the user's location and adjusts the zoom level to encompass the nearest 3 stops.14
3.4 Handling Custom Map Markers
To visually distinguish different stop types (e.g., "Regular Stop" vs. "Charging Hub"), the app should use Data-Driven Styling.
Implementation: In the Mapbox Style Specification, the icon-image property can be set to an expression: ['get', 'stop_type'].
Asset Management: Custom SVG icons for "Electric Bus Stop" or "Charging Station" are uploaded to the Mapbox Style. The renderer automatically selects the correct icon based on the feature's attributes in the vector tile.5
4. Data Modeling: Schema and Standards
The integrity of VolteRyde depends on a rigorous data model. We will construct a schema that is compliant with international standards for interoperability while supporting the specific needs of electric inventory management.
4.1 GTFS Schedule (The Static Backbone)
The General Transit Feed Specification (GTFS) consists of a series of relational CSV files. VolteRyde's backend will ingest these files into a PostgreSQL database, and the mobile app will sync a subset to SQLite.
4.1.1 Essential Tables
agency: Defines the service provider.
stops:
stop_id (PK): Unique identifier.
stop_name: Display name.
stop_lat, stop_lon: WGS84 coordinates.
location_type: 0 for stop, 1 for station/terminal.
Extension: is_charging_station (Boolean) – Critical for EV routing logic.
routes:
route_id (PK): Identifier (e.g., "RT-101").
route_short_name: "101".
route_color: Hex code (e.g., "#0000FF") for map rendering.
trips:
trip_id (PK): A specific instance of a route (e.g., "101 at 8:00 AM").
block_id: Links multiple trips performed by the same physical vehicle. This is vital for EV range modeling, as the battery depletes across the entire block, not just one trip.
stop_times:
trip_id (FK), stop_id (FK).
arrival_time, departure_time.
stop_sequence: Order of stops.
calendar / calendar_dates: Defines service availability (Mon-Fri, holidays).
4.2 GTFS Realtime (The Dynamic Layer)
For live updates, VolteRyde must produce a GTFS Realtime feed. This is a binary Protocol Buffer (Protobuf) stream, optimized for bandwidth.16
4.2.1 Feed Entities
Vehicle Positions:
trip_id: Which scheduled trip the bus is serving.
position: Latitude/Longitude/Bearing.
timestamp: Time of GPS fix.
occupancy_status: Enumeration (EMPTY, MANY_SEATS_AVAILABLE, FULL).18
Trip Updates:
delay: Seconds relative to schedule (+ve is late, -ve is early).
Alerts: Human-readable service disruptions.
4.2.2 Custom Extension for Battery Status
Standard GTFS-RT does not include battery data. We will define a custom Protobuf extension to transmit this data to the app.19

Protocol Buffers


extend VehiclePosition {
    optional float battery_level_percent = 1001;
    optional bool is_charging = 1002;
    optional int32 remaining_range_meters = 1003;
}


Usage: The mobile app decodes this field to render a "Battery Bar" or "Charging Lightning Bolt" icon on the live map vehicle marker.
4.3 Relational Schema for Inventory and Accounts (PostgreSQL)
While GTFS handles the "Transit" domain, a relational schema is needed for the "Business" domain (bookings, users, payments).
4.3.1 Seat Inventory & Overlapping Segments
If VolteRyde offers reserved seating, managing inventory on a multi-stop route is complex. A passenger booking Stop A -> Stop C consumes the seat for segments A->B and B->C.
Naive Approach: A simple counter on the trip. Fails because it doesn't account for partial overlaps.
Robust Approach: Segment-Based Inventory.20
Define atomic segments between consecutive stops (S1-S2, S2-S3, S3-S4).
A trip is a collection of segments.
A booking A->C locks segments A->B and B->C.
Database Structure:
trip_segments: segment_id, trip_id, from_stop_id, to_stop_id, capacity.
segment_reservations: segment_id, booking_id.
Query Logic: To check availability for A->C, the system must query:
SQL
SELECT MIN(capacity - current_reservations)
FROM trip_segments
WHERE trip_id =? AND sequence >= start_seq AND sequence < end_seq;

If the result is > 0, the seat is bookable.22
4.3.2 Double-Entry Ledger for Wallets
To manage user funds ("VolteRyde Wallet"), we must use a double-entry ledger system to prevent financial discrepancies.23
Table ledger_entries:
transaction_id (UUID)
account_id (User or System Revenue)
amount (Integer in cents, avoiding floating point errors)
direction (DEBIT/CREDIT)
Constraint: SUM(amount) for a given transaction_id must always equal 0.
5. Mobile Connectivity and Offline Synchronization
The reliability of VolteRyde depends on its ability to function without a network connection.
5.1 Local Persistence: SQLite
SQLite is the industry standard for mobile local storage. We will use the Room Persistence Library (Android) and Core Data or a raw SQLite wrapper (iOS) to interface with the database.25
Schema Mapping: The SQLite schema will mirror the GTFS Static structure (stops, routes, stop_times), plus a user_activity table for offline boarding logs.
Indexing: Critical for performance. Create indices on stop_times(stop_id, arrival_time) to speed up "Next Bus" queries.
5.2 Synchronization Architecture: Differential Sync
Downloading the full database (potentially 50MB+) daily is inefficient and costly for users. We will implement a Differential Synchronization pattern.26
Versioning: The server maintains a data_version integer that increments with every schedule change.
Check: On app launch, the client sends its local version: GET /api/sync/check?version=105.
Delta Generation:
If the client is significantly behind (e.g., version 50 vs 105), the server sends a Snapshot (full DB replacement).
If the client is close (e.g., version 104 vs 105), the server sends a Patch (Delta).
Delta Format: The patch contains a list of operations:
JSON
{
  "version": 105,
  "changes": {
    "stops": {
      "update": [{ "id": "101", "name": "New Name" }],
      "delete": ["102"]
    }
  }
}


Application: The mobile app applies these changes inside a database transaction. If the transaction fails, it rolls back and requests a full snapshot.28
5.3 Mapbox Offline Region Management
To ensure the map works offline:
Tile Packs: Use OfflineRegionManager to download vector tiles for the city's bounding box.29
Style Packs: Download the associated JSON style and assets (icons, fonts).
Management: The app should explicitly prompt the user: "Download Offline Map for [City Name]? (~15MB)" to manage storage expectations.30
6. Automatic Boarding Logic: The Hybrid Approach
The "Automatic Boarding" feature aims to remove the friction of manual tapping. This is technically challenging due to the conflicting requirements of high accuracy (detecting "on bus" vs. "near bus") and low battery consumption.
6.1 Technology Selection: BLE Beacons
GPS alone is insufficient. A user driving a car alongside a bus will have the same GPS trajectory. Bluetooth Low Energy (BLE) Beacons installed inside the buses provide the necessary proximity context.31
Beacon Placement: Install 2-3 beacons per bus (front, middle, rear) to ensure uniform signal coverage throughout the cabin.
Protocol: Use iBeacon (Apple) or Eddystone-UID (Google). The UUID should represent the VolteRyde system, Major ID the Route, and Minor ID the Vehicle.
6.2 The Geofence-Triggered Wake-Up Cycle
Continuous Bluetooth scanning drains battery rapidly. We propose a state-machine approach that uses low-power Geofencing to trigger high-power Bluetooth scanning only when necessary.33
State 1: Idle (Low Power)
The app registers Geofences (radius ~150m) around all bus stops with the OS Location Manager.
Bluetooth scanning is OFF.
State 2: Stop Proximity (Medium Power)
Trigger: User enters a Stop Geofence.
Action: The OS wakes the app in the background. The app starts BLE Ranging for VolteRyde UUIDs.
Timeout: If no beacon is seen within 2 minutes, the app shuts down scanning.
State 3: Boarding Detection (High Power/Processing)
Trigger: The app detects a beacon with RSSI > -75dBm (Strong Signal).
Validation Algorithm:
RSSI Smoothing: Apply a Kalman Filter or Moving Average to the RSSI values to filter out noise.
Duration Check: Is the signal consistently strong for > 30 seconds?
Velocity Check: Does the device GPS speed match the GTFS-RT vehicle speed?
Exit Geofence: If the user leaves the Stop Geofence while maintaining the Beacon connection, Boarding is Confirmed.35
State 4: Journey (Monitoring)
The app periodically (e.g., every 60s) pings the beacon to ensure the user is still on board.
State 5: Alighting (Checkout)
Trigger: Beacon signal lost (RSSI < -95dBm or unseen) for > 60 seconds.
Confirmation: User has entered a new Stop Geofence or GPS indicates walking speed.
Action: Generate TRIP_END event.
6.3 Fare Logic and Penalties
The backend calculates the fare based on the CheckIn and CheckOut stop IDs using a distance-based fare table.36
Missed Tap-Out: If the user's phone dies or BLE fails mid-trip, the system will receive a CheckIn but no CheckOut.
Penalty: In this scenario, the system automatically applies a Maximum Fare (e.g., cost to the end of the line) at the close of the service day. This incentivizes users to keep their Bluetooth on.37
7. Backend Infrastructure and Scalability
7.1 Real-Time Messaging: MQTT
For transmitting live bus locations and receiving user boarding events, MQTT (Message Queuing Telemetry Transport) is superior to HTTP or WebSockets.39
Low Overhead: MQTT headers are 2 bytes, compared to HTTP's hundreds. This is crucial for cellular IoT devices on moving buses.
QoS Levels: MQTT supports Quality of Service levels. Buses publish location with QoS 0 (fire and forget), while Boarding Events use QoS 2 (exactly once delivery) to ensure financial transaction integrity.
Topic Architecture:
Upstream: bus/{vehicle_id}/telemetry
Downstream: user/{user_id}/notifications
7.2 Scalable Database Architecture
PostGIS: The PostgreSQL database must enable the PostGIS extension. This allows for spatial queries like ST_DWithin and ST_Distance to be executed natively in the database, which is orders of magnitude faster than application-side math.41
Read Replicas: The "Read" load (users fetching schedules) will dwarf the "Write" load. Use a primary DB for bookings/payments and a cluster of Read Replicas for serving schedule data.
8. Conclusion
The VolteRyde architecture represents a sophisticated fusion of traditional transit data standards (GTFS) and modern mobile capabilities (BLE Beacons, Vector Maps). By strictly adhering to the Offline-First principle and leveraging Mapbox's vector tiling capabilities, the system overcomes the performance limitations inherent in large geospatial datasets. The Geofence-to-Beacon boarding logic provides the requested "automatic" experience while respecting the physical constraints of mobile battery life. Finally, the Segment-Based Inventory model ensures that the fixed-route system can maximize capacity utilization without risk of overbooking, a critical factor for the economic viability of public transit. This blueprint provides a technically rigorous path to deployment, balancing innovation with the reliability required of public infrastructure.
Works cited
Improve the performance of Mapbox GL JS maps | Help, accessed January 10, 2026, https://docs.mapbox.com/help/troubleshooting/mapbox-gl-js-performance/
Optimising MapLibre Performance: Tips for Large GeoJSON Datasets, accessed January 10, 2026, https://maplibre.org/maplibre-gl-js/docs/guides/large-data/
Data clustering now available in the Mapbox Tiling Service, accessed January 10, 2026, https://www.mapbox.com/blog/data-clustering-now-available-in-the-mapbox-tiling-service
Upload data to Mapbox | Help, accessed January 10, 2026, https://docs.mapbox.com/help/troubleshooting/uploads/
Expressions | Mapbox Style Spec, accessed January 10, 2026, https://docs.mapbox.com/style-spec/reference/expressions/
Search, Geocoding and Autofill Services - Mapbox, accessed January 10, 2026, https://www.mapbox.com/search-service
Data providers | Search SDK | Android Docs | Mapbox, accessed January 10, 2026, https://docs.mapbox.com/android/search/guides/search-engine/data-providers/
Data providers | Search SDK | Android | Mapbox, accessed January 10, 2026, https://docs.mapbox.com/android/search/guides/data-providers/
Pricing by products | Accounts and pricing - Mapbox Documentation, accessed January 10, 2026, https://docs.mapbox.com/accounts/guides/pricing/
Mapbox Transit v2 | Tilesets | Mapbox Docs, accessed January 10, 2026, https://docs.mapbox.com/data/tilesets/reference/mapbox-transit-v2/
Mapbox: Find POIs with defined radius - Stack Overflow, accessed January 10, 2026, https://stackoverflow.com/questions/60706379/mapbox-find-pois-with-defined-radius
Fares Calculator over a Public Transportation Network - CORE, accessed January 10, 2026, https://core.ac.uk/download/302957833.pdf
29. Nearest-Neighbour Searching — Introduction to PostGIS, accessed January 10, 2026, https://postgis.net/workshops/postgis-intro/knn.html
Examples | Mapbox GL JS, accessed January 10, 2026, https://docs.mapbox.com/mapbox-gl-js/example/
Working with large GeoJSON sources in Mapbox GL JS | Help, accessed January 10, 2026, https://docs.mapbox.com/help/troubleshooting/working-with-large-geojson-data/
GTFS Realtime Best Practices, accessed January 10, 2026, https://gtfs.org/documentation/realtime/realtime-best-practices/
GTFS Realtime Reference, accessed January 10, 2026, https://gtfs.org/documentation/realtime/reference/
Vehicle Positions - General Transit Feed Specification, accessed January 10, 2026, https://gtfs.org/documentation/realtime/feed-entities/vehicle-positions/
VehiclePosition Struct Reference - GTFS-Realtime, accessed January 10, 2026, https://laidig.github.io/gtfs-rt-autodoc/structVehiclePosition.html
How to Build a Bus Ticket Booking Software for Own Company - Ardas, accessed January 10, 2026, https://ardas-it.com/how-to-build-an-online-ticket-booking-software-for-own-bus-company
Bus Scheduling of Overlapping Routes Based on the Combination of All-Stop and Stop-Skipping Services | Request PDF - ResearchGate, accessed January 10, 2026, https://www.researchgate.net/publication/361299725_Bus_Scheduling_of_Overlapping_Routes_Based_on_the_Combination_of_All-Stop_and_Stop-Skipping_Services
figuring out if a seat is available for a specific itinerary - Stack Overflow, accessed January 10, 2026, https://stackoverflow.com/questions/77796180/figuring-out-if-a-seat-is-available-for-a-specific-itinerary
Feedback for e-wallet data model - Working with Data - MongoDB Community Hub, accessed January 10, 2026, https://www.mongodb.com/community/forums/t/feedback-for-e-wallet-data-model/185808
Accounting For Developers, Part II: Ledgering for a Wallet App - Modern Treasury, accessed January 10, 2026, https://www.moderntreasury.com/journal/accounting-for-developers-part-ii
Best practices for SQLite performance | App quality - Android Developers, accessed January 10, 2026, https://developer.android.com/topic/performance/sqlite-performance-best-practices
The Architect's Guide to Data Integration Patterns: Migration, Broadcast, Bi-directional, Correlation, and Aggregation | by Prayag Vakharia | Medium, accessed January 10, 2026, https://medium.com/@prayagvakharia/the-architects-guide-to-data-integration-patterns-migration-broadcast-bi-directional-a4c92b5f908d
Synchronise/update sqlite databases - Stack Overflow, accessed January 10, 2026, https://stackoverflow.com/questions/9499849/synchronise-update-sqlite-databases
The Secret Life of a Local-First Value - Marco Bambini - Substack, accessed January 10, 2026, https://substack.com/home/post/p-174526948
Offline Maps | Maps SDK | Android Docs | Mapbox, accessed January 10, 2026, https://docs.mapbox.com/android/maps/guides/offline/
Estimating Offline Usage | Help - Mapbox Documentation, accessed January 10, 2026, https://docs.mapbox.com/help/troubleshooting/estimating-offline-usage/
GPS vs Bluetooth Beacons in Construction: What's the Difference - Asset Tracking Software, accessed January 10, 2026, https://gocodes.com/asset-tracking/bluetooth-beacons-vs-gps/
BLE vs. GPS Tracking: Key Differences, Costs, Battery Life & Range - GPX Intelligence, accessed January 10, 2026, https://gpx.co/blog/ble-tracking-vs-gps-tracking/
Region Monitoring and iBeacon - Apple Developer, accessed January 10, 2026, https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/LocationAwarenessPG/RegionMonitoring/RegionMonitoring.html
iBeacon tutorial - Part 2: Background monitoring - Estimote Developer, accessed January 10, 2026, https://developer.estimote.com/ibeacon/tutorial/part-2-background-monitoring/
Mapping moving objects with Mapbox and a self-driving bus named Olli, accessed January 10, 2026, https://blog.mapbox.com/mapping-moving-objects-with-mapbox-and-a-self-driving-bus-named-olli-f6281e046b1c
Why Distance-Based Pricing Is the Future of Fair Public Transport - FAIRTIQ, accessed January 10, 2026, https://fairtiq.com/en/blog/why-distance-based-pricing-is-the-future-of-fair-public-transport
FAQs - Utah Transit Authority, accessed January 10, 2026, https://www.rideuta.com/Fares-And-Passes/Individual-Fares/Electronic-Fares/FAQs
Connection Fare Penalties: Why They Happen - Human Transit, accessed January 10, 2026, https://humantransit.org/2010/11/connection-fare-penalties-why-they-happen.html
MQTT vs Websocket | Svix Resources, accessed January 10, 2026, https://www.svix.com/resources/faq/mqtt-vs-websocket/
MQTT vs WebSocket - Which protocol to use when in 2024 - Ably Realtime, accessed January 10, 2026, https://ably.com/topic/mqtt-vs-websocket
5 Principles for Writing High-Performance Queries in PostGIS | by Carlijn van der Sluijs, accessed January 10, 2026, https://medium.com/@cfvandersluijs/5-principles-for-writing-high-performance-queries-in-postgis-bbea3ffb9830
A Deep Dive into PostGIS Nearest Neighbor Search | Crunchy Data Blog, accessed January 10, 2026, https://www.crunchydata.com/blog/a-deep-dive-into-postgis-nearest-neighbor-search
