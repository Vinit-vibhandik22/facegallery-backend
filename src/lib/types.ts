export interface Studio {
  id: string;
  name: string;
  logoUrl: string;
  brandColor: string;
  brandColorSecondary: string;
  customDomain: string | null;
  apiKey: string;
  plan: 'starter' | 'professional' | 'agency' | 'enterprise';
  createdAt: string;
}

export interface Project {
  id: string;
  studioId: string;
  name: string;
  eventDate: string;
  status: 'uploading' | 'processing' | 'ready' | 'archived';
  photoCount: number;
  clusterCount: number;
  processingProgress: number;
  createdAt: string;
  coverPhotoUrl: string;
}

export interface Photo {
  id: string;
  projectId: string;
  url: string;
  thumbnailUrl: string;
  faceCount: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface FaceCluster {
  id: string;
  projectId: string;
  label: string | null;
  thumbnailUrl: string;
  photoCount: number;
  confidence: number;
  photos: Photo[];
  createdAt: string;
}

export interface GalleryLink {
  id: string;
  clusterId: string;
  clusterLabel: string;
  token: string;
  expiresAt: string;
  passwordProtected: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  isActive: boolean;
}

export interface AnalyticsData {
  totalViews: number;
  totalDownloads: number;
  totalLinks: number;
  activeLinks: number;
  viewsByDay: { date: string; views: number; downloads: number }[];
  topClusters: { label: string; views: number; downloads: number }[];
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  projectName: string;
  status: 'queued' | 'detecting' | 'clustering' | 'completed' | 'failed';
  progress: number;
  photosProcessed: number;
  totalPhotos: number;
  facesDetected: number;
  clustersCreated: number;
  startedAt: string;
  estimatedCompletion: string;
}

export interface WhiteLabelSettings {
  studioName: string;
  logoUrl: string;
  brandColor: string;
  brandColorSecondary: string;
  customDomain: string;
  galleryTitle: string;
  gallerySubtitle: string;
  showPoweredBy: boolean;
  allowDownloads: boolean;
  allowSocialShare: boolean;
  defaultLinkExpiry: number;
}
