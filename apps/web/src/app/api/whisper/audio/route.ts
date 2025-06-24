import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { adminStorage } from "@/lib/firebase/admin"; // Added Firebase Admin Storage

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path } = body as { path: string };

    if (!path) {
      return NextResponse.json(
        { error: "`path` (Firebase Storage path) is required." },
        { status: 400 }
      );
    }

    const storage = adminStorage();
    if (!storage) {
        return NextResponse.json(
          { error: "Firebase Admin Storage is not initialized." },
          { status: 500 }
        );
    }

    // Assuming default bucket. If using a different one, specify: .bucket("your-bucket-name")
    const fileRef = storage.bucket().file(path);

    let fileBuffer: Buffer;
    let fileMetadata: any;
    try {
        // Download file contents as a buffer
        [fileBuffer] = await fileRef.download();
        // Get metadata to determine MIME type
        [fileMetadata] = await fileRef.getMetadata();
    } catch (error: any) {
        console.error(`Failed to download file or get metadata from Firebase Storage (Path: ${path}):`, error);
        if (error.code === 404) {
             return NextResponse.json(
               { error: `File not found in Firebase Storage at path: ${path}` },
               { status: 404 }
             );
        }
        return NextResponse.json(
          { error: `Failed to download file from Firebase Storage: ${error.message}` },
          { status: 500 }
        );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // const mimeType = fileMetadata?.contentType || "application/octet-stream"; // Removed unused variable

    // Extract necessary details from metadata
    const inferredContentType = fileMetadata?.contentType || "application/octet-stream";
    const inferredSize = fileMetadata?.size;
    const inferredName = path.split("/").pop() || 'audio.bin'; // Get filename from path
    const inferredLastModified = fileMetadata?.timeCreated ? new Date(fileMetadata.timeCreated).getTime() : Date.now();

    // Create a File-like object that matches Groq SDK's Uploadable (FileLike) type
    const fileForGroq = {
        name: inferredName,
        type: inferredContentType,
        size: inferredSize ? parseInt(inferredSize, 10) : fileBuffer.length, // Use buffer length as fallback size
        lastModified: inferredLastModified,
        arrayBuffer: async () => fileBuffer, // Return the buffer directly
        slice: (start?: number, end?: number, contentType?: string) => {
            const slicedBuffer = fileBuffer.slice(start, end);
            return new Blob([slicedBuffer], { type: contentType ?? inferredContentType });
        },
        stream: () => {
            // Create a ReadableStream from the Buffer
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(fileBuffer);
                    controller.close();
                }
            });
            return stream;
        },
        text: async () => fileBuffer.toString('utf-8'), // Assume utf-8 encoding for text
    };

    let transcription;
    try {
        transcription = await groq.audio.transcriptions.create({
            file: fileForGroq as any, // Cast as 'any' if type still doesn't match perfectly
            model: "distil-whisper-large-v3-en",
            language: "en",
            temperature: 0.0,
        });
    } catch (error: any) {
        console.error("Groq transcription failed:", error);
        return NextResponse.json(
            { error: `Transcription failed: ${error.message}` },
            { status: 500 }
        );
    }

    // Cleanup by deleting the file from Firebase Storage
    try {
        await fileRef.delete();
        console.log(`Successfully deleted file from Firebase Storage: ${path}`);
    } catch (error: any) {
        // Log error but don't fail the request, transcription was successful
        console.error(`Failed to delete file from Firebase Storage (Path: ${path}):`, error);
    }

    return NextResponse.json(
      { success: true, text: transcription.text },
      { status: 200 }
    );
  } catch (error: any) {
    // Catch unexpected errors in the overall try block
    console.error("Failed to process whisper request:", error);
    return NextResponse.json(
      { error: "Failed to process request: " + error.message },
      { status: 500 }
    );
  }
}
