import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  public app: admin.app.App;

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      this.logger.error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set.');
      throw new InternalServerErrorException('Firebase service account path is not configured.');
    }

    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

    if (!fs.existsSync(absolutePath)) {
      this.logger.error(`Firebase service account file not found at: ${absolutePath}`);
      throw new InternalServerErrorException('Firebase service account file not found.');
    }

    try {
      const serviceAccount = require(absolutePath);

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw new InternalServerErrorException('Failed to initialize Firebase Admin SDK.');
    }
  }

  getMessaging(): admin.messaging.Messaging {
    if (!this.app) {
      throw new InternalServerErrorException('Firebase app not initialized.');
    }
    return this.app.messaging();
  }
}
