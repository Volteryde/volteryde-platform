// ============================================================================
// Distance-Based Pricing Service
// ============================================================================
// Austin: Fare calculation based purely on distance traveled
// Uses H3 Resolution 7 zones for regional pricing tiers
// NO time-based or availability-based surge - pricing is predictable

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as h3 from 'h3-js';
import { H3Resolution } from './h3.constants';
import { GeoCoordinate } from './h3.types';

/**
 * Austin: Pricing zone types based on H3 Res 7 cells
 * Different zones have different base rates per km
 */
export enum PricingZoneType {
  /** Central Business District - premium pricing */
  CBD = 'CBD',
  /** Urban residential areas - standard pricing */
  URBAN = 'URBAN',
  /** Suburban areas - slightly lower pricing */
  SUBURBAN = 'SUBURBAN',
  /** Peri-urban/outskirts - lowest base rate but longer distances */
  PERIURBAN = 'PERIURBAN',
}

/**
 * Austin: Fare breakdown structure for transparency
 */
export interface FareBreakdown {
  /** Total fare in local currency (GHS for Ghana) */
  totalFare: number;
  /** Base fare - fixed charge per trip */
  baseFare: number;
  /** Distance-based charge */
  distanceCharge: number;
  /** Distance in kilometers */
  distanceKm: number;
  /** Rate per km applied */
  ratePerKm: number;
  /** Zone type for pickup location */
  pickupZone: PricingZoneType;
  /** Zone type for dropoff location */
  dropoffZone: PricingZoneType;
  /** Currency code */
  currency: string;
  /** Minimum fare applied? */
  minimumFareApplied: boolean;
  /** Booking fee (platform fee) */
  bookingFee: number;
}

/**
 * Austin: Zone configuration for pricing
 */


/**
 * Austin: Distance calculation result
 */
interface DistanceResult {
  /** Straight-line (Haversine) distance in meters */
  straightLineMeters: number;
  /** Estimated road distance in meters (typically 1.3x straight line) */
  roadDistanceMeters: number;
  /** H3 grid distance (number of cells) */
  h3GridDistance: number;
}

@Injectable()
export class DistancePricingService {
  private readonly logger = new Logger(DistancePricingService.name);

  // Austin: Pricing configuration - can be loaded from database or config
  private readonly pricingConfig = {
    // Currency for all fares
    currency: 'GHS',

    // Booking/platform fee - fixed per trip
    bookingFee: 2.0,

    // Road distance multiplier - accounts for roads not being straight
    roadDistanceMultiplier: 1.3,

    // Zone-specific pricing (GHS)
    zones: {
      [PricingZoneType.CBD]: {
        baseFare: 5.0,      // Higher base fare in CBD
        ratePerKm: 2.5,     // Premium rate per km
        minimumFare: 8.0,   // Minimum fare
      },
      [PricingZoneType.URBAN]: {
        baseFare: 4.0,
        ratePerKm: 2.0,
        minimumFare: 6.0,
      },
      [PricingZoneType.SUBURBAN]: {
        baseFare: 3.5,
        ratePerKm: 1.8,
        minimumFare: 5.0,
      },
      [PricingZoneType.PERIURBAN]: {
        baseFare: 3.0,
        ratePerKm: 1.5,
        minimumFare: 5.0,
      },
    },

    // Cross-zone pricing - when pickup and dropoff are in different zones
    // Uses weighted average of the two zone rates
    crossZoneWeighting: 0.5,
  };

  // Austin: CBD zone cells (H3 Res 7) - would be loaded from database
  // These are example cells for Accra CBD area
  private cbdCells = new Set<string>();
  private urbanCells = new Set<string>();
  private suburbanCells = new Set<string>();

  constructor(private readonly configService: ConfigService) {
    this.initializeZoneCells();
  }

  /**
   * Austin: Initialize zone cells from configuration
   * In production, these would be loaded from database
   */
  private initializeZoneCells(): void {
    // Austin: Define CBD center points and expand to H3 cells
    // Accra CBD approximate centers
    const cbdCenters = [
      { lat: 5.5560, lng: -0.1969 }, // Osu
      { lat: 5.5502, lng: -0.2074 }, // Airport area
      { lat: 5.5600, lng: -0.2200 }, // Accra Mall area
    ];

    // Urban zone centers
    const urbanCenters = [
      { lat: 5.5800, lng: -0.1800 }, // East Legon
      { lat: 5.6200, lng: -0.1700 }, // Madina
      { lat: 5.5400, lng: -0.2500 }, // Dansoman
    ];

    // Generate H3 cells for each zone
    for (const center of cbdCenters) {
      const centerCell = h3.latLngToCell(center.lat, center.lng, H3Resolution.SURGE_PRICING);
      const kRing = h3.gridDisk(centerCell, 2); // 2-ring around center
      kRing.forEach(cell => this.cbdCells.add(cell));
    }

    for (const center of urbanCenters) {
      const centerCell = h3.latLngToCell(center.lat, center.lng, H3Resolution.SURGE_PRICING);
      const kRing = h3.gridDisk(centerCell, 3); // 3-ring for larger urban areas
      kRing.forEach(cell => {
        if (!this.cbdCells.has(cell)) {
          this.urbanCells.add(cell);
        }
      });
    }

    this.logger.log(`Initialized pricing zones: CBD=${this.cbdCells.size}, Urban=${this.urbanCells.size} cells`);
  }

  // ============================================================================
  // Public API - Fare Calculation
  // ============================================================================

  /**
   * Austin: Calculate fare based on distance between two coordinates
   * This is the primary pricing method - purely distance-based
   */
  calculateFare(
    pickup: GeoCoordinate,
    dropoff: GeoCoordinate,
  ): FareBreakdown {
    // Step 1: Calculate distance
    const distance = this.calculateDistance(pickup, dropoff);
    const distanceKm = distance.roadDistanceMeters / 1000;

    // Step 2: Determine zones
    const pickupZone = this.getZoneType(pickup);
    const dropoffZone = this.getZoneType(dropoff);

    // Step 3: Calculate rate (weighted average if cross-zone)
    const ratePerKm = this.calculateEffectiveRate(pickupZone, dropoffZone);
    const baseFare = this.calculateEffectiveBaseFare(pickupZone, dropoffZone);
    const minimumFare = this.calculateEffectiveMinimumFare(pickupZone, dropoffZone);

    // Step 4: Calculate fare components
    const distanceCharge = distanceKm * ratePerKm;
    let subtotal = baseFare + distanceCharge + this.pricingConfig.bookingFee;

    // Step 5: Apply minimum fare if needed
    const minimumFareApplied = subtotal < minimumFare;
    const totalFare = Math.max(subtotal, minimumFare);

    // Austin: Round to 2 decimal places
    return {
      totalFare: this.roundCurrency(totalFare),
      baseFare: this.roundCurrency(baseFare),
      distanceCharge: this.roundCurrency(distanceCharge),
      distanceKm: Math.round(distanceKm * 100) / 100,
      ratePerKm: this.roundCurrency(ratePerKm),
      pickupZone,
      dropoffZone,
      currency: this.pricingConfig.currency,
      minimumFareApplied,
      bookingFee: this.pricingConfig.bookingFee,
    };
  }

  /**
   * Austin: Get fare estimate range (for display before booking)
   * Returns min/max based on potential route variations
   */
  getFareEstimate(
    pickup: GeoCoordinate,
    dropoff: GeoCoordinate,
  ): { minFare: number; maxFare: number; estimatedFare: number; currency: string } {
    const baseFare = this.calculateFare(pickup, dropoff);

    // Austin: ±10% range for route variations
    const variationFactor = 0.10;

    return {
      minFare: this.roundCurrency(baseFare.totalFare * (1 - variationFactor)),
      maxFare: this.roundCurrency(baseFare.totalFare * (1 + variationFactor)),
      estimatedFare: baseFare.totalFare,
      currency: baseFare.currency,
    };
  }

  /**
   * Austin: Calculate fare with actual route distance (from Mapbox)
   * Used after route is confirmed for accurate pricing
   */
  calculateFareWithRouteDistance(
    pickup: GeoCoordinate,
    dropoff: GeoCoordinate,
    actualRouteDistanceMeters: number,
  ): FareBreakdown {
    const distanceKm = actualRouteDistanceMeters / 1000;

    const pickupZone = this.getZoneType(pickup);
    const dropoffZone = this.getZoneType(dropoff);

    const ratePerKm = this.calculateEffectiveRate(pickupZone, dropoffZone);
    const baseFare = this.calculateEffectiveBaseFare(pickupZone, dropoffZone);
    const minimumFare = this.calculateEffectiveMinimumFare(pickupZone, dropoffZone);

    const distanceCharge = distanceKm * ratePerKm;
    let subtotal = baseFare + distanceCharge + this.pricingConfig.bookingFee;

    const minimumFareApplied = subtotal < minimumFare;
    const totalFare = Math.max(subtotal, minimumFare);

    return {
      totalFare: this.roundCurrency(totalFare),
      baseFare: this.roundCurrency(baseFare),
      distanceCharge: this.roundCurrency(distanceCharge),
      distanceKm: Math.round(distanceKm * 100) / 100,
      ratePerKm: this.roundCurrency(ratePerKm),
      pickupZone,
      dropoffZone,
      currency: this.pricingConfig.currency,
      minimumFareApplied,
      bookingFee: this.pricingConfig.bookingFee,
    };
  }

  // ============================================================================
  // Zone Management
  // ============================================================================

  /**
   * Austin: Determine pricing zone for a coordinate
   * Uses H3 Res 7 cells for zone lookup
   */
  getZoneType(coordinate: GeoCoordinate): PricingZoneType {
    const h3Cell = h3.latLngToCell(
      coordinate.latitude,
      coordinate.longitude,
      H3Resolution.SURGE_PRICING, // Res 7 for pricing zones
    );

    if (this.cbdCells.has(h3Cell)) {
      return PricingZoneType.CBD;
    }

    if (this.urbanCells.has(h3Cell)) {
      return PricingZoneType.URBAN;
    }

    if (this.suburbanCells.has(h3Cell)) {
      return PricingZoneType.SUBURBAN;
    }

    // Austin: Default to PERIURBAN for areas not explicitly defined
    return PricingZoneType.PERIURBAN;
  }

  /**
   * Austin: Register H3 cells for a pricing zone
   * Called from admin interface or geo-ingest service
   */
  registerZoneCells(
    zoneType: PricingZoneType,
    cells: string[],
  ): void {
    const targetSet = this.getZoneCellSet(zoneType);

    for (const cell of cells) {
      // Austin: Validate H3 cell and resolution
      if (h3.isValidCell(cell) && h3.getResolution(cell) === H3Resolution.SURGE_PRICING) {
        targetSet.add(cell);
      } else {
        this.logger.warn(`Invalid H3 cell for zone registration: ${cell}`);
      }
    }

    this.logger.log(`Registered ${cells.length} cells for zone ${zoneType}`);
  }

  /**
   * Austin: Expand a zone from center coordinates with radius
   */
  expandZoneFromCenter(
    zoneType: PricingZoneType,
    center: GeoCoordinate,
    kRingRadius: number,
  ): number {
    const centerCell = h3.latLngToCell(
      center.latitude,
      center.longitude,
      H3Resolution.SURGE_PRICING,
    );

    const cells = h3.gridDisk(centerCell, kRingRadius);
    const targetSet = this.getZoneCellSet(zoneType);

    let added = 0;
    for (const cell of cells) {
      if (!this.isInAnyZone(cell)) {
        targetSet.add(cell);
        added++;
      }
    }

    return added;
  }

  // ============================================================================
  // Distance Calculations
  // ============================================================================

  /**
   * Austin: Calculate distance between two coordinates
   * Returns both straight-line and estimated road distance
   */
  calculateDistance(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
  ): DistanceResult {
    // Haversine formula for straight-line distance
    const straightLineMeters = this.haversineDistance(origin, destination);

    // Austin: Estimate road distance using multiplier
    // Roads are typically ~1.3x longer than straight line in urban areas
    const roadDistanceMeters = straightLineMeters * this.pricingConfig.roadDistanceMultiplier;

    // H3 grid distance for reference
    const originCell = h3.latLngToCell(
      origin.latitude,
      origin.longitude,
      H3Resolution.PICKUP_POINT,
    );
    const destCell = h3.latLngToCell(
      destination.latitude,
      destination.longitude,
      H3Resolution.PICKUP_POINT,
    );
    const h3GridDistance = h3.gridDistance(originCell, destCell);

    return {
      straightLineMeters,
      roadDistanceMeters,
      h3GridDistance,
    };
  }

  /**
   * Austin: Haversine formula for great-circle distance
   * Accurate for short distances in urban environments
   */
  private haversineDistance(
    coord1: GeoCoordinate,
    coord2: GeoCoordinate,
  ): number {
    const R = 6371000; // Earth's radius in meters

    const lat1Rad = (coord1.latitude * Math.PI) / 180;
    const lat2Rad = (coord2.latitude * Math.PI) / 180;
    const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // ============================================================================
  // Rate Calculations
  // ============================================================================

  /**
   * Austin: Calculate effective rate for cross-zone trips
   */
  private calculateEffectiveRate(
    pickupZone: PricingZoneType,
    dropoffZone: PricingZoneType,
  ): number {
    const pickupConfig = this.pricingConfig.zones[pickupZone];
    const dropoffConfig = this.pricingConfig.zones[dropoffZone];

    if (pickupZone === dropoffZone) {
      return pickupConfig.ratePerKm;
    }

    // Austin: Weighted average for cross-zone trips
    const weight = this.pricingConfig.crossZoneWeighting;
    return (pickupConfig.ratePerKm * weight) + (dropoffConfig.ratePerKm * (1 - weight));
  }

  private calculateEffectiveBaseFare(
    pickupZone: PricingZoneType,
    dropoffZone: PricingZoneType,
  ): number {
    const pickupConfig = this.pricingConfig.zones[pickupZone];
    const dropoffConfig = this.pricingConfig.zones[dropoffZone];

    if (pickupZone === dropoffZone) {
      return pickupConfig.baseFare;
    }

    const weight = this.pricingConfig.crossZoneWeighting;
    return (pickupConfig.baseFare * weight) + (dropoffConfig.baseFare * (1 - weight));
  }

  private calculateEffectiveMinimumFare(
    pickupZone: PricingZoneType,
    dropoffZone: PricingZoneType,
  ): number {
    const pickupConfig = this.pricingConfig.zones[pickupZone];
    const dropoffConfig = this.pricingConfig.zones[dropoffZone];

    // Austin: Use the higher minimum fare to ensure profitability
    return Math.max(pickupConfig.minimumFare, dropoffConfig.minimumFare);
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private getZoneCellSet(zoneType: PricingZoneType): Set<string> {
    switch (zoneType) {
      case PricingZoneType.CBD:
        return this.cbdCells;
      case PricingZoneType.URBAN:
        return this.urbanCells;
      case PricingZoneType.SUBURBAN:
        return this.suburbanCells;
      default:
        // Austin: PERIURBAN doesn't need explicit cells - it's the default
        return new Set();
    }
  }

  private isInAnyZone(cell: string): boolean {
    return this.cbdCells.has(cell) ||
      this.urbanCells.has(cell) ||
      this.suburbanCells.has(cell);
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // ============================================================================
  // Admin/Configuration Methods
  // ============================================================================

  /**
   * Austin: Get current pricing configuration
   * For admin dashboard display
   */
  getPricingConfig(): typeof this.pricingConfig {
    return { ...this.pricingConfig };
  }

  /**
   * Austin: Update zone pricing (admin only)
   */
  updateZonePricing(
    zoneType: PricingZoneType,
    baseFare?: number,
    ratePerKm?: number,
    minimumFare?: number,
  ): void {
    const zoneConfig = this.pricingConfig.zones[zoneType];

    if (baseFare !== undefined) {
      zoneConfig.baseFare = baseFare;
    }
    if (ratePerKm !== undefined) {
      zoneConfig.ratePerKm = ratePerKm;
    }
    if (minimumFare !== undefined) {
      zoneConfig.minimumFare = minimumFare;
    }

    this.logger.log(`Updated pricing for zone ${zoneType}:`, zoneConfig);
  }

  /**
   * Austin: Get zone statistics for analytics
   */
  getZoneStats(): Record<PricingZoneType, { cellCount: number; config: object }> {
    return {
      [PricingZoneType.CBD]: {
        cellCount: this.cbdCells.size,
        config: this.pricingConfig.zones[PricingZoneType.CBD],
      },
      [PricingZoneType.URBAN]: {
        cellCount: this.urbanCells.size,
        config: this.pricingConfig.zones[PricingZoneType.URBAN],
      },
      [PricingZoneType.SUBURBAN]: {
        cellCount: this.suburbanCells.size,
        config: this.pricingConfig.zones[PricingZoneType.SUBURBAN],
      },
      [PricingZoneType.PERIURBAN]: {
        cellCount: 0, // Default zone, no explicit cells
        config: this.pricingConfig.zones[PricingZoneType.PERIURBAN],
      },
    };
  }
}
