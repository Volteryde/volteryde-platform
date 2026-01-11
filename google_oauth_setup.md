# Google Authentication Setup Guide

To enable Google Sign-In, you need to configure a project in the Google Cloud Console and update the backend.

## Step 1: Google Cloud Console Setup

1.  **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a New Project**:
    *   Click the project dropdown -> **New Project**.
    *   Name it "Volteryde" -> **Create**.

3.  **Configure OAuth Consent Screen**:
    *   **APIs & Services** -> **OAuth consent screen**.
    *   Select **External** -> **Create**.
    *   **App Information**: App name (Volteryde), User support email.
    *   **Developer Contact**: Your email.
    *   **Save and Continue** (skip scopes/test users for now).

4.  **Create OAuth Credentials**:
    *   **APIs & Services** -> **Credentials** -> **+ CREATE CREDENTIALS** -> **OAuth client ID**.
    *   **Application type**: **Web application** (Essential for backend verification).
    *   **Name**: "Volteryde Web Client".
    *   **Authorized origins**: `http://localhost:8081` (for local dev).
    *   **Click Create**.

5.  **Get the Client ID**:
    *   Copy the **Client ID** (e.g., `123456-abc.apps.googleusercontent.com`).
    *   This ID is used by both the Frontend (to sign in) and Backend (to verify tokens).

## Step 2: Configure Backend

1.  Open `client-auth-service/src/main/resources/application.yml`.
2.  Add/Update the Google Client ID:
    ```yaml
    google:
      client-id: YOUR_WEB_CLIENT_ID
    ```
