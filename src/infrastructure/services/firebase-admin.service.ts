import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';

import { getMessaging } from 'firebase-admin/messaging';
import type { Messaging } from 'firebase-admin/messaging';

const FIREBASE_APP_NAME = 'prowash-backend';

@Injectable()
export class FirebaseAdminService {
  private readonly messagingClient: Messaging;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.getOrThrow<string>(
      'FIREBASE_PROJECT_ID',
    );

    this.configService.getOrThrow<string>('GOOGLE_APPLICATION_CREDENTIALS');

    const existingApp = getApps().find((app) => app.name === FIREBASE_APP_NAME);

    const firebaseApp =
      existingApp ??
      initializeApp(
        {
          credential: applicationDefault(),
          projectId,
        },
        FIREBASE_APP_NAME,
      );

    this.messagingClient = getMessaging(firebaseApp);
  }

  getMessaging(): Messaging {
    return this.messagingClient;
  }
}
