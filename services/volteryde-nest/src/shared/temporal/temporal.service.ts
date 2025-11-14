// ============================================================================
// Temporal Service for NestJS
// ============================================================================
// This service provides a wrapper around the Temporal client for use in NestJS

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Connection } from '@temporalio/client';

@Injectable()
export class TemporalService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TemporalService.name);
  private client: Client | null = null;
  private connection: Connection | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize Temporal client on module startup
   */
  async onModuleInit() {
    try {
      const address = this.configService.get<string>('TEMPORAL_ADDRESS', 'localhost:7233');
      const namespace = this.configService.get<string>('TEMPORAL_NAMESPACE', 'default');

      this.logger.log(`Connecting to Temporal server at ${address}`);

      // Create connection
      this.connection = await Connection.connect({ address });

      // Create client
      this.client = new Client({
        connection: this.connection,
        namespace,
      });

      this.logger.log('✓ Successfully connected to Temporal server');
    } catch (error) {
      this.logger.error('Failed to connect to Temporal server:', error);
      this.logger.warn('Temporal workflows will not be available');
      // Don't throw - allow the service to start even if Temporal is unavailable
    }
  }

  /**
   * Cleanup on module destruction
   */
  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
      this.logger.log('Temporal connection closed');
    }
  }

  /**
   * Get the Temporal client
   * @throws Error if client is not initialized
   */
  getClient(): Client {
    if (!this.client) {
      throw new Error('Temporal client is not initialized. Check server connection.');
    }
    return this.client;
  }

  /**
   * Check if Temporal client is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Start a workflow
   * 
   * @param workflowType - The workflow function name
   * @param args - Arguments to pass to the workflow
   * @param options - Workflow execution options
   * @returns Workflow handle
   */
  async startWorkflow<T = any>(
    workflowType: string,
    args: any[],
    options: {
      taskQueue: string;
      workflowId?: string;
    },
  ) {
    const client = this.getClient();

    const workflowId = options.workflowId || `${workflowType}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    this.logger.log(`Starting workflow: ${workflowType} (${workflowId})`);

    try {
      const handle = await client.workflow.start(workflowType, {
        taskQueue: options.taskQueue,
        workflowId,
        args,
      });

      this.logger.log(`✓ Workflow started: ${handle.workflowId}`);

      return {
        workflowId: handle.workflowId,
        runId: handle.firstExecutionRunId,
        handle,
      };
    } catch (error) {
      this.logger.error(`Failed to start workflow ${workflowType}:`, error);
      throw error;
    }
  }

  /**
   * Get workflow result
   * 
   * @param workflowId - The workflow ID
   * @returns Workflow result
   */
  async getWorkflowResult<T = any>(workflowId: string): Promise<T> {
    const client = this.getClient();

    try {
      const handle = client.workflow.getHandle(workflowId);
      const result = await handle.result();
      return result as T;
    } catch (error) {
      this.logger.error(`Failed to get workflow result for ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Query a workflow
   * 
   * @param workflowId - The workflow ID
   * @param queryType - The query name
   * @param args - Query arguments
   * @returns Query result
   */
  async queryWorkflow<T = any>(workflowId: string, queryType: string, ...args: any[]): Promise<T> {
    const client = this.getClient();

    try {
      const handle = client.workflow.getHandle(workflowId);
      const result = await handle.query(queryType, ...args);
      return result as T;
    } catch (error) {
      this.logger.error(`Failed to query workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a workflow
   * 
   * @param workflowId - The workflow ID
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    const client = this.getClient();

    try {
      const handle = client.workflow.getHandle(workflowId);
      await handle.cancel();
      this.logger.log(`✓ Workflow cancelled: ${workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Terminate a workflow
   * 
   * @param workflowId - The workflow ID
   * @param reason - Termination reason
   */
  async terminateWorkflow(workflowId: string, reason?: string): Promise<void> {
    const client = this.getClient();

    try {
      const handle = client.workflow.getHandle(workflowId);
      await handle.terminate(reason);
      this.logger.log(`✓ Workflow terminated: ${workflowId}`);
    } catch (error) {
      this.logger.error(`Failed to terminate workflow ${workflowId}:`, error);
      throw error;
    }
  }
}
