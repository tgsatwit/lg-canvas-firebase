# Video Filename Cleanup Script

This script cleans up video filenames in Firebase Storage by replacing spaces, brackets, parentheses, and exclamation marks with underscores, then updates the corresponding Firestore records.

## What it does

1. **Connects** to the `pbl-backend` Firestore database
2. **Fetches** all documents from the `videos-master` collection
3. **Identifies** files with problematic characters in their filenames:
   - Spaces (` `)
   - Brackets (`[` `]`)
   - Parentheses (`(` `)`)
   - Exclamation marks (`!`)
   - Colons (`:`)
   - Ampersands (`&`)
4. **Renames** the files in Firebase Storage by replacing these characters with underscores (`_`)
5. **Updates** the `gcp_link` field in each Firestore document with the new file URL

## Prerequisites

1. **Environment Variables**: Ensure you have the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable set with your Firebase service account credentials.

2. **Dependencies**: The Firebase Admin SDK is already installed in this project, so no additional dependencies are needed.

## Testing Your Setup

Before running the cleanup script, test your Firebase connection:

```bash
cd apps/web
node scripts/test-firebase-connection.js
```

This test script will:
- Verify your Firebase service account credentials
- Test connection to the `pbl-backend` Firestore database  
- Test connection to Firebase Storage
- Count documents in the `videos-master` collection
- Show sample files and identify which need cleaning

## Usage

### Dry Run (Recommended First)

Before making any changes, run the script in dry-run mode to see what would be changed:

```bash
cd apps/web
node scripts/clean-video-filenames.js --dry-run
```

This will:
- Show you all the files that would be renamed
- Display the old and new filenames
- Show which Firestore documents would be updated
- **Make NO actual changes**

### Live Run

Once you're satisfied with the dry-run results, run the script to make actual changes:

```bash
cd apps/web
node scripts/clean-video-filenames.js
```

⚠️ **Warning**: This will make permanent changes to your Firebase Storage files and Firestore documents. Make sure you have backups if needed.

## Example Output

```
Starting filename cleanup script...
Mode: DRY RUN (no changes will be made)
Firebase Admin SDK initialized successfully
Fetching documents from videos-master collection...
Found 987 documents to process

Processing batch 1 (documents 1-50)
✅ Document abc123 filename is already clean: video_tutorial_1.mp4
🔧 Document def456: my video (final)!.mp4 → my_video__final__.mp4
🔍 Would rename: my video (final)!.mp4 → my_video__final__.mp4
📝 Would update Firestore document def456 with: https://storage.googleapis.com/...

==================================================
CLEANUP SUMMARY
==================================================
Total documents processed: 987
Documents updated: 23
Errors encountered: 0
Mode: DRY RUN (no changes made)

💡 To apply these changes, run the script without the --dry-run flag
```

## Safety Features

- **Batch Processing**: Processes documents in batches of 50 to avoid overwhelming the database
- **Error Handling**: Comprehensive error handling and logging
- **Dry Run Mode**: Test the script without making changes
- **File Existence Check**: Verifies files exist before attempting to rename
- **Duplicate Check**: Ensures new filenames don't already exist
- **Progress Tracking**: Shows detailed progress and summary statistics

## Character Replacement Rules

The script replaces the following characters with underscores:
- Spaces: `my file.mp4` → `my_file.mp4`
- Square brackets: `video[1].mp4` → `video_1_.mp4`
- Parentheses: `video(final).mp4` → `video_final_.mp4`
- Exclamation marks: `video!.mp4` → `video_.mp4`
- Colons: `video: tutorial.mp4` → `video__tutorial.mp4`
- Ampersands: `video & tutorial.mp4` → `video___tutorial.mp4`

## Troubleshooting

### Common Issues

1. **Firebase Service Account**: Make sure your `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable is properly set.

2. **Permissions**: Ensure your Firebase service account has the necessary permissions:
   - Firestore: Read/Write access to the `pbl-backend` database
   - Storage: Admin access to rename files

3. **Large Dataset**: With 900-1000 records, the script may take some time. The built-in delays prevent overwhelming the services.

### Error Handling

The script includes comprehensive error handling:
- Logs detailed error messages
- Continues processing other files if one fails
- Provides a summary of successes and failures
- Exits gracefully on critical errors

## Script Configuration

You can modify these constants at the top of the script:

```javascript
const BATCH_SIZE = 50; // Number of documents to process at once
```

Adjust `BATCH_SIZE` if you need to process faster (increase) or reduce load on the database (decrease). 