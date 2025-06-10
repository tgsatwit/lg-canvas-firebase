import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminStorage } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const videoFile = formData.get('video') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const visibility = formData.get('visibility') as string || 'Public';
    const tags = formData.get('tags') as string || '';

    // Validate required fields
    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Video title is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/avi'];
    if (!allowedTypes.includes(videoFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload MP4, MPEG, WebM, MOV, or AVI files.' },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 100MB' },
        { status: 400 }
      );
    }

    // Get Firebase services
    const firestoreAdmin = adminFirestore();
    const storageAdmin = adminStorage();

    if (!firestoreAdmin || !storageAdmin) {
      console.error("Firebase admin services not initialized");
      return NextResponse.json(
        { error: "Firebase admin services not initialized" },
        { status: 500 }
      );
    }

    // Generate unique file name
    const fileExtension = videoFile.name.split('.').pop() || 'mp4';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storagePath = `raw/${fileName}`;

    // Convert File to Buffer for upload
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Google Cloud Storage
    const bucket = storageAdmin.bucket('face-by-lisa.firebasestorage.app');
    const file = bucket.file(storagePath);
    
    await file.save(buffer, {
      metadata: {
        contentType: videoFile.type,
        metadata: {
          originalName: videoFile.name,
          uploadedAt: new Date().toISOString(),
          title: title,
        }
      }
    });

    // Get the public URL (optional, since it's a private bucket)
    const gcpLink = `gs://face-by-lisa.firebasestorage.app/${storagePath}`;

    // Parse tags
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    // Create Firestore document in videos-master collection
    const videoData = {
      name: title,
      description: description,
      visibility: visibility,
      file_type: videoFile.type,
      file_size: videoFile.size,
      gcp_link: gcpLink,
      storage_path: storagePath,
      original_filename: videoFile.name,
      confirmed: false, // Not yet processed/confirmed
      createdAt: new Date().toISOString(),
      uploadDate: new Date().toISOString(),
      status: 'Processing',
      youtubeStatus: 'Preparing for YouTube',
      
      // Add tags if provided
      ...(tagArray.length > 0 && { tags: tagArray }),
      
      // Initialize other fields
      views: 0,
      likes: 0,
      comments: 0,
      duration: 0, // Will be extracted later during processing
      
      // Metadata for tracking
      upload_metadata: {
        uploadedAt: new Date().toISOString(),
        fileSize: videoFile.size,
        mimeType: videoFile.type,
        originalName: videoFile.name
      }
    };

    // Add document to videos-master collection
    const docRef = await firestoreAdmin.collection('videos-master').add(videoData);

    console.log(`Video uploaded successfully:`, {
      videoId: docRef.id,
      title: title,
      storagePath: storagePath,
      fileSize: videoFile.size
    });

    return NextResponse.json({
      success: true,
      videoId: docRef.id,
      message: 'Video uploaded successfully',
      data: {
        id: docRef.id,
        title: title,
        storagePath: storagePath,
        gcpLink: gcpLink
      }
    });

  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload video', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 