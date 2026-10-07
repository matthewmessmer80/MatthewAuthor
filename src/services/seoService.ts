import { SEOData, SiteSEOConfig, SEODiagnosticResult, BreadcrumbItem, PublicationState } from '../types/seo';
import { AUTHOR_INFO, BOOKS, CRAFT_ARTWORKS, NEWS_ARTICLES, STORIES } from '../data/authorData';

const STORAGE_KEY_SEO_CONFIG = 'mem_author_seo_config_v2';

export const DEFAULT_SITE_SEO_CONFIG: SiteSEOConfig = {
  siteName: 'Matthew E. Messmer',
  siteTitle: 'Matthew E. Messmer | Author | Stories Woven Through Time',
  siteDescription:
    'Official website of author Matthew E. Messmer. Discover his books, fantasy worlds, stories, and upcoming projects, including The Breathwoven Cycle and The Abyssal Current.',
  authorName: 'Matthew E. Messmer',
  canonicalDomain:
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://matthewemessmer.com',
  googleSiteVerification: '',
  googleAnalyticsId: '',
  defaultOgImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
  environmentMode: 'production',
};

class SEOService {
  private config: SiteSEOConfig;
  private listeners: Array<() => void> = [];

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): SiteSEOConfig {
    if (typeof window === 'undefined') return DEFAULT_SITE_SEO_CONFIG;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SEO_CONFIG);
      if (stored) {
        return { ...DEFAULT_SITE_SEO_CONFIG, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('Failed to load SEO config from storage:', err);
    }
    return DEFAULT_SITE_SEO_CONFIG;
  }

  public getConfig(): SiteSEOConfig {
    // If canonicalDomain was stored as default or empty, fallback to window.location.origin
    if (
      typeof window !== 'undefined' &&
      (!this.config.canonicalDomain || this.config.canonicalDomain === 'https://matthewemessmer.com')
    ) {
      return {
        ...this.config,
        canonicalDomain: window.location.origin,
      };
    }
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<SiteSEOConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_SEO_CONFIG, JSON.stringify(this.config));
      } catch (err) {
        console.warn('Failed to save SEO config to storage:', err);
      }
    }
    this.notify();
  }

  public resetConfigToDefaults(): void {
    this.config = {
      ...DEFAULT_SITE_SEO_CONFIG,
      canonicalDomain: typeof window !== 'undefined' ? window.location.origin : 'https://matthewemessmer.com',
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_SEO_CONFIG);
      } catch (err) {
        console.warn('Failed to clear SEO storage:', err);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Builds the absolute canonical URL given a path.
   */
  public getFullCanonicalUrl(path: string): string {
    const config = this.getConfig();
    const domain = config.canonicalDomain.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return cleanPath === '/' ? domain : `${domain}${cleanPath}`;
  }

  /**
   * Generates central Person (Author) Schema.org structured data
   */
  public getAuthorPersonSchema() {
    const config = this.getConfig();
    return {
      '@type': 'Person',
      '@id': `${this.getFullCanonicalUrl('/about')}#author`,
      name: config.authorName,
      jobTitle: 'Author & Storyteller',
      description: AUTHOR_INFO.shortBio,
      url: this.getFullCanonicalUrl('/about'),
      sameAs: [
        'https://amazon.com',
        'https://goodreads.com',
      ],
      alumniOf: {
        '@type': 'Organization',
        name: 'United States Navy (Master-at-Arms)',
      },
      knowsAbout: [
        'Epic Fantasy',
        'Worldbuilding',
        'Storytelling',
        'Laser Engraving',
        'Information Technology',
      ],
    };
  }

  /**
   * Generates central WebSite Schema.org structured data
   */
  public getWebSiteSchema() {
    const config = this.getConfig();
    return {
      '@type': 'WebSite',
      '@id': `${this.getFullCanonicalUrl('/')}#website`,
      name: config.siteName,
      url: this.getFullCanonicalUrl('/'),
      description: config.siteDescription,
      inLanguage: 'en-US',
      publisher: this.getAuthorPersonSchema(),
    };
  }

  /**
   * Generates central Book Schema for any book
   */
  public getBookSchema(book: typeof BOOKS[0]) {
    return {
      '@type': 'Book',
      '@id': `${this.getFullCanonicalUrl(`/${book.slug}`)}#book`,
      name: book.title,
      headline: book.subtitle || book.title,
      author: this.getAuthorPersonSchema(),
      isbn: book.isbn || undefined,
      numberOfPages: book.pageCount || undefined,
      inLanguage: 'en',
      genre: ['Fantasy', 'Epic Fantasy', 'Adventure'],
      datePublished: book.releaseYear,
      description: book.synopsis,
      publisher: {
        '@type': 'Organization',
        name: book.publisher || 'Breathwoven Press',
      },
      workExample: (book.format || ['Hardcover', 'Paperback', 'E-Book']).map((fmt) => ({
        '@type': 'Book',
        bookFormat: fmt.toLowerCase().includes('hardcover')
          ? 'https://schema.org/Hardcover'
          : fmt.toLowerCase().includes('paperback')
          ? 'https://schema.org/Paperback'
          : fmt.toLowerCase().includes('audiobook')
          ? 'https://schema.org/AudiobookFormat'
          : 'https://schema.org/EBook',
      })),
    };
  }

  /**
   * Generates BookSeries schema for The Breathwoven Cycle
   */
  public getBreathwovenSeriesSchema() {
    const breathwovenBooks = BOOKS.filter((b) => b.series === 'The Breathwoven Cycle');
    return {
      '@type': 'BookSeries',
      '@id': `${this.getFullCanonicalUrl('/the-breathwoven-cycle')}#series`,
      name: 'The Breathwoven Cycle',
      description:
        'An expansive epic fantasy series exploring the threads of family, sacrifice, and metaphysical memory binding human souls across time.',
      author: this.getAuthorPersonSchema(),
      hasPart: breathwovenBooks.map((b) => this.getBookSchema(b)),
    };
  }

  /**
   * Generates BreadcrumbList Schema.org structured data
   */
  public getBreadcrumbSchema(breadcrumbs: BreadcrumbItem[]) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: this.getFullCanonicalUrl(crumb.item),
      })),
    };
  }

  /**
   * Returns complete SEOData for every registered page route in the site
   */
  public getRouteSEO(routeId: string, paramSlug?: string): SEOData {
    const config = this.getConfig();
    const defaultRobots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    // 1. HOME
    if (routeId === 'home' || routeId === '/') {
      return {
        title: 'Matthew E. Messmer | Author | Stories Woven Through Time',
        description:
          'Official website of author Matthew E. Messmer. Discover his books, fantasy worlds, stories, and upcoming projects, including The Breathwoven Cycle and The Abyssal Current.',
        canonicalPath: '/',
        canonicalUrl: this.getFullCanonicalUrl('/'),
        keywords: [
          'Matthew E. Messmer',
          'Author',
          'Stories Woven Through Time',
          'The Breathwoven Cycle',
          'The Abyssal Current',
          'Ignis-Kor',
          'Epic Fantasy',
          'Navy Veteran Author',
          'Laser Engraving',
        ],
        robots: defaultRobots,
        ogType: 'website',
        ogTitle: 'Matthew E. Messmer | Author | Stories Woven Through Time',
        ogDescription:
          'Official website of author Matthew E. Messmer. Discover his books, fantasy worlds, stories, and upcoming projects, including The Breathwoven Cycle and The Abyssal Current.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'Matthew E. Messmer | Author | Stories Woven Through Time',
        twitterDescription:
          'Official website of author Matthew E. Messmer. Discover his books, fantasy worlds, stories, and upcoming projects.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [{ name: 'Home', item: '/' }],
        schema: [this.getWebSiteSchema(), this.getAuthorPersonSchema()],
        publicationState: 'public',
        h1Text: 'Matthew E. Messmer',
      };
    }

    // 2. BOOKS (CATALOG)
    if (routeId === 'books') {
      return {
        title: 'Books by Matthew E. Messmer | Stories Woven Through Time',
        description:
          'Explore novels and works by Matthew E. Messmer, including The Breathwoven Cycle series, The Abyssal Current, and Ignis-Kor: The Heart of Fire.',
        canonicalPath: '/books',
        canonicalUrl: this.getFullCanonicalUrl('/books'),
        keywords: [
          'Books by Matthew E. Messmer',
          'The Breathwoven Cycle',
          'The King\'s Severance',
          'The Blue Moon Child',
          'The Weaver\'s Lullaby',
          'The Abyssal Current',
          'Ignis-Kor',
          'Fantasy Books',
        ],
        robots: defaultRobots,
        ogType: 'website',
        ogTitle: 'Books by Matthew E. Messmer | Stories Woven Through Time',
        ogDescription:
          'Explore novels and works by Matthew E. Messmer, including The Breathwoven Cycle series, The Abyssal Current, and Ignis-Kor: The Heart of Fire.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'Books by Matthew E. Messmer | Stories Woven Through Time',
        twitterDescription:
          'Discover all books and series by author Matthew E. Messmer, including The Breathwoven Cycle and The Abyssal Current.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Books', item: '/books' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Books', item: '/books' },
          ]),
          {
            '@type': 'CollectionPage',
            name: 'Books by Matthew E. Messmer',
            description: 'The complete bibliography of fantasy novels and series by Matthew E. Messmer.',
            hasPart: BOOKS.map((b) => this.getBookSchema(b)),
          },
        ],
        publicationState: 'public',
        h1Text: 'Books by Matthew E. Messmer',
      };
    }

    // 3. THE BREATHWOVEN CYCLE (SERIES HUB)
    if (routeId === 'breathwoven-cycle' || routeId === 'the-breathwoven-cycle') {
      return {
        title: 'The Breathwoven Cycle | Matthew E. Messmer',
        description:
          'The Breathwoven Cycle by Matthew E. Messmer. An epic fantasy saga where celestial threads bind fate, memory, and the destiny of fractured realms.',
        canonicalPath: '/the-breathwoven-cycle',
        canonicalUrl: this.getFullCanonicalUrl('/the-breathwoven-cycle'),
        keywords: [
          'The Breathwoven Cycle',
          'Matthew E. Messmer',
          'The King\'s Severance',
          'The Blue Moon Child',
          'The Weaver\'s Lullaby',
          'Ignis-Kor',
          'Epic Fantasy Saga',
        ],
        robots: defaultRobots,
        ogType: 'book',
        ogTitle: 'The Breathwoven Cycle | Matthew E. Messmer',
        ogDescription:
          'The Breathwoven Cycle by Matthew E. Messmer. An epic fantasy saga where celestial threads bind fate, memory, and the destiny of fractured realms.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'The Breathwoven Cycle | Matthew E. Messmer',
        twitterDescription: 'The Breathwoven Cycle by author Matthew E. Messmer. An epic fantasy saga across fractured realms.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Books', item: '/books' },
          { name: 'The Breathwoven Cycle', item: '/the-breathwoven-cycle' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Books', item: '/books' },
            { name: 'The Breathwoven Cycle', item: '/the-breathwoven-cycle' },
          ]),
          this.getBreathwovenSeriesSchema(),
        ],
        publicationState: 'public',
        h1Text: 'The Breathwoven Cycle',
      };
    }

    // 4. THE ABYSSAL CURRENT
    if (routeId === 'abyssal' || routeId === 'the-abyssal-current') {
      const book = BOOKS.find((b) => b.id === 'ignis-kor' || b.seriesId === 'series-1791135616897') || BOOKS[0];
      return {
        title: 'The Abyssal Current | Matthew E. Messmer',
        description:
          'The Abyssal Current by Matthew E. Messmer. A maritime fantasy epic inspired by naval service where oceanic depths hide compressed time.',
        canonicalPath: '/the-abyssal-current',
        canonicalUrl: this.getFullCanonicalUrl('/the-abyssal-current'),
        keywords: [
          'The Abyssal Current',
          'Matthew E. Messmer',
          'Maritime Fantasy',
          'Navy Veteran Fiction',
          'Oceanic Sci-Fi Fantasy',
          'Naval Lore',
        ],
        robots: defaultRobots,
        ogType: 'book',
        ogTitle: 'The Abyssal Current | Matthew E. Messmer',
        ogDescription:
          'The Abyssal Current by Matthew E. Messmer. A maritime fantasy epic inspired by naval service where oceanic depths hide compressed time.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'The Abyssal Current | Matthew E. Messmer',
        twitterDescription: 'Deep beneath the charted seas, time flows not forward, but down. The Abyssal Current by Matthew E. Messmer.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Books', item: '/books' },
          { name: 'The Abyssal Current', item: '/the-abyssal-current' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Books', item: '/books' },
            { name: 'The Abyssal Current', item: '/the-abyssal-current' },
          ]),
          this.getBookSchema(book),
        ],
        publicationState: 'public',
        h1Text: 'The Abyssal Current',
      };
    }

    // 5. IGNIS-KOR: THE HEART OF FIRE
    if (routeId === 'ignis-kor' || routeId === 'ignis-kor-the-heart-of-fire') {
      const book = BOOKS.find((b) => b.id === 'ignis-kor') || BOOKS[4];
      return {
        title: 'Ignis-Kor: The Heart of Fire | Matthew E. Messmer',
        description:
          'Ignis-Kor: The Heart of Fire by Matthew E. Messmer. An ancient forge awakens in the subterranean magma catacombs of the Breathwoven world.',
        canonicalPath: '/ignis-kor',
        canonicalUrl: this.getFullCanonicalUrl('/ignis-kor'),
        keywords: [
          'Ignis-Kor: The Heart of Fire',
          'Ignis-Kor',
          'Matthew E. Messmer',
          'The Breathwoven Cycle',
          'Novella',
          'Fantasy Forge',
        ],
        robots: defaultRobots,
        ogType: 'book',
        ogTitle: 'Ignis-Kor: The Heart of Fire | Matthew E. Messmer',
        ogDescription:
          'Ignis-Kor: The Heart of Fire by Matthew E. Messmer. An ancient forge awakens in the subterranean magma catacombs of the Breathwoven world.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'Ignis-Kor: The Heart of Fire | Matthew E. Messmer',
        twitterDescription: 'Where embers refuse to die, an ancient forge reawakens. Ignis-Kor by Matthew E. Messmer.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Books', item: '/books' },
          { name: 'Ignis-Kor: The Heart of Fire', item: '/ignis-kor' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Books', item: '/books' },
            { name: 'Ignis-Kor: The Heart of Fire', item: '/ignis-kor' },
          ]),
          this.getBookSchema(book),
        ],
        publicationState: 'public',
        h1Text: 'Ignis-Kor: The Heart of Fire',
      };
    }

    // 6. THE KING'S SEVERANCE
    if (routeId === 'kings-severance' || routeId === 'the-kings-severance') {
      const book = BOOKS.find((b) => b.id === 'kings-severance') || BOOKS[0];
      return {
        title: "The King's Severance | Matthew E. Messmer",
        description:
          "The King's Severance (Breathwoven Cycle Book 1) by Matthew E. Messmer. When the golden thread of royalty snaps, an empire unravels into song and blade.",
        canonicalPath: '/the-kings-severance',
        canonicalUrl: this.getFullCanonicalUrl('/the-kings-severance'),
        keywords: [
          "The King's Severance",
          'Matthew E. Messmer',
          'The Breathwoven Cycle Book 1',
          'Epic Fantasy',
          'King Alden',
          'Val-Mora',
        ],
        robots: defaultRobots,
        ogType: 'book',
        ogTitle: "The King's Severance | Matthew E. Messmer",
        ogDescription:
          "The King's Severance (Breathwoven Cycle Book 1) by Matthew E. Messmer. When the golden thread of royalty snaps, an empire unravels into song and blade.",
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: "The King's Severance | Matthew E. Messmer",
        twitterDescription: "The King's Severance by Matthew E. Messmer. An epic fantasy novel where a kingdom unweaves.",
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Books', item: '/books' },
          { name: "The King's Severance", item: '/the-kings-severance' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Books', item: '/books' },
            { name: "The King's Severance", item: '/the-kings-severance' },
          ]),
          this.getBookSchema(book),
        ],
        publicationState: 'public',
        h1Text: "The King's Severance",
      };
    }

    // 7. THE BLUE MOON CHILD
    if (routeId === 'blue-moon-child' || routeId === 'the-blue-moon-child') {
      const book = BOOKS.find((b) => b.id === 'blue-moon-child') || BOOKS[1];
      return {
        title: 'The Blue Moon Child | Matthew E. Messmer',
        description:
          'The Blue Moon Child (Breathwoven Cycle Book 2) by Matthew E. Messmer. An orphaned daughter with silver strands in her eyes carries the loom of kings.',
        canonicalPath: '/the-blue-moon-child',
        canonicalUrl: this.getFullCanonicalUrl('/the-blue-moon-child'),
        keywords: [
          'The Blue Moon Child',
          'Matthew E. Messmer',
          'The Breathwoven Cycle Book 2',
          'Epic Fantasy',
          'Kaelen',
          'Archipelago of Spires',
        ],
        robots: defaultRobots,
        ogType: 'book',
        ogTitle: 'The Blue Moon Child | Matthew E. Messmer',
        ogDescription:
          'The Blue Moon Child (Breathwoven Cycle Book 2) by Matthew E. Messmer. An orphaned daughter with silver strands in her eyes carries the loom of kings.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'The Blue Moon Child | Matthew E. Messmer',
        twitterDescription: 'The Blue Moon Child by Matthew E. Messmer. Book Two of The Breathwoven Cycle.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Books', item: '/books' },
          { name: 'The Blue Moon Child', item: '/the-blue-moon-child' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Books', item: '/books' },
            { name: 'The Blue Moon Child', item: '/the-blue-moon-child' },
          ]),
          this.getBookSchema(book),
        ],
        publicationState: 'public',
        h1Text: 'The Blue Moon Child',
      };
    }

    // 8. THE WEAVER'S LULLABY
    if (routeId === 'weavers-lullaby' || routeId === 'the-weavers-lullaby') {
      const book = BOOKS.find((b) => b.id === 'weavers-lullaby') || BOOKS[2];
      return {
        title: "The Weaver's Lullaby | Matthew E. Messmer",
        description:
          "The Weaver's Lullaby (Breathwoven Cycle Book 3) by Matthew E. Messmer. The climactic conclusion to the first arc of The Breathwoven Cycle.",
        canonicalPath: '/the-weavers-lullaby',
        canonicalUrl: this.getFullCanonicalUrl('/the-weavers-lullaby'),
        keywords: [
          "The Weaver's Lullaby",
          'Matthew E. Messmer',
          'The Breathwoven Cycle Book 3',
          'The Great Mending',
          'Epic Fantasy Finale',
        ],
        robots: defaultRobots,
        ogType: 'book',
        ogTitle: "The Weaver's Lullaby | Matthew E. Messmer",
        ogDescription:
          "The Weaver's Lullaby (Breathwoven Cycle Book 3) by Matthew E. Messmer. The climactic conclusion to the first arc of The Breathwoven Cycle.",
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: "The Weaver's Lullaby | Matthew E. Messmer",
        twitterDescription: "The Weaver's Lullaby by Matthew E. Messmer. The final stitch is never spoken; it is endured.",
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Books', item: '/books' },
          { name: "The Weaver's Lullaby", item: '/the-weavers-lullaby' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Books', item: '/books' },
            { name: "The Weaver's Lullaby", item: '/the-weavers-lullaby' },
          ]),
          this.getBookSchema(book),
        ],
        publicationState: 'public',
        h1Text: "The Weaver's Lullaby",
      };
    }

    // 9. STORIES
    if (routeId === 'stories') {
      return {
        title: 'Stories | Matthew E. Messmer',
        description:
          'Original short fiction, lore chronicles, and companion stories from author Matthew E. Messmer.',
        canonicalPath: '/stories',
        canonicalUrl: this.getFullCanonicalUrl('/stories'),
        keywords: [
          'Stories by Matthew E. Messmer',
          'Short Stories',
          'Breathwoven Lore',
          'Fantasy Fiction',
          'The Bell of Oros-Thal',
          'Threads of the Vanguard',
        ],
        robots: defaultRobots,
        ogType: 'website',
        ogTitle: 'Stories | Matthew E. Messmer',
        ogDescription:
          'Original short fiction, lore chronicles, and companion stories from author Matthew E. Messmer.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'Stories | Matthew E. Messmer',
        twitterDescription: 'Original short fiction and companion tales by author Matthew E. Messmer.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Stories', item: '/stories' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Stories', item: '/stories' },
          ]),
          {
            '@type': 'CollectionPage',
            name: 'Stories by Matthew E. Messmer',
            description: 'Original short stories and fantasy fiction by Matthew E. Messmer.',
          },
        ],
        publicationState: 'public',
        h1Text: 'Stories & Tales',
      };
    }

    // 10. ABOUT
    if (routeId === 'about') {
      return {
        title: 'About Matthew E. Messmer | Author',
        description:
          'Meet Matthew E. Messmer: fantasy author, Navy veteran (MA3), father of four, IT professional, and physical laser engraving creator based in Texas.',
        canonicalPath: '/about',
        canonicalUrl: this.getFullCanonicalUrl('/about'),
        keywords: [
          'About Matthew E. Messmer',
          'Matthew E. Messmer biography',
          'Navy veteran author',
          'Texas fantasy author',
          'Laser engraving hobbyist',
          'Information Technology author',
        ],
        robots: defaultRobots,
        ogType: 'profile',
        ogTitle: 'About Matthew E. Messmer | Author',
        ogDescription:
          'Meet Matthew E. Messmer: fantasy author, Navy veteran (MA3), father of four, IT professional, and physical laser engraving creator based in Texas.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'About Matthew E. Messmer | Author',
        twitterDescription:
          'Storyteller, Navy veteran, father of four, IT student, and creator of The Breathwoven Cycle. Official biography.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'About', item: '/about' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'About', item: '/about' },
          ]),
          this.getAuthorPersonSchema(),
        ],
        publicationState: 'public',
        h1Text: 'About Matthew E. Messmer',
      };
    }

    // 11. NEWS / DISPATCHES
    if (routeId === 'news') {
      return {
        title: 'News & Updates | Matthew E. Messmer',
        description:
          'News, writing progress dispatches, and workshop craft reports from author Matthew E. Messmer.',
        canonicalPath: '/news',
        canonicalUrl: this.getFullCanonicalUrl('/news'),
        keywords: [
          'Matthew E. Messmer News',
          'Author Dispatches',
          'Writing Progress',
          'Book Announcements',
          'Workshop Updates',
        ],
        robots: defaultRobots,
        ogType: 'website',
        ogTitle: 'News & Updates | Matthew E. Messmer',
        ogDescription:
          'News, writing progress dispatches, and workshop craft reports from author Matthew E. Messmer.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'News & Updates | Matthew E. Messmer',
        twitterDescription: 'Latest announcements, writing progress, and workshop reports from author Matthew E. Messmer.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'News & Updates', item: '/news' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'News & Updates', item: '/news' },
          ]),
          {
            '@type': 'Blog',
            name: 'Dispatches & News by Matthew E. Messmer',
            blogPost: NEWS_ARTICLES.map((article) => ({
              '@type': 'BlogPosting',
              headline: article.title,
              description: article.summary,
              datePublished: article.date,
              author: this.getAuthorPersonSchema(),
            })),
          },
        ],
        publicationState: 'public',
        h1Text: 'News & Dispatches',
      };
    }

    // 12. GALLERY / CRAFT
    if (routeId === 'gallery' || routeId === 'craft') {
      return {
        title: 'Gallery | Matthew E. Messmer',
        description:
          'Explore handcrafted laser-engraved woodcraft, bookmarks, and physical artifacts inspired by the fantasy worlds of Matthew E. Messmer.',
        canonicalPath: '/gallery',
        canonicalUrl: this.getFullCanonicalUrl('/gallery'),
        keywords: [
          'Matthew E. Messmer Gallery',
          'Laser Engraving',
          'Handcrafted Woodwork',
          'Fantasy Bookmarks',
          'Bookplate Engraving',
          'Physical Craft',
        ],
        robots: defaultRobots,
        ogType: 'website',
        ogTitle: 'Gallery | Matthew E. Messmer',
        ogDescription:
          'Explore handcrafted laser-engraved woodcraft, bookmarks, and physical artifacts inspired by the fantasy worlds of Matthew E. Messmer.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'Gallery | Matthew E. Messmer',
        twitterDescription:
          'Handcrafted laser engraving, wooden bookmarks, and physical artifacts from the workshop of Matthew E. Messmer.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Gallery', item: '/gallery' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Gallery', item: '/gallery' },
          ]),
          {
            '@type': 'ImageGallery',
            name: 'Physical Craft & Laser Engraving Gallery',
            description: 'Physical artwork and laser engravings created by author Matthew E. Messmer.',
            hasPart: CRAFT_ARTWORKS.map((craft) => ({
              '@type': 'VisualArtwork',
              name: craft.title,
              artMedium: craft.medium,
              description: craft.description,
              creator: this.getAuthorPersonSchema(),
            })),
          },
        ],
        publicationState: 'public',
        h1Text: 'Physical Craft & Gallery',
      };
    }

    // 13. CONTACT
    if (routeId === 'contact') {
      return {
        title: 'Contact Matthew E. Messmer',
        description:
          'Get in touch with author Matthew E. Messmer for reader inquiries, book club appearances, signed copies, and media requests.',
        canonicalPath: '/contact',
        canonicalUrl: this.getFullCanonicalUrl('/contact'),
        keywords: [
          'Contact Matthew E. Messmer',
          'Author contact',
          'Book club inquiries',
          'Media requests',
          'Signed copies',
        ],
        robots: defaultRobots,
        ogType: 'website',
        ogTitle: 'Contact Matthew E. Messmer',
        ogDescription:
          'Get in touch with author Matthew E. Messmer for reader inquiries, book club appearances, signed copies, and media requests.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: 'Contact Matthew E. Messmer',
        twitterDescription: 'Reach out to author Matthew E. Messmer for book discussions, appearances, or inquiries.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Contact', item: '/contact' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Contact', item: '/contact' },
          ]),
          {
            '@type': 'ContactPage',
            name: 'Contact Matthew E. Messmer',
            description: 'Direct communication channels for author Matthew E. Messmer.',
            mainEntity: this.getAuthorPersonSchema(),
          },
        ],
        publicationState: 'public',
        h1Text: 'Contact Matthew E. Messmer',
      };
    }

    // 14. PRIVACY
    if (routeId === 'privacy') {
      return {
        title: 'Privacy Policy | Matthew E. Messmer',
        description:
          'Privacy policy for the official author website and newsletter of Matthew E. Messmer. Clear terms, data protection, and easy unsubscribe.',
        canonicalPath: '/privacy',
        canonicalUrl: this.getFullCanonicalUrl('/privacy'),
        keywords: ['Privacy Policy', 'Matthew E. Messmer', 'Newsletter Privacy', 'Reader Protection'],
        robots: 'noindex, follow', // Standard practice for privacy/legal pages
        ogType: 'website',
        ogTitle: 'Privacy Policy | Matthew E. Messmer',
        ogDescription:
          'Privacy policy for the official author website and newsletter of Matthew E. Messmer. Clear terms and strict subscriber protection.',
        ogImage: config.defaultOgImage,
        twitterCard: 'summary',
        twitterTitle: 'Privacy Policy | Matthew E. Messmer',
        twitterDescription: 'Privacy policy for the official website and newsletter of Matthew E. Messmer.',
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Privacy Policy', item: '/privacy' },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Privacy Policy', item: '/privacy' },
          ]),
        ],
        publicationState: 'public',
        h1Text: 'Privacy Policy',
      };
    }

    // Dynamic: Single Story
    if (routeId.startsWith('story-') || routeId.startsWith('/stories/')) {
      const slug = paramSlug || routeId.replace('/stories/', '');
      const story = STORIES.find((s) => s.slug === slug || s.id === slug) || STORIES[0];
      return {
        title: `${story.title} | Matthew E. Messmer`,
        description: story.summary,
        canonicalPath: `/stories/${story.slug}`,
        canonicalUrl: this.getFullCanonicalUrl(`/stories/${story.slug}`),
        keywords: [story.title, 'Matthew E. Messmer', story.universe, 'Fantasy Story'],
        robots: defaultRobots,
        ogType: 'article',
        ogTitle: `${story.title} | Matthew E. Messmer`,
        ogDescription: story.summary,
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: `${story.title} | Matthew E. Messmer`,
        twitterDescription: story.summary,
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'Stories', item: '/stories' },
          { name: story.title, item: `/stories/${story.slug}` },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'Stories', item: '/stories' },
            { name: story.title, item: `/stories/${story.slug}` },
          ]),
          {
            '@type': 'ShortStory',
            headline: story.title,
            description: story.summary,
            author: this.getAuthorPersonSchema(),
            datePublished: story.datePublished,
          },
        ],
        publicationState: 'public',
        h1Text: story.title,
      };
    }

    // Dynamic: Single News Article
    if (routeId.startsWith('news-') || routeId.startsWith('/news/')) {
      const slug = paramSlug || routeId.replace('/news/', '');
      const article = NEWS_ARTICLES.find((a) => a.slug === slug || a.id === slug) || NEWS_ARTICLES[0];
      return {
        title: `${article.title} | Matthew E. Messmer`,
        description: article.summary,
        canonicalPath: `/news/${article.slug}`,
        canonicalUrl: this.getFullCanonicalUrl(`/news/${article.slug}`),
        keywords: [...article.tags, 'Matthew E. Messmer', 'Author News'],
        robots: defaultRobots,
        ogType: 'article',
        ogTitle: `${article.title} | Matthew E. Messmer`,
        ogDescription: article.summary,
        ogImage: config.defaultOgImage,
        twitterCard: 'summary_large_image',
        twitterTitle: `${article.title} | Matthew E. Messmer`,
        twitterDescription: article.summary,
        twitterImage: config.defaultOgImage,
        breadcrumbs: [
          { name: 'Home', item: '/' },
          { name: 'News & Updates', item: '/news' },
          { name: article.title, item: `/news/${article.slug}` },
        ],
        schema: [
          this.getBreadcrumbSchema([
            { name: 'Home', item: '/' },
            { name: 'News & Updates', item: '/news' },
            { name: article.title, item: `/news/${article.slug}` },
          ]),
          {
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.summary,
            datePublished: article.date,
            author: this.getAuthorPersonSchema(),
          },
        ],
        publicationState: 'public',
        h1Text: article.title,
      };
    }

    // Fallback: standard default
    return {
      title: 'Matthew E. Messmer | Author | Stories Woven Through Time',
      description: config.siteDescription,
      canonicalPath: '/',
      canonicalUrl: this.getFullCanonicalUrl('/'),
      robots: defaultRobots,
      ogType: 'website',
      ogTitle: config.siteTitle,
      ogDescription: config.siteDescription,
      ogImage: config.defaultOgImage,
      twitterCard: 'summary_large_image',
      breadcrumbs: [{ name: 'Home', item: '/' }],
      schema: [this.getWebSiteSchema(), this.getAuthorPersonSchema()],
      publicationState: 'public',
      h1Text: config.authorName,
    };
  }

  /**
   * Applies SEO metadata directly to the HTML document head
   */
  public applySEO(data: SEOData): void {
    if (typeof document === 'undefined') return;

    const config = this.getConfig();
    const fullCanonical = data.canonicalUrl || this.getFullCanonicalUrl(data.canonicalPath);

    // 1. Document title
    document.title = data.title;

    // Helper to set or create meta tag
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Meta description
    setMetaTag('name', 'description', data.description);

    // 3. Keywords
    if (data.keywords && data.keywords.length > 0) {
      setMetaTag('name', 'keywords', data.keywords.join(', '));
    }

    // 4. Robots
    setMetaTag('name', 'robots', data.robots || 'index, follow');

    // 5. Canonical link
    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullCanonical);

    // 6. Open Graph Tags
    setMetaTag('property', 'og:site_name', config.siteName);
    setMetaTag('property', 'og:title', data.ogTitle || data.title);
    setMetaTag('property', 'og:description', data.ogDescription || data.description);
    setMetaTag('property', 'og:type', data.ogType || 'website');
    setMetaTag('property', 'og:url', fullCanonical);
    setMetaTag('property', 'og:locale', 'en_US');
    if (data.ogImage || config.defaultOgImage) {
      setMetaTag('property', 'og:image', data.ogImage || config.defaultOgImage);
    }

    // 7. Twitter Card Tags
    setMetaTag('name', 'twitter:card', data.twitterCard || 'summary_large_image');
    setMetaTag('name', 'twitter:title', data.twitterTitle || data.ogTitle || data.title);
    setMetaTag('name', 'twitter:description', data.twitterDescription || data.ogDescription || data.description);
    if (data.twitterImage || data.ogImage || config.defaultOgImage) {
      setMetaTag('name', 'twitter:image', data.twitterImage || data.ogImage || config.defaultOgImage);
    }

    // 8. Google Site Verification
    if (config.googleSiteVerification) {
      setMetaTag('name', 'google-site-verification', config.googleSiteVerification);
    }

    // 9. Structured Data JSON-LD
    let scriptTag = document.getElementById('author-seo-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'author-seo-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const structuredPayload = {
      '@context': 'https://schema.org',
      '@graph': Array.isArray(data.schema)
        ? data.schema
        : data.schema
        ? [data.schema]
        : [this.getWebSiteSchema(), this.getAuthorPersonSchema()],
    };
    scriptTag.textContent = JSON.stringify(structuredPayload, null, 2);

    // 10. Google Analytics 4 (if configured)
    if (config.googleAnalyticsId) {
      let gaScript = document.getElementById('ga-gtag-script') as HTMLScriptElement | null;
      if (!gaScript) {
        gaScript = document.createElement('script');
        gaScript.id = 'ga-gtag-script';
        gaScript.async = true;
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`;
        document.head.appendChild(gaScript);

        const inlineGa = document.createElement('script');
        inlineGa.id = 'ga-init-script';
        inlineGa.textContent = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${config.googleAnalyticsId}');
        `;
        document.head.appendChild(inlineGa);
      }
    }
  }

  /**
   * Generates a fully compliant XML sitemap string
   */
  public generateXMLSitemap(): string {
    const today = new Date().toISOString().split('T')[0];
    const routes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/books', priority: '0.9', changefreq: 'weekly' },
      { path: '/the-breathwoven-cycle', priority: '0.9', changefreq: 'weekly' },
      { path: '/the-abyssal-current', priority: '0.9', changefreq: 'weekly' },
      { path: '/ignis-kor', priority: '0.8', changefreq: 'weekly' },
      { path: '/the-kings-severance', priority: '0.8', changefreq: 'monthly' },
      { path: '/the-blue-moon-child', priority: '0.8', changefreq: 'monthly' },
      { path: '/the-weavers-lullaby', priority: '0.8', changefreq: 'monthly' },
      { path: '/stories', priority: '0.8', changefreq: 'weekly' },
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/news', priority: '0.8', changefreq: 'weekly' },
      { path: '/gallery', priority: '0.7', changefreq: 'monthly' },
      { path: '/contact', priority: '0.7', changefreq: 'monthly' },
      { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
    ];

    // Add dynamic stories
    STORIES.forEach((s) => {
      routes.push({
        path: `/stories/${s.slug}`,
        priority: '0.7',
        changefreq: 'monthly',
      });
    });

    // Add dynamic news articles
    NEWS_ARTICLES.forEach((n) => {
      routes.push({
        path: `/news/${n.slug}`,
        priority: '0.7',
        changefreq: 'monthly',
      });
    });

    const entries = routes
      .map(
        (r) => `  <url>
    <loc>${this.getFullCanonicalUrl(r.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
  }

  /**
   * Generates a compliant robots.txt string
   */
  public generateRobotsTxt(): string {
    const sitemapUrl = this.getFullCanonicalUrl('/sitemap.xml');
    return `# Robots.txt for Matthew E. Messmer Official Author Website
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

# Sitemap location
Sitemap: ${sitemapUrl}
`;
  }

  /**
   * Runs an automated SEO diagnostic test across all defined public routes
   */
  public runSEODiagnostics(): SEODiagnosticResult[] {
    const routeKeys = [
      'home',
      'books',
      'the-breathwoven-cycle',
      'the-abyssal-current',
      'ignis-kor',
      'the-kings-severance',
      'the-blue-moon-child',
      'the-weavers-lullaby',
      'stories',
      'about',
      'news',
      'gallery',
      'contact',
      'privacy',
    ];

    return routeKeys.map((key) => {
      const data = this.getRouteSEO(key);
      const warnings: string[] = [];

      const hasTitle = Boolean(data.title && data.title.trim().length > 0);
      const titleLen = data.title.length;
      const titleLengthOk = titleLen >= 25 && titleLen <= 70;
      if (!titleLengthOk) {
        warnings.push(`Title length (${titleLen} chars) should ideally be between 30 and 65 characters.`);
      }

      const hasDescription = Boolean(data.description && data.description.trim().length > 0);
      const descLen = data.description.length;
      const descriptionLengthOk = descLen >= 80 && descLen <= 170;
      if (!descriptionLengthOk) {
        warnings.push(`Description length (${descLen} chars) should ideally be between 120 and 160 characters.`);
      }

      const hasCanonical = Boolean(data.canonicalUrl && data.canonicalUrl.startsWith('http'));
      if (!hasCanonical) {
        warnings.push('Canonical URL is missing or malformed.');
      }

      const hasRobots = Boolean(data.robots);
      const isIndexable = !(data.robots && data.robots.includes('noindex'));
      const hasOgTitle = Boolean(data.ogTitle);
      const hasOgDescription = Boolean(data.ogDescription);
      const hasOgImage = Boolean(data.ogImage);
      const hasH1 = Boolean(data.h1Text);
      const hasSchema = Boolean(data.schema);
      const inSitemap = true;

      let status: 'pass' | 'warning' | 'error' = 'pass';
      if (!hasTitle || !hasDescription || !hasCanonical) {
        status = 'error';
      } else if (warnings.length > 0) {
        status = 'warning';
      }

      return {
        routeId: key,
        pageTitle: data.title,
        path: data.canonicalPath,
        publicationState: data.publicationState || 'public',
        hasTitle,
        titleLengthOk,
        hasDescription,
        descriptionLengthOk,
        hasCanonical,
        hasRobots,
        isIndexable,
        hasOgTitle,
        hasOgDescription,
        hasOgImage,
        hasH1,
        hasSchema,
        schemaType: Array.isArray(data.schema)
          ? data.schema.map((s: Record<string, unknown>) => s['@type'] || 'Object').join(', ')
          : (data.schema as Record<string, unknown>)?.['@type']?.toString() || 'Schema',
        inSitemap,
        warnings,
        status,
      };
    });
  }
}

export const seoService = new SEOService();
