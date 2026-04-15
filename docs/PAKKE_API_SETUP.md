# Pakke API Configuration Guide

## Problem: API Key Not Detected

If you're seeing "not connected api, try later" even though you have `PAKKE=your-key` in your `.env` file, this is because **Expo doesn't automatically load `.env` variables at runtime**.

## Solutions

### Option 1: Use EXPO_PUBLIC_ Prefix (Recommended)

In your `.env` file, change:
```env
PAKKE=your-api-key-here
```

To:
```env
EXPO_PUBLIC_PAKKE=your-api-key-here
```

**Important:** After changing, you need to:
1. Stop the Expo dev server
2. Clear cache: `npx expo start -c`
3. Restart the server

### Option 2: Add to app.json (For Build Time)

Add the API key directly to `app.json` in the `extra` section:

```json
{
  "expo": {
    "extra": {
      "router": {},
      "eas": {
        "projectId": "626303b5-01cc-47b8-a665-17b9697179d3"
      },
      "PAKKE": "your-api-key-here"
    }
  }
}
```

**Note:** This method exposes the key in the app bundle, so only use for development or if the key is meant to be public.

### Option 3: Use app.config.js (Dynamic)

Create `app.config.js` (instead of `app.json`) to dynamically load from `.env`:

```javascript
require('dotenv').config();

module.exports = {
  expo: {
    name: "BizneAI",
    // ... other config
    extra: {
      router: {},
      eas: {
        projectId: "626303b5-01cc-47b8-a665-17b9697179d3"
      },
      PAKKE: process.env.PAKKE || process.env.EXPO_PUBLIC_PAKKE
    }
  }
};
```

## Debugging

The service logs detailed information to help debug:

1. Check the console logs when the app starts
2. Look for `[PakkeService]` messages
3. The logs will show:
   - Which sources were checked
   - Available environment variables
   - Where the key was found (if found)

## Verification

To verify the key is loaded:

1. Open the shipments screen
2. Check the console logs
3. You should see: `[PakkeService] ✅ API key found from: [source]`

If you see warnings, follow the instructions in the console output.

