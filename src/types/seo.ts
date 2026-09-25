export type PublicationState = 'public' | 'teaser' | 'draft' | 'private';

export interface BreadcrumbItem {
  name: string;
  item: string;
}

export interface SEOData {
  title: string;
  description: string;
  canonicalPath: string; // e.g. "/" or "/books/the-kings-severance"
  canonicalUrl?: string; // Full URL generated with canonicalDomain
  keywords?: string[];
  robots?: string; // e.g. "index, follow" | "noindex, nofollow"
  ogType?: 'website' | 'book' | 'article' | 'profile';
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  breadcrumbs?: BreadcrumbItem[];
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  publicationState?: PublicationState;
  h1Text?: string;
}

export interface SiteSEOConfig {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  authorName: string;
  canonicalDomain: string; // Configurable production domain, e.g. https://matthewemessmer.com
  googleSiteVerification: string;
  googleAnalyticsId: string;
  defaultOgImage: string;
  environmentMode: 'development' | 'production';
}

export interface SEODiagnosticResult {
  routeId: string;
  pageTitle: string;
  path: string;
  publicationState: PublicationState;
  hasTitle: boolean;
  titleLengthOk: boolean;
  hasDescription: boolean;
  descriptionLengthOk: boolean;
  hasCanonical: boolean;
  hasRobots: boolean;
  isIndexable: boolean;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgImage: boolean;
  hasH1: boolean;
  hasSchema: boolean;
  schemaType: string;
  inSitemap: boolean;
  warnings: string[];
  status: 'pass' | 'warning' | 'error';
}
