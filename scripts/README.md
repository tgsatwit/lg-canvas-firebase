# PBL Canvas Scripts

This directory contains utility scripts for the PBL Canvas project.

## Videos Master Export Script

This script exports all data from the `videos-master` collection in the `pbl-backend` Firestore database to a CSV file.

### Prerequisites

1. Make sure you have Node.js installed
2. Ensure your `.env` file in the project root contains the `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable with valid Firebase service account credentials
3. The Firebase service account must have read access to the `pbl-backend` database

### Installation

Navigate to the scripts directory and install dependencies:

```bash
cd scripts
npm install
```

### Usage

#### Step 1: Test the connection (recommended first step)
```bash
cd scripts
npm run test-connection
```

This will verify your Firebase credentials work and show you how many videos are in the collection.

#### Step 2: Run the full export

##### Option 1: Using npm script (recommended)
```bash
cd scripts
npm run export-videos
```

##### Option 2: Direct node execution
```bash
cd scripts
node export-videos-master.js
```

### Output

The script will:

1. Connect to your Firebase project using the service account credentials
2. Query all documents from the `videos-master` collection in the `pbl-backend` database
3. Flatten nested objects to make them CSV-friendly
4. Export the data to a CSV file in the `exports/` directory
5. Create a timestamped filename like `videos-master-export-2024-01-15.csv`

### What Data is Exported

The script exports all fields from each video document, including but not limited to:

- **Basic Info**: `document_id`, `name`, `description`, `createdAt`
- **File Details**: `file_type`, `file_size`, `gcp_link`, `storage_path`
- **Vimeo Data**: `vimeoId`, `vimeoOttId`, `vimeo_metadata_*`, `vimeo_ott_metadata_*`
- **YouTube Data**: `yt_title`, `yt_description`, `yt_tags`, `yt_privacyStatus`
- **Status**: `confirmed`, `status`, `youtubeStatus`
- **Metadata**: `views`, `likes`, `comments`, `duration`, `tags`

Nested objects (like `vimeo_metadata` and `vimeo_ott_metadata`) are flattened with underscore notation (e.g., `vimeo_metadata_title`, `vimeo_metadata_duration`).

### Sample Output

```
document_id,name,vimeoId,vimeoOttId,confirmed,createdAt,file_type,gcp_link...
0fGZPViPyx3P3froiLBp,"Detachment Meditation",1066283908,1837377,true,2025-03-22T03:23:44.477Z,mp4,"gs://face-by-lisa.firebasestorage.app/raw/1066283908_detachment_meditation.mp4"...
```

### Error Handling

- The script will show progress as it processes documents
- Individual document errors are logged but don't stop the export
- The script will exit with an error code if critical failures occur (e.g., Firebase connection issues)

### Troubleshooting

1. **"Firebase admin not initialized"**: Check that `FIREBASE_SERVICE_ACCOUNT_JSON` is properly set in your `.env` file
2. **"No videos found"**: Verify you're connecting to the correct database and collection
3. **Permission errors**: Ensure your service account has Firestore read permissions for the `pbl-backend` database

### File Structure

```
scripts/
├── export-videos-master.js    # Main export script
├── test-connection.js         # Connection test script
├── package.json               # Dependencies
├── README.md                  # This file
└── exports/                   # Output directory (created automatically)
    └── videos-master-export-YYYY-MM-DD.csv
``` 