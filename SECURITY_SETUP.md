# Security Setup Guide

## 🔒 Service Account Keys Setup

This project requires Google Cloud service account keys for authentication. These files contain sensitive information and should never be committed to version control.

### Required Files (Local Only)

1. **`service-account-key.json`** - Main Google Cloud service account
2. **`youtube-service-account-key.json`** - YouTube API service account

### Setup Instructions

1. **Copy the example files:**
   ```bash
   cp service-account-key.json.example service-account-key.json
   cp youtube-service-account-key.json.example youtube-service-account-key.json
   ```

2. **Get your actual service account keys from Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to IAM & Admin > Service Accounts
   - Create or select your service account
   - Create a new key (JSON format)
   - Download the JSON file

3. **Replace the placeholder content in your local files:**
   - Open your downloaded JSON files
   - Copy the entire content
   - Paste into your local `service-account-key.json` and `youtube-service-account-key.json` files

### Security Notes

- ✅ These files are already added to `.gitignore`
- ✅ Example files with placeholders are safe to commit
- ❌ Never commit actual service account keys
- ❌ Never share these keys in chat, email, or documentation

### Environment Variables

The application references these files through:
- `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Direct file path references in the codebase

Make sure your local files exist at the project root for the application to work properly.

### Troubleshooting

If you see authentication errors:
1. Verify your service account files exist and have valid JSON
2. Check that your service accounts have the necessary permissions
3. Ensure the file paths in your environment match the actual file locations 