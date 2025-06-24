declare module '@/lib/firebase/videos' {
  export type FirebaseVideo = {
    confirmed?: boolean;
    createdAt?: string;
    download_info?: {
      attempts?: number;
      queued_at?: string;
      download_link?: string;
    };
    file_type?: string;
    gcp_info_last_updated?: string;
    gcp_link?: string;
    name?: string;
    vimeoId?: string;
    vimeoOttId?: string;
  };

  export type Video = {
    id: string;
    title: string;
    thumbnail: string;
    visibility: "Public" | "Private" | "Unlisted";
    uploadDate: string;
    views: number;
    likes: number;
    comments: number;
    duration: string;
    status: "Published" | "Draft" | "Processing";
  };
} 