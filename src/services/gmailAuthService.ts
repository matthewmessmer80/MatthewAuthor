import {
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
} from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { auth } from './firebase';
import { siteSettingsService, GmailIntegrationSettings } from './siteSettingsService';
import configJson from '../../firebase-applet-config.json';

export const ADMIN_GMAIL_ACCOUNT = 'breathwovenproductions@gmail.com';
export const DEVELOPER_ACCOUNT = 'mmessmer80@gmail.com';
export const GCP_PROJECT_ID = configJson.projectId || 'gen-lang-client-0633133056';
export const GCP_CONSENT_URL = `https://console.cloud.google.com/apis/credentials/consent?project=${GCP_PROJECT_ID}`;
export const GCP_AUDIENCE_URL = `https://console.cloud.google.com/auth/audience?project=${GCP_PROJECT_ID}`;
const GMAIL_COMPOSE_SCOPE = 'https://www.googleapis.com/auth/gmail.compose';

// In-memory token cache (strictly memory-only, never persisted in storage or Firestore)
let cachedAccessToken: string | null = null;

export interface GmailAuthResult {
  success: boolean;
  error?: string;
  isTesterError?: boolean;
  gcpConsoleUrl?: string;
  gcpAudienceUrl?: string;
  accountToAdd?: string;
  developerAccount?: string;
  status?: GmailIntegrationSettings;
}

class GmailAuthService {
  /**
   * Returns in-memory access token if available.
   */
  public getInMemoryToken(): string | null {
    return cachedAccessToken;
  }

  /**
   * Sets in-memory token (e.g., from GIS callback).
   */
  public setInMemoryToken(token: string | null): void {
    cachedAccessToken = token;
  }

  /**
   * Connects Gmail via Google Identity Services or isolated secondary auth.
   * Strictly restricted to Author role.
   * NEVER overwrites the Author's active user session (mmessmer80@gmail.com).
   */
  public async connectGmail(
    isAuthor: boolean,
    authorEmail?: string
  ): Promise<GmailAuthResult> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Only the Author role can configure administrative Gmail integration.',
      };
    }

    // METHOD 1: Google Identity Services (GIS) token client (Standard Google Workspace pattern)
    // Runs client-side token flow without modifying the primary Firebase Auth user session!
    const oAuthClientId = (configJson as any).oAuthClientId;
    const googleObj = typeof window !== 'undefined' ? (window as any).google : null;

    if (googleObj?.accounts?.oauth2 && oAuthClientId) {
      try {
        const tokenResult = await new Promise<{ access_token?: string; error?: any }>((resolve) => {
          try {
            const client = googleObj.accounts.oauth2.initTokenClient({
              client_id: oAuthClientId,
              scope: GMAIL_COMPOSE_SCOPE,
              hint: ADMIN_GMAIL_ACCOUNT,
              callback: (tokenResponse: any) => {
                if (tokenResponse.error) {
                  resolve({ error: tokenResponse });
                } else if (tokenResponse.access_token) {
                  resolve({ access_token: tokenResponse.access_token });
                } else {
                  resolve({ error: new Error('No access token returned from Google.') });
                }
              },
            });
            client.requestAccessToken({ prompt: 'consent select_account' });
          } catch (initErr) {
            resolve({ error: initErr });
          }
        });

        if (tokenResult.access_token) {
          cachedAccessToken = tokenResult.access_token;
          const connectedStatus: GmailIntegrationSettings = {
            account: ADMIN_GMAIL_ACCOUNT,
            status: 'connected',
            connectedAt: new Date().toISOString(),
            connectedBy: authorEmail || auth.currentUser?.email || 'author',
            lastVerifiedAt: new Date().toISOString(),
          };

          await siteSettingsService.saveSettings(
            { gmailIntegration: connectedStatus },
            true,
            authorEmail
          );

          return { success: true, status: connectedStatus };
        } else if (tokenResult.error) {
          return this.analyzeOAuthError(tokenResult.error);
        }
      } catch (gisErr) {
        console.warn('[GmailAuthService] GIS token flow error, falling back to secondary popup:', gisErr);
      }
    }

    // METHOD 2: Isolated Secondary Firebase App (avoids overwriting primary Author session)
    try {
      const secondaryAppName = 'gmailAuthSecondary';
      const secondaryApp =
        getApps().find((a) => a.name === secondaryAppName) ||
        initializeApp(
          {
            apiKey: configJson.apiKey,
            authDomain: configJson.authDomain,
            projectId: configJson.projectId,
            storageBucket: configJson.storageBucket,
            messagingSenderId: configJson.messagingSenderId,
            appId: configJson.appId,
          },
          secondaryAppName
        );

      const secondaryAuth = getAuth(secondaryApp);

      const provider = new GoogleAuthProvider();
      provider.addScope(GMAIL_COMPOSE_SCOPE);
      provider.setCustomParameters({
        login_hint: ADMIN_GMAIL_ACCOUNT,
        prompt: 'consent select_account',
      });

      const result = await signInWithPopup(secondaryAuth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
      }

      const connectedStatus: GmailIntegrationSettings = {
        account: ADMIN_GMAIL_ACCOUNT,
        status: 'connected',
        connectedAt: new Date().toISOString(),
        connectedBy: authorEmail || auth.currentUser?.email || 'author',
        lastVerifiedAt: new Date().toISOString(),
      };

      // Persist ONLY connection status metadata to siteSettings (NO TOKENS OR SECRETS)
      await siteSettingsService.saveSettings(
        {
          gmailIntegration: connectedStatus,
        },
        true,
        authorEmail
      );

      return { success: true, status: connectedStatus };
    } catch (err: unknown) {
      return this.analyzeOAuthError(err);
    }
  }

  /**
   * Parses OAuth errors to detect Testing mode 403 / access_denied / unverified app errors.
   */
  public analyzeOAuthError(err: unknown): GmailAuthResult {
    const errorObj = err as { code?: string; message?: string; error?: string; error_description?: string };
    console.error('[GmailAuthService] OAuth connection error:', errorObj);

    const fullMsg = [
      errorObj?.message || '',
      errorObj?.error || '',
      errorObj?.error_description || '',
      String(err),
    ].join(' ').toLowerCase();

    const isTesterError =
      fullMsg.includes('developer-approved testers') ||
      fullMsg.includes('has not completed the google verification process') ||
      fullMsg.includes('access_denied') ||
      fullMsg.includes('error 403') ||
      errorObj?.code === 'auth/access_denied' ||
      errorObj?.error === 'access_denied';

    const gcpConsoleUrl = `https://console.cloud.google.com/apis/credentials/consent?project=${GCP_PROJECT_ID}`;

    if (isTesterError) {
      return {
        success: false,
        isTesterError: true,
        gcpConsoleUrl,
        gcpAudienceUrl: GCP_AUDIENCE_URL,
        accountToAdd: ADMIN_GMAIL_ACCOUNT,
        developerAccount: DEVELOPER_ACCOUNT,
        error: `Google Cloud OAuth is in Testing mode. To allow "${ADMIN_GMAIL_ACCOUNT}" to authorize, it must be added under "Test users" in Google Cloud Console for project "${GCP_PROJECT_ID}".`,
      };
    }

    let msg = 'Failed to connect Google account. Please try again.';
    if (errorObj?.code === 'auth/popup-closed-by-user') {
      msg = 'Google authorization popup was closed before completion.';
    } else if (errorObj?.code === 'auth/cancelled-popup-request') {
      msg = 'Google authorization request was cancelled.';
    } else if (errorObj?.message) {
      msg = errorObj.message;
    }

    return { success: false, error: msg };
  }

  /**
   * Reconnects or renews Gmail OAuth token.
   */
  public async reconnectGmail(
    isAuthor: boolean,
    authorEmail?: string
  ): Promise<GmailAuthResult> {
    return this.connectGmail(isAuthor, authorEmail);
  }

  /**
   * Allows Author to confirm and record connected status once authorized in Google Cloud.
   */
  public async markConnectedManually(
    isAuthor: boolean,
    authorEmail?: string
  ): Promise<GmailAuthResult> {
    if (!isAuthor) {
      return { success: false, error: 'Permission denied: Author role required.' };
    }

    const connectedStatus: GmailIntegrationSettings = {
      account: ADMIN_GMAIL_ACCOUNT,
      status: 'connected',
      connectedAt: new Date().toISOString(),
      connectedBy: authorEmail || auth.currentUser?.email || 'author',
      lastVerifiedAt: new Date().toISOString(),
    };

    await siteSettingsService.saveSettings(
      { gmailIntegration: connectedStatus },
      true,
      authorEmail
    );

    return { success: true, status: connectedStatus };
  }

  /**
   * Disconnects Gmail, clearing in-memory token and updating connection status.
   */
  public async disconnectGmail(
    isAuthor: boolean,
    authorEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!isAuthor) {
      return {
        success: false,
        error: 'Permission denied: Only the Author role can disconnect administrative Gmail integration.',
      };
    }

    cachedAccessToken = null;

    try {
      const disconnectedStatus: GmailIntegrationSettings = {
        account: ADMIN_GMAIL_ACCOUNT,
        status: 'not_connected',
        connectedAt: undefined,
        connectedBy: undefined,
        lastVerifiedAt: new Date().toISOString(),
      };

      await siteSettingsService.saveSettings(
        {
          gmailIntegration: disconnectedStatus,
        },
        true,
        authorEmail
      );

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update disconnect status in Firestore.';
      return { success: false, error: msg };
    }
  }

  /**
   * Constructs the secure Gmail compose URL.
   */
  public buildGmailComposeUrl(options?: {
    to?: string;
    subject?: string;
    body?: string;
  }): string {
    const to = options?.to || ADMIN_GMAIL_ACCOUNT;
    const params = new URLSearchParams({
      view: 'cm',
      to,
    });

    if (options?.subject) {
      params.append('su', options.subject);
    }
    if (options?.body) {
      params.append('body', options.body);
    }

    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  /**
   * Opens Gmail compose in a separate browser tab without navigating away.
   */
  public openGmail(options?: { to?: string; subject?: string; body?: string }): void {
    const url = this.buildGmailComposeUrl(options);
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}

export const gmailAuthService = new GmailAuthService();
