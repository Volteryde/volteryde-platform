# How to Create Google OAuth Clients for Android and iOS

### **Step 1: Go to Google Cloud Console**
1.  Visit [console.cloud.google.com](https://console.cloud.google.com/).
2.  Create a new project named **"Volteryde"** (or select your existing one).

### **Step 2: Create Android Client ID**
1.  Navigate to **APIs & Services** > **Credentials**.
2.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3.  **Application type**: Select **Android**.
4.  **Name**: "Volteryde Android".
5.  **Package name**: `com.volteryde` (This must match your `app.json`).
6.  **SHA-1 Certificate Fingerprint**:
    *   **For Development**: Run `cd android && ./gradlew signingReport` (native) or use the default Expo SHA-1: `96:CD:0C:63:F6:1C:32:04:15:3A:42:C8:C2:5E:2B:A3:EF:2C:53:C2`.
    *   **For Production**: Get this from your Google Play Console > **Release** > **Setup** > **App signing**.
7.  Click **CREATE**.

### **Step 3: Create iOS Client ID**
1.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
2.  **Application type**: Select **iOS**.
3.  **Name**: "Volteryde iOS".
4.  **Bundle ID**: `com.volteryde.clientapp` (This must match your `app.json`).
5.  Click **CREATE**.

### **Step 4: Create Web Client ID (Crucial for Backend)**
*This ID is required for the backend to verify the tokens sent by the apps.*
1.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
2.  **Application type**: Select **Web application**.
3.  **Name**: "Volteryde Backend".
4.  **Authorized origins**: `http://localhost:8081`.
5.  **Authorized redirect URIs**: `https://auth.expo.io/@your-username/Volteryde-Client-App`.
6.  Click **CREATE**.
7.  **COPY THIS CLIENT ID**. This is what you will use in:
    *   `application.yml` (Backend)
    *   `authSlice.ts` (Frontend webClientId)

### **Next Actions**
Once you have these IDs:
1.  Update `app.json` (scheme: `com.volteryde`).
2.  Update `src/config/api.config.ts` or `authSlice.ts` with the IDs.
3.  Update the backend `application.yml` with the **Web Client ID**.
