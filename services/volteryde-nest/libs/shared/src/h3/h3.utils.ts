// ============================================================================
// H3 Geospatial Utilities
// ============================================================================
// Austin: Pure utility functions for H3 operations
// No dependencies on NestJS - can be used anywhere

import * as h3 from 'h3-js';
import { H3Resolution, K_RING_RADIUS_METERS, WALKING_ASSUMPTIONS } from './h3.constants';
import { GeoCoordinate, H3IndexedCoordinate } from './h3.types';

/**
 * Austin: Convert lat/lng to H3 index at specified resolution
 * This is the core indexing operation - O(1) complexity
 */
export function latLngToH3(lat: number, lng: number, resolution: H3Resolution = H3Resolution.PICKUP_POINT): string {
  return h3.latLngToCell(lat, lng, resolution);
}

/**
 * Austin: Convert H3 index back to center lat/lng
 */
export function h3ToLatLng(h3Index: string): GeoCoordinate {
  const [lat, lng] = h3.cellToLatLng(h3Index);
  return { latitude: lat, longitude: lng };
}

/**
 * Austin: Get H3 indices at multiple resolutions for a coordinate
 * Pre-computing these avoids repeated H3 calculations
 */
export function getMultiResolutionH3Indices(lat: number, lng: number): H3IndexedCoordinate {
  return {
    latitude: lat,
    longitude: lng,
    h3Res10: h3.latLngToCell(lat, lng, H3Resolution.PICKUP_POINT),
    h3Res8: h3.latLngToCell(lat, lng, H3Resolution.DRIVER_DISCOVERY),
    h3Res6: h3.latLngToCell(lat, lng, H3Resolution.SHARD),
  };
}

/**
 * Austin: K-ring expansion for proximity search
 * Returns center cell + all cells within k rings
 * 
 * k=0: 1 cell (center only)
 * k=1: 7 cells (center + 6 neighbors)
 * k=2: 19 cells (center + 18 neighbors)
 * k=3: 37 cells
 */
export function getKRingCells(h3Index: string, k: number): string[] {
  return h3.gridDisk(h3Index, k);
}

/**
 * Austin: Get only the outer ring at distance k (not including inner rings)
 * Useful for incremental expansion searches
 */
export function getRingAtDistance(h3Index: string, k: number): string[] {
  return h3.gridRingUnsafe(h3Index, k);
}

/**
 * Austin: Check if two H3 indices are neighbors (share an edge)
 */
export function areNeighbors(h3Index1: string, h3Index2: string): boolean {
  return h3.areNeighborCells(h3Index1, h3Index2);
}

/**
 * Austin: Get the grid distance between two H3 cells
 * This is topological distance (number of cells), not physical distance
 */
export function getGridDistance(h3Index1: string, h3Index2: string): number {
  try {
    return h3.gridDistance(h3Index1, h3Index2);
  } catch {
    // Cells might be in different resolutions or too far apart
    return -1;
  }
}

/**
 * Austin: Calculate Haversine distance between two coordinates
 * Used for precise distance after H3 coarse filtering
 */
export function haversineDistanceMeters(coord1: GeoCoordinate, coord2: GeoCoordinate): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Austin: Estimate walking time in seconds based on distance
 */
export function estimateWalkingTimeSeconds(distanceMeters: number): number {
  return Math.ceil(distanceMeters / WALKING_ASSUMPTIONS.AVG_SPEED_MPS);
}

/**
 * Austin: Check if a coordinate is within a specific H3 cell
 * O(1) set membership check
 */
export function isCoordinateInCell(coord: GeoCoordinate, targetH3Index: string, resolution?: number): boolean {
  const res = resolution ?? h3.getResolution(targetH3Index);
  const coordH3 = h3.latLngToCell(coord.latitude, coord.longitude, res);
  return coordH3 === targetH3Index;
}

/**
 * Austin: Check if coordinate is in or near a target cell (k-ring inclusion)
 * Used for geofence arrival detection with buffer
 */
export function isCoordinateNearCell(
  coord: GeoCoordinate,
  targetH3Index: string,
  kBuffer: number = 1,
): boolean {
  const resolution = h3.getResolution(targetH3Index);
  const coordH3 = h3.latLngToCell(coord.latitude, coord.longitude, resolution);
  
  // Quick check: exact match
  if (coordH3 === targetH3Index) return true;
  
  // Check if within k-ring
  const kRingCells = new Set(h3.gridDisk(targetH3Index, kBuffer));
  return kRingCells.has(coordH3);
}

/**
 * Austin: Get approximate radius in meters for a k-ring at Resolution 10
 */
export function getKRingRadiusMeters(k: number): number {
  return K_RING_RADIUS_METERS[k] ?? k * 130; // Approximate 130m per ring at Res 10
}

/**
 * Austin: Get parent cell at a coarser resolution
 * Used for hierarchical queries (fine-to-coarse)
 */
export function getParentCell(h3Index: string, parentResolution: number): string {
  return h3.cellToParent(h3Index, parentResolution);
}

/**
 * Austin: Get child cells at a finer resolution
 * Used for drill-down queries (coarse-to-fine)
 */
export function getChildCells(h3Index: string, childResolution: number): string[] {
  return h3.cellToChildren(h3Index, childResolution);
}

/**
 * Austin: Get the hexagonal boundary as lat/lng polygon
 * Useful for map visualization
 */
export function getCellBoundary(h3Index: string): GeoCoordinate[] {
  const boundary = h3.cellToBoundary(h3Index);
  return boundary.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
}

/**
 * Austin: Validate H3 index string
 */
export function isValidH3Index(h3Index: string): boolean {
  return h3.isValidCell(h3Index);
}

/**
 * Austin: Get the resolution of an H3 index
 */
export function getH3Resolution(h3Index: string): number {
  return h3.getResolution(h3Index);
}

/**
 * Austin: Compact a set of H3 indices to their most efficient representation
 * Useful for storage optimization
 */
export function compactH3Set(h3Indices: string[]): string[] {
  return h3.compactCells(h3Indices);
}

/**
 * Austin: Uncompact H3 indices to a specific resolution
 */
export function uncompactH3Set(h3Indices: string[], resolution: number): string[] {
  return h3.uncompactCells(h3Indices, resolution);
}

/**
 * Austin: Simple Kalman filter for GPS smoothing
 * Reduces GPS jitter for more stable H3 indexing
 */
export class SimpleKalmanFilter {
  private lat: number;
  private lng: number;
  private variance: number;
  private readonly processNoise: number;
  private initialized: boolean = false;

  constructor(processNoise: number = 0.00001) {
    this.lat = 0;
    this.lng = 0;
    this.variance = 1;
    this.processNoise = processNoise;
  }

  /**
   * Austin: Update filter with new measurement and return smoothed position
   */
  update(lat: number, lng: number, accuracy: number): GeoCoordinate {
    // Measurement noise based on GPS accuracy
    const measurementNoise = accuracy * 0.00001;

    if (!this.initialized) {
      this.lat = lat;
      this.lng = lng;
      this.variance = measurementNoise;
      this.initialized = true;
      return { latitude: lat, longitude: lng };
    }

    // Prediction step
    this.variance += this.processNoise;

    // Update step
    const kalmanGain = this.variance / (this.variance + measurementNoise);
    this.lat = this.lat + kalmanGain * (lat - this.lat);
    this.lng = this.lng + kalmanGain * (lng - this.lng);
    this.variance = (1 - kalmanGain) * this.variance;

    return { latitude: this.lat, longitude: this.lng };
  }

  /**
   * Austin: Reset the filter state
   */
  reset(): void {
    this.initialized = false;
    this.variance = 1;
  }

  /**
   * Austin: Get current filtered position
   */
  getCurrentPosition(): GeoCoordinate | null {
    if (!this.initialized) return null;
    return { latitude: this.lat, longitude: this.lng };
  }
}

/**
 * Austin: Calculate bearing between two coordinates (in degrees)
 */
export function calculateBearing(from: GeoCoordinate, to: GeoCoordinate): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180;

  const x = Math.sin(deltaLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  const bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Austin: Get edge length in meters for a given resolution
 * Approximate values for mid-latitudes
 */
export function getEdgeLengthMeters(resolution: number): number {
  const edgeLengths: Record<number, number> = {
    0: 1107712.59,
    1: 418676.01,
    2: 158244.65,
    3: 59810.86,
    4: 22606.38,
    5: 8544.41,
    6: 3229.48,
    7: 1220.63,
    8: 461.35,
    9: 174.38,
    10: 65.91,
    11: 24.91,
    12: 9.42,
    13: 3.56,
    14: 1.35,
    15: 0.51,
  };
  return edgeLengths[resolution] ?? 0;
}

/**
 * Austin: Get approximate cell area in square kilometers
 */
export function getCellAreaKm2(resolution: number): number {
  const areas: Record<number, number> = {
    0: 4250546.85,
    1: 607220.98,
    2: 86745.85,
    3: 12392.26,
    4: 1770.32,
    5: 252.90,
    6: 36.13,
    7: 5.16,
    8: 0.74,
    9: 0.10,
    10: 0.015,
    11: 0.002,
    12: 0.0003,
    13: 0.00004,
    14: 0.000006,
    15: 0.0000009,
  };
  return areas[resolution] ?? 0;
}
