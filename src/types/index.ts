import { PublicationState, SEOData } from './seo';

export * from './seo';

export type AdminPublicationState = PublicationState;

export type BookStatus = 'published' | 'pending' | 'unreleased';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage: string;
  status: 'published' | 'pending' | 'unreleased';
  purchaseLink?: string;

  // Additional rich fields for reader presentation, series chronology & SEO
  slug?: string;
  series?: string;
  seriesId?: string;
  seriesName?: string;
  seriesOrder?: number;
  releaseYear?: string;
  publicationState?: PublicationState;
  format?: string[];
  isbn?: string;
  pageCount?: number;
  publisher?: string;
  tagline?: string;
  synopsis?: string;
  coverArtDescription?: string;
  customCoverUrl?: string;
  excerpt?: {
    chapterTitle: string;
    text: string[];
  };
  sampleAudioDuration?: string;
  quote?: {
    text: string;
    attribution: string;
  };
  buyLinks?: {
    name: string;
    url: string;
    badge?: string;
  }[];
  woodEngravingNote?: string;
  accentColor?: string;
  motifIcon?: string;
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

export type SeriesStatus =
  | 'ACTIVE'
  | 'IN DEVELOPMENT'
  | 'COMPLETED'
  | 'ON HIATUS'
  | 'ARCHIVED'
  | 'published'
  | 'in-progress'
  | 'archived';

export interface Series {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  genres: string[];
  artworkUrl?: string;
  bannerImage?: string;
  status: SeriesStatus;
  publicationState: PublicationState;
  bookIds: string[];
  seoTitle?: string;
  metaDescription?: string;
  socialImage?: string;
  canonicalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  category: 'Announcement' | 'Writing Progress' | 'Lore & Worldbuilding' | 'Craft & Engraving' | 'Event' | string;
  date: string;
  readTime: string;
  summary: string;
  content: string[];
  tags: string[];
  featured?: boolean;
  publicationState?: PublicationState;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  createdBy?: string;
  updatedBy?: string;
  seo?: Partial<SEOData>;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText: string;
  category: string;
  tags: string[];
  relatedBookId?: string;
  relatedSeriesId?: string;
  relatedCharacterId?: string;
  relatedStoryId?: string;
  featured: boolean;
  publicationState: PublicationState;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  dimensions?: string;
  medium?: string;
}

export interface Character {
  id: string;
  name: string;
  title?: string;
  role?: string;
  shortDescription: string;
  biography?: string;
  appearance?: string;
  personality?: string;
  abilities?: string;
  affiliations?: string;
  imageUrl?: string;
  imageAltText?: string;
  seriesId?: string;
  bookIds?: string[];
  tags: string[];
  publicationState: PublicationState;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface LoreEntry {
  id: string;
  title: string;
  description: string;
  content: string | string[];
  category: string;
  tags: string[];
  relatedSeriesId?: string;
  relatedBookIds?: string[];
  relatedCharacterIds?: string[];
  imageUrl?: string;
  publicationState: PublicationState;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
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

export type WelcomeEmailStatus = 'NOT_APPLICABLE' | 'PENDING' | 'SENT' | 'FAILED';
export type WelcomeEmailType = 'NEWSLETTER_WELCOME' | 'ACCOUNT_AND_NEWSLETTER_WELCOME';

export interface WelcomeEmailTemplate {
  id: WelcomeEmailType;
  type: WelcomeEmailType;
  title: string;
  description: string;
  subject: string;
  body: string;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
  isCustomized?: boolean;
}

export interface WelcomeTemplateVersion {
  id: string;
  templateType: WelcomeEmailType;
  subject: string;
  body: string;
  savedAt: string;
  savedBy: string;
  savedByName: string;
  isDefault?: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  userId?: string;
  email: string;
  dateSubscribed: string;
  status: 'active' | 'unsubscribed';
  source: string;
  welcomeEmailStatus?: WelcomeEmailStatus;
  welcomeEmailType?: WelcomeEmailType;
  welcomeEmailSentAt?: string;
  welcomeEmailEventId?: string;
  welcomeEmailError?: string;
}

export interface EmailEvent {
  id: string;
  eventId: string;
  userId?: string;
  subscriberId: string;
  recipientEmail: string;
  recipientName: string;
  emailType: WelcomeEmailType;
  subject: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
  providerMessageId?: string;
  error?: string;
  createdAt: string;
  sentAt?: string;
  retryCount?: number;
  triggerSource?: string;
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
  // Optional reader location information (strictly voluntary, visible only to author)
  city?: string;
  state?: string;
  country?: string;
}

export function normalizeRole(role?: string): 'reader' | 'editor' | 'author' {
  const r = (role || '').toLowerCase();
  if (r === 'author') return 'author';
  if (r === 'editor') return 'editor';
  return 'reader';
}

// ==========================================
// Reader Comments, Reviews & Moderation
// ==========================================

export type CommentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'HIDDEN'
  | 'REMOVED'
  | 'FLAGGED'
  | 'REMOVED_PENDING_DELETION';

export type ThematicTier =
  | 'Unputdownable / Masterpiece'
  | 'Deeply Captivating / Essential'
  | 'Rich & Atmospheric / Recommended'
  | 'Intriguing / Worth Reading'
  | 'Not for Me';

export type RemovalReason =
  | 'Spam'
  | 'Harassment'
  | 'Hate Speech'
  | 'Off-Topic'
  | 'Inappropriate content'
  | 'Spoiler'
  | 'Other';

export interface BookComment {
  id: string;
  bookId?: string;
  bookTitle?: string;
  bookSlug?: string;
  storyId?: string;
  storyTitle?: string;
  discussionId?: string;
  discussionTitle?: string;
  targetType?: 'book' | 'story' | 'discussion';
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  userRole?: UserRole;
  content: string;
  status: CommentStatus;
  previousStatus?: CommentStatus;
  createdAt: string;
  parentId?: string | null;
  replyCount?: number;
  reportCount?: number;
  moderationNotes?: string;
  moderatedBy?: string;
  moderatedAt?: string;

  // Review & Thematic Tier
  isReview?: boolean;
  thematicTier?: ThematicTier;
  thematicScore?: number; // 1 to 5 (Tome rating scale)

  // 7-Day Holding Workflow
  removedAt?: string | null;
  scheduledDeletionAt?: string | null;
  removalReason?: string | null;
  removedBy?: string | null;
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
  bookId?: string;
  bookTitle?: string;
  storyId?: string;
  discussionId?: string;
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
// Community Discussions Board
// ==========================================

export interface DiscussionThread {
  id: string;
  title: string;
  category: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  authorRole: UserRole;
  createdAt: string;
  updatedAt?: string;
  replyCount: number;
  rulesAgreed: boolean;
  pinned?: boolean;
  locked?: boolean;
}

// ==========================================
// Monthly Featured Rotation
// ==========================================

export interface MonthlyFeaturedConfig {
  mode: 'auto' | 'override';
  overrideType?: 'book' | 'story';
  overrideId?: string;
  itemId?: string;
  customNote?: string;
  updatedAt?: string;
  updatedBy?: string;
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
  monthlyFeatured?: MonthlyFeaturedConfig;
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

// ==========================================
// Songs & Music Library Management
// ==========================================

export type SongStatus = 'Draft' | 'Published' | 'Unreleased';

export interface SongExternalLink {
  platform: 'Spotify' | 'YouTube' | 'SoundCloud' | 'Bandcamp';
  url: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  category: string; // e.g., "Original Country & Acoustic", "Dedication Track", "Soundtrack Companion"
  description: string;
  lyrics?: string;
  dedication?: string;
  audioUrl?: string; // Direct audio file or streaming preview
  coverImage?: string;
  releaseDate?: string;
  status: SongStatus; // 'Draft' | 'Published' | 'Unreleased'
  isPublic: boolean;
  featured: boolean;
  displayOrder: number;
  tags?: string[];
  externalLinks: SongExternalLink[];
  youtubeUrl?: string;
  spotifyUrl?: string;
  soundcloudUrl?: string;
  bandcampUrl?: string;
  releaseNote?: string; // Backwards compatibility for dedication note display
  storagePath?: string; // Firebase storage location
  fileSize?: number; // Size in bytes
  duration?: number; // Duration in seconds
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}



