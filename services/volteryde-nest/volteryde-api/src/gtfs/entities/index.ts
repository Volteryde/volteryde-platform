// ============================================================================
// GTFS Entities Index
// ============================================================================
// Barrel export for all GTFS entities
// Note: Order matters to avoid circular dependency issues

export { Agency } from './agency.entity';
export { Stop, LocationType, WheelchairBoarding } from './stop.entity';
export { Route, RouteType, ContinuousPickup, ContinuousDropOff } from './route.entity';
export { Calendar } from './calendar.entity';
export { CalendarDate, ExceptionType } from './calendar-date.entity';
export { Trip, DirectionId, WheelchairAccessible, BikesAllowed } from './trip.entity';
export { StopTime, PickupType, DropOffType, Timepoint } from './stop-time.entity';
export { TripSegment } from './trip-segment.entity';
export { SegmentReservation, ReservationStatus } from './segment-reservation.entity';
