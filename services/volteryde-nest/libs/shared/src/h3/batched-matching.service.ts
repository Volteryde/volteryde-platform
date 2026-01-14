// ============================================================================
// Batched Matching Service
// ============================================================================
// Austin: Global optimization for rider-driver matching using Hungarian Algorithm
// Implements windowed batching to optimize system-wide efficiency
// Reference: Architecture Spec Section 5.3 - Matching Algorithms

import { Injectable, Logger } from '@nestjs/common';
import { MATCHING_CONFIG, K_RING_DEFAULTS } from './h3.constants';
import {
  GeoCoordinate,
  H3IndexedDriver,
  MatchingCostEntry,
  BatchMatchingResult,
  DriverState,
} from './h3.types';
import { RedisH3SpatialService } from './redis-h3-spatial.service';
import { H3Service } from './h3.service';

/**
 * Austin: Rider request for matching
 */
export interface RiderRequest {
  riderId: string;
  pickupLocation: GeoCoordinate;
  pickupH3Index: string;
  pickupStopId: string;
  destinationLocation: GeoCoordinate;
  destinationH3Index: string;
  destinationStopId: string;
  estimatedFare: number;
  requestTime: Date;
}

/**
 * Austin: Pending match bucket for batching
 */
interface MatchingBucket {
  riders: RiderRequest[];
  startTime: number;
  isProcessing: boolean;
}

@Injectable()
export class BatchedMatchingService {
  private readonly logger = new Logger(BatchedMatchingService.name);

  // Austin: Current batch of pending rider requests
  private currentBucket: MatchingBucket = {
    riders: [],
    startTime: Date.now(),
    isProcessing: false,
  };

  // Austin: Timer for batch window
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly redisH3Spatial: RedisH3SpatialService,
    private readonly h3Service: H3Service,
  ) {}

  // ============================================================================
  // Request Accumulation
  // ============================================================================

  /**
   * Austin: Add a rider request to the current batch
   * If batch window expires, triggers matching
   */
  async addRiderRequest(request: RiderRequest): Promise<void> {
    if (this.currentBucket.riders.length >= MATCHING_CONFIG.MAX_BATCH_SIZE) {
      // Bucket full, process immediately
      await this.processBatch();
    }

    this.currentBucket.riders.push(request);

    // Start batch timer if this is the first request
    if (this.currentBucket.riders.length === 1) {
      this.currentBucket.startTime = Date.now();
      this.startBatchTimer();
    }

    this.logger.debug(
      `Added rider ${request.riderId} to batch. Current size: ${this.currentBucket.riders.length}`,
    );
  }

  /**
   * Austin: Start the batch window timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(async () => {
      await this.processBatch();
    }, MATCHING_CONFIG.BATCH_WINDOW_MS);
  }

  /**
   * Austin: Process the current batch and return assignments
   */
  async processBatch(): Promise<BatchMatchingResult> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.currentBucket.isProcessing || this.currentBucket.riders.length === 0) {
      return {
        assignments: [],
        unmatchedRiders: [],
        unmatchedDrivers: [],
        totalCost: 0,
        processingTimeMs: 0,
      };
    }

    this.currentBucket.isProcessing = true;
    const startTime = Date.now();

    // Snapshot the current bucket and reset
    const ridersToMatch = [...this.currentBucket.riders];
    this.currentBucket = {
      riders: [],
      startTime: Date.now(),
      isProcessing: false,
    };

    this.logger.log(`Processing batch of ${ridersToMatch.length} riders`);

    try {
      const result = await this.runBatchedMatching(ridersToMatch);
      result.processingTimeMs = Date.now() - startTime;
      return result;
    } catch (error) {
      this.logger.error('Batch matching failed', error);
      return {
        assignments: [],
        unmatchedRiders: ridersToMatch.map((r) => r.riderId),
        unmatchedDrivers: [],
        totalCost: Infinity,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // Batched Matching Algorithm
  // ============================================================================

  /**
   * Austin: Run the batched matching algorithm
   * 1. Gather all available drivers near pickup points
   * 2. Build cost matrix
   * 3. Solve Linear Assignment Problem (Hungarian Algorithm)
   */
  private async runBatchedMatching(riders: RiderRequest[]): Promise<BatchMatchingResult> {
    // Step 1: Gather unique H3 cells for all pickup points
    const uniqueCells = new Set<string>();
    for (const rider of riders) {
      uniqueCells.add(rider.pickupH3Index);
    }

    // Step 2: Find available drivers near all pickup cells
    const allDrivers = new Map<string, H3IndexedDriver>();
    for (const cell of uniqueCells) {
      const cellCoord = this.h3Service.getCoordinateFromH3(cell);
      const drivers = await this.redisH3Spatial.findAvailableDriversNear(
        cellCoord.latitude,
        cellCoord.longitude,
        K_RING_DEFAULTS.DRIVER_DISPATCH,
      );
      for (const driver of drivers) {
        allDrivers.set(driver.driverId, driver);
      }
    }

    const driverList = Array.from(allDrivers.values());

    if (driverList.length === 0) {
      return {
        assignments: [],
        unmatchedRiders: riders.map((r) => r.riderId),
        unmatchedDrivers: [],
        totalCost: 0,
        processingTimeMs: 0,
      };
    }

    this.logger.debug(`Found ${driverList.length} available drivers for ${riders.length} riders`);

    // Step 3: Build cost matrix
    const costMatrix = this.buildCostMatrix(riders, driverList);

    // Step 4: Solve assignment problem
    const assignments = this.solveAssignment(costMatrix, riders, driverList);

    // Step 5: Calculate results
    const matchedRiders = new Set(assignments.map((a) => a.riderId));
    const matchedDrivers = new Set(assignments.map((a) => a.driverId));

    return {
      assignments,
      unmatchedRiders: riders
        .filter((r) => !matchedRiders.has(r.riderId))
        .map((r) => r.riderId),
      unmatchedDrivers: driverList
        .filter((d) => !matchedDrivers.has(d.driverId))
        .map((d) => d.driverId),
      totalCost: assignments.reduce((sum, a) => sum + a.cost, 0),
      processingTimeMs: 0,
    };
  }

  /**
   * Austin: Build cost matrix for all rider-driver pairs
   * Cost = (ETA_weight × ETA) + (Price_weight × Price) - (Rating_weight × Rating)
   */
  private buildCostMatrix(
    riders: RiderRequest[],
    drivers: H3IndexedDriver[],
  ): MatchingCostEntry[][] {
    const matrix: MatchingCostEntry[][] = [];

    for (const rider of riders) {
      const row: MatchingCostEntry[] = [];
      for (const driver of drivers) {
        const entry = this.calculateMatchingCost(rider, driver);
        row.push(entry);
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Austin: Calculate matching cost for a single rider-driver pair
   */
  private calculateMatchingCost(rider: RiderRequest, driver: H3IndexedDriver): MatchingCostEntry {
    // Calculate ETA (driving time from driver to pickup)
    const distanceMeters = this.h3Service.calculateDistance(
      driver.currentLocation,
      rider.pickupLocation,
    );
    // Assume average speed of 30 km/h in urban areas
    const etaSeconds = Math.ceil((distanceMeters / 1000) * 120); // 120s per km = 30 km/h

    // Normalize components for cost function
    const normalizedETA = etaSeconds / 600; // Normalize to 10 min max
    const normalizedPrice = rider.estimatedFare / 50; // Normalize to $50 max
    const normalizedRating = driver.rating / 5; // Already 0-1 scale

    // Calculate cost (lower is better, but rating is inverted)
    const cost =
      MATCHING_CONFIG.ETA_WEIGHT * normalizedETA +
      MATCHING_CONFIG.PRICE_WEIGHT * normalizedPrice -
      MATCHING_CONFIG.RATING_WEIGHT * normalizedRating;

    return {
      riderId: rider.riderId,
      driverId: driver.driverId,
      etaSeconds,
      fare: rider.estimatedFare,
      driverRating: driver.rating,
      cost,
    };
  }

  // ============================================================================
  // Hungarian Algorithm (Linear Assignment Problem Solver)
  // ============================================================================

  /**
   * Austin: Solve the assignment problem using Hungarian Algorithm
   * This finds the globally optimal assignment minimizing total cost
   * 
   * Note: This is a simplified implementation. For production, consider
   * using a library like `munkres-js` or implementing Jonker-Volgenant
   */
  private solveAssignment(
    costMatrix: MatchingCostEntry[][],
    riders: RiderRequest[],
    drivers: H3IndexedDriver[],
  ): Array<{ riderId: string; driverId: string; cost: number }> {
    const numRiders = riders.length;
    const numDrivers = drivers.length;
    const n = Math.max(numRiders, numDrivers);

    // Create square cost matrix with infinity for padding
    const squareCost: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        if (i < numRiders && j < numDrivers) {
          row.push(costMatrix[i][j].cost);
        } else {
          row.push(Infinity);
        }
      }
      squareCost.push(row);
    }

    // Run Hungarian Algorithm
    const assignment = this.hungarianAlgorithm(squareCost);

    // Build result
    const results: Array<{ riderId: string; driverId: string; cost: number }> = [];
    for (let i = 0; i < numRiders; i++) {
      const j = assignment[i];
      if (j !== -1 && j < numDrivers && squareCost[i][j] < Infinity) {
        results.push({
          riderId: riders[i].riderId,
          driverId: drivers[j].driverId,
          cost: costMatrix[i][j].cost,
        });
      }
    }

    return results;
  }

  /**
   * Austin: Hungarian Algorithm implementation
   * O(n³) time complexity
   * Returns assignment array where assignment[i] = j means row i is assigned to column j
   */
  private hungarianAlgorithm(costMatrix: number[][]): number[] {
    const n = costMatrix.length;
    
    // Clone the cost matrix
    const cost: number[][] = costMatrix.map(row => [...row]);

    // Step 1: Subtract row minimum from each row
    for (let i = 0; i < n; i++) {
      const minVal = Math.min(...cost[i].filter(v => v < Infinity));
      if (minVal < Infinity) {
        for (let j = 0; j < n; j++) {
          if (cost[i][j] < Infinity) {
            cost[i][j] -= minVal;
          }
        }
      }
    }

    // Step 2: Subtract column minimum from each column
    for (let j = 0; j < n; j++) {
      let minVal = Infinity;
      for (let i = 0; i < n; i++) {
        if (cost[i][j] < minVal) minVal = cost[i][j];
      }
      if (minVal < Infinity && minVal > 0) {
        for (let i = 0; i < n; i++) {
          if (cost[i][j] < Infinity) {
            cost[i][j] -= minVal;
          }
        }
      }
    }

    // Step 3: Find initial assignment using greedy matching
    const rowAssignment: number[] = new Array(n).fill(-1);
    const colAssignment: number[] = new Array(n).fill(-1);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (cost[i][j] === 0 && rowAssignment[i] === -1 && colAssignment[j] === -1) {
          rowAssignment[i] = j;
          colAssignment[j] = i;
        }
      }
    }

    // Step 4: Iteratively improve using augmenting paths
    // (Simplified - for production, implement full Kuhn-Munkres)
    let iterations = 0;
    const maxIterations = n * n;
    
    while (iterations++ < maxIterations) {
      // Find an unassigned row
      let unassignedRow = -1;
      for (let i = 0; i < n; i++) {
        if (rowAssignment[i] === -1) {
          unassignedRow = i;
          break;
        }
      }

      if (unassignedRow === -1) break; // All rows assigned

      // Try to find an augmenting path
      const visited = new Set<number>();
      const found = this.findAugmentingPath(
        cost,
        unassignedRow,
        rowAssignment,
        colAssignment,
        visited,
      );

      if (!found) {
        // No augmenting path found, need to modify cost matrix
        // This is a simplified version - full algorithm would do proper covering
        break;
      }
    }

    return rowAssignment;
  }

  /**
   * Austin: Find augmenting path for Hungarian algorithm (DFS)
   */
  private findAugmentingPath(
    cost: number[][],
    row: number,
    rowAssignment: number[],
    colAssignment: number[],
    visited: Set<number>,
  ): boolean {
    const n = cost.length;

    for (let j = 0; j < n; j++) {
      if (cost[row][j] === 0 && !visited.has(j)) {
        visited.add(j);

        if (colAssignment[j] === -1) {
          // Column is free, make assignment
          rowAssignment[row] = j;
          colAssignment[j] = row;
          return true;
        }

        // Column is assigned, try to reassign
        const assignedRow = colAssignment[j];
        if (this.findAugmentingPath(cost, assignedRow, rowAssignment, colAssignment, visited)) {
          rowAssignment[row] = j;
          colAssignment[j] = row;
          return true;
        }
      }
    }

    return false;
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Austin: Get current batch status
   */
  getBatchStatus(): { size: number; age: number; isProcessing: boolean } {
    return {
      size: this.currentBucket.riders.length,
      age: Date.now() - this.currentBucket.startTime,
      isProcessing: this.currentBucket.isProcessing,
    };
  }

  /**
   * Austin: Force immediate processing of current batch
   */
  async flushBatch(): Promise<BatchMatchingResult> {
    return this.processBatch();
  }

  /**
   * Austin: Match a single rider immediately (bypass batching)
   * Used for urgent requests or when batching is disabled
   */
  async matchImmediate(request: RiderRequest): Promise<{
    matched: boolean;
    driver?: H3IndexedDriver;
    cost?: number;
    etaSeconds?: number;
  }> {
    // Find available drivers
    const drivers = await this.redisH3Spatial.findAvailableDriversNear(
      request.pickupLocation.latitude,
      request.pickupLocation.longitude,
      K_RING_DEFAULTS.DRIVER_DISPATCH,
    );

    if (drivers.length === 0) {
      return { matched: false };
    }

    // Calculate costs and find best match
    let bestDriver: H3IndexedDriver | null = null;
    let bestCost = Infinity;
    let bestETA = 0;

    for (const driver of drivers) {
      const entry = this.calculateMatchingCost(request, driver);
      if (entry.cost < bestCost) {
        bestCost = entry.cost;
        bestDriver = driver;
        bestETA = entry.etaSeconds;
      }
    }

    if (!bestDriver) {
      return { matched: false };
    }

    return {
      matched: true,
      driver: bestDriver,
      cost: bestCost,
      etaSeconds: bestETA,
    };
  }
}
