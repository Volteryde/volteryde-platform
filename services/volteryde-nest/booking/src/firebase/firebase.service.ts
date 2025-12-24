import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
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
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set. Firebase will not be initialized.');
      return;
    }

    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

    if (!fs.existsSync(absolutePath)) {
      this.logger.warn(`Firebase service account file not found at: ${absolutePath}. Firebase will not be initialized.`);
      return;
    }

    try {
      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.logger.warn('Continuing without Firebase support.');
    }
  }

  getMessaging(): admin.messaging.Messaging {
    if (!this.app) {
      this.logger.warn('Firebase app not initialized. Push notifications will not be sent.');
      return null;
    }
    return this.app.messaging();
  }
}
