import { PublicationState, SEOData } from './seo';

export * from './seo';

export interface Book {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  series: string;
  seriesOrder: number;
  releaseYear: string;
  status: 'published' | 'upcoming' | 'in-progress';
  publicationState?: PublicationState;
  format: string[];
  isbn?: string;
  pageCount?: number;
  publisher?: string;
  tagline: string;
  synopsis: string;
  coverArtDescription?: string;
  customCoverUrl?: string;
  excerpt: {
    chapterTitle: string;
    text: string[];
  };
  sampleAudioDuration?: string;
  quote: {
    text: string;
    attribution: string;
  };
  buyLinks: {
    name: string;
    url: string;
    badge?: string;
  }[];
  woodEngravingNote?: string;
  accentColor: string;
  motifIcon: string;
  seo?: Partial<SEOData>;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  universe: string;
  summary: string;
  content: string[];
  readTime: string;
  datePublished?: string;
  publicationState: PublicationState;
  seo?: Partial<SEOData>;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  category: 'Announcement' | 'Writing Progress' | 'Lore & Worldbuilding' | 'Craft & Engraving' | 'Event';
  date: string;
  readTime: string;
  summary: string;
  content: string[];
  tags: string[];
  featured?: boolean;
  publicationState?: PublicationState;
  seo?: Partial<SEOData>;
}

export interface CraftArtwork {
  id: string;
  title: string;
  medium: string;
  dimensions: string;
  inspirationBookId?: string;
  year: string;
  description: string;
  motif: 'loom' | 'crest' | 'compass' | 'tree' | 'tide';
}

export interface NewsletterSubscriber {
  id: string;
  firstName: string;
  email: string;
  dateSubscribed: string;
  status: 'active' | 'unsubscribed';
  source: string;
}

export interface NewsletterSettings {
  newsletterEnabled: boolean;
  newsletterProvider: 'development' | 'kit' | 'mailchimp' | 'brevo' | 'buttondown';
  newsletterListId: string;
  newsletterFromName: string;
  newsletterReplyTo: string;
  newsletterConsentText: string;
  newsletterSuccessMessage: string;
  newsletterErrorMessage: string;
  exitIntentEnabled: boolean;
}

export interface NewsletterAnalyticsEvent {
  event: 'newsletter_view' | 'newsletter_started' | 'newsletter_submitted' | 'newsletter_success' | 'newsletter_error';
  timestamp: string;
  source: string;
  metadata?: Record<string, unknown>;
}

// ==========================================
// Three-Tier User Role & Permission System
// ==========================================

export type UserRole = 'reader' | 'editor' | 'author' | 'READER' | 'EDITOR' | 'AUTHOR';
export type AccountStatus = 'active' | 'suspended' | 'pending';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  usernameNormalized: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  profileImage: string;
  bio: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  photoURL?: string;
  shortBio?: string;
  newsletterSubscribed?: boolean;
}

export function normalizeRole(role?: string): 'reader' | 'editor' | 'author' {
  const r = (role || '').toLowerCase();
  if (r === 'author') return 'author';
  if (r === 'editor') return 'editor';
  return 'reader';
}

// ==========================================
// Reader Comments & Moderation
// ==========================================

export type CommentStatus = 'PENDING' | 'APPROVED' | 'HIDDEN' | 'REMOVED' | 'FLAGGED';

export interface BookComment {
  id: string;
  bookId: string;
  bookTitle?: string;
  bookSlug?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  userRole?: UserRole;
  content: string;
  status: CommentStatus;
  createdAt: string;
  parentId?: string | null;
  replyCount?: number;
  reportCount?: number;
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

export type ReportReason =
  | 'Spam'
  | 'Harassment'
  | 'Offensive content'
  | 'Spoiler'
  | 'Inappropriate content'
  | 'Other';

export interface CommentReport {
  id: string;
  commentId: string;
  commentContent: string;
  bookId: string;
  bookTitle?: string;
  reporterUserId: string;
  reporterEmail?: string;
  reason: ReportReason;
  details?: string;
  status: 'PENDING_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

// ==========================================
// Reader Messages (Correspondence)
// ==========================================

export interface ReaderMessage {
  id: string;
  name: string;
  email: string;
  inquiryType: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  replyNotes?: string;
  repliedBy?: string;
  repliedAt?: string;
}

// ==========================================
// Managed Site Content
// ==========================================

export interface HomepageContent {
  heroHeading: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage: string;
  featuredBookId: string;
  featuredSeriesId: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel: string;
  secondaryCtaLink: string;
  authorIntroHeading: string;
  authorIntroBio: string;
  authorIntroQuote: string;
  newsletterHeading: string;
  newsletterText: string;
  footerNote: string;
  footerCopyright: string;
  sections: {
    showFeaturedSeries: boolean;
    showBooksGrid: boolean;
    showStories: boolean;
    showNews: boolean;
    showCraft: boolean;
    showNewsletter: boolean;
  };
}

// ==========================================
// Short Video Library & Management
// ==========================================

export type StandardVideoCategory =
  | 'Book Teaser'
  | 'Author Update'
  | 'Behind the Scenes'
  | 'Reading'
  | 'Series Update'
  | 'Worldbuilding'
  | 'Announcement'
  | 'Other';

export type VideoCategory = StandardVideoCategory | string;

export type VideoAspectRatio = 'vertical' | 'landscape' | 'square';

export type VideoSourceType = 'upload' | 'youtube' | 'url' | 'embed';

export type VideoPublicationStatus = 'published' | 'draft' | 'unlisted';

export interface VideoItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: VideoCategory;
  relatedBookId?: string;
  relatedBookTitle?: string;
  relatedSeriesId?: string;
  relatedSeriesTitle?: string;
  videoUrl: string;
  thumbnailUrl: string;
  aspectRatio: VideoAspectRatio;
  sourceType: VideoSourceType;
  duration: string; // e.g. "0:58", "2:30"
  durationSeconds: number;
  fileSizeBytes?: number;
  status: VideoPublicationStatus;
  featured: boolean;
  viewCount: number;
  tags?: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface VideoSettings {
  maxDurationMinutes: number; // default: 10
  maxUploadSizeMB: number; // default: 500
  categories: string[];
  defaultCategoryFilter?: string;
}


