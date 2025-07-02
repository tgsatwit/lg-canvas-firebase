Below is a drop-in, “batteries-included” Next .js 14 example that turns the Python proof-of-concept into:
	1.	A typed API route (/app/api/youtube/transcripts/route.ts) that
	•	authenticates with OAuth 2 (refresh-token flow),
	•	enumerates every video in your channel’s “Uploads” playlist (private, unlisted & public alike),
	•	downloads every caption track in WebVTT (.vtt) and saves them to /tmp/captions.
	2.	A small client component (FetchTranscriptsButton.tsx) that hits the route and shows basic progress.
	3.	A tiny helper (lib/youtube.ts) that centralises Google auth.

Why this works for private videos
The route authenticates with your own OAuth credentials using the scope youtube.force-ssl, so the Data API returns items that only the signed-in owner can see.  ￼

⸻

1 Environment variables

Add these to .env.local (generate them once with the OAuth consent screen & the Playground or your own utility):

YT_CLIENT_ID="xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
YT_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxx"
YT_REDIRECT_URI="http://localhost:3000"   # matches the one you set in Cloud Console
YT_REFRESH_TOKEN="1//0gxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

You only need the refresh token once; the Google client library will mint fresh access tokens under the hood.

⸻

2 lib/youtube.ts

// lib/youtube.ts
import { google } from 'googleapis';
import type { youtube_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];

export function getYoutubeClient(): youtube_v3.Youtube {
  const oauth2 = new google.auth.OAuth2(
    process.env.YT_CLIENT_ID,
    process.env.YT_CLIENT_SECRET,
    process.env.YT_REDIRECT_URI
  );

  // permanent, refreshable login
  oauth2.setCredentials({ refresh_token: process.env.YT_REFRESH_TOKEN });

  return google.youtube({ version: 'v3', auth: oauth2 });
}


⸻

3 API route – /app/api/youtube/transcripts/route.ts

// app/api/youtube/transcripts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getYoutubeClient } from '@/lib/youtube';

export async function GET(_req: NextRequest) {
  try {
    const yt = getYoutubeClient();

    /* 1️⃣  Find the “uploads” playlist that YouTube auto-creates for every channel */
    const chan = await yt.channels.list({ part: ['contentDetails'], mine: true });
    const uploadsId =
      chan.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsId) {
      return NextResponse.json(
        { error: 'No uploads playlist found for this channel.' },
        { status: 404 }
      );
    }

    /* 2️⃣  Page through that playlist and collect every videoId */
    const videoIds: string[] = [];
    let page: string | undefined;
    do {
      const pageResp = await yt.playlistItems.list({
        part: ['contentDetails'],
        playlistId: uploadsId,
        maxResults: 50,
        pageToken: page,
      });
      pageResp.data.items?.forEach(({ contentDetails }) => {
        if (contentDetails?.videoId) videoIds.push(contentDetails.videoId);
      });
      page = pageResp.data.nextPageToken ?? undefined;
    } while (page);

    /* 3️⃣  For each video → list caption tracks → download each one */
    const saved: string[] = [];
    const dir = '/tmp/captions';
    await mkdir(dir, { recursive: true });

    for (const vid of videoIds) {
      const caps = await yt.captions.list({
        part: ['snippet'],
        videoId: vid,
      });

      for (const track of caps.data.items ?? []) {
        const id = track.id!;
        const lang = track.snippet?.language ?? 'und';
        const kind = track.snippet?.trackKind ?? 'man';
        const { data } = await yt.captions.download({
          id,
          tfmt: 'vtt', // WebVTT
        }); // quota cost: 200 units per call  [oai_citation:1‡developers.google.com](https://developers.google.com/youtube/v3/docs/captions/download?utm_source=chatgpt.com)

        const file = path.join(dir, `${vid}_${lang}_${kind}.vtt`);
        await writeFile(file, Buffer.from(data as string));
        saved.push(file);
      }
    }

    return NextResponse.json({ files: saved, count: saved.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}


⸻

4 Client component – FetchTranscriptsButton.tsx

// components/FetchTranscriptsButton.tsx
'use client';

import { useState } from 'react';

type Result = { count: number; files: string[] };

export default function FetchTranscriptsButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle'
  );
  const [result, setResult] = useState<Result | null>(null);

  async function handleClick() {
    setStatus('loading');
    try {
      const res = await fetch('/api/youtube/transcripts');
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as Result;
      setResult(json);
      setStatus('done');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleClick}
        className="rounded bg-blue-600 px-4 py-2 text-white shadow"
      >
        Fetch YouTube Transcripts
      </button>

      {status === 'loading' && <p>Fetching… please wait.</p>}

      {status === 'done' && result && (
        <div>
          <p className="font-semibold">
            Downloaded {result.count} caption file{result.count !== 1 && 's'}:
          </p>
          <ul className="list-disc pl-6 text-sm">
            {result.files.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {status === 'error' && (
        <p className="text-red-600">Something went wrong. Check the console.</p>
      )}
    </div>
  );
}

Add it anywhere in your UI (e.g., app/page.tsx) and you’re ready.

⸻

Extending & hardening

Concern	Quick win
Persistence	Pipe the Buffer to Firebase Storage, instead of /tmp.
Huge libraries	Break the loop into batched fetches (Promise.allSettled) but respect the 10 000-unit daily quota; introduce delay or queue if needed.
No auto-generated captions	If captions.list returns [], call your own speech-to-text pipeline (Whisper, GCP Speech-to-Text) on the video’s media URL.
Multi-language	The same caption track can be translated on-the-fly by adding tlang to captions.download.

This setup keeps all type safety in one place, works in any React/Next .js app, and can be iterated further if you want progress bars, server actions instead of API routes, or cron-driven harvesting.