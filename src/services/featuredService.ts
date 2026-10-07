import { Book, Story, MonthlyFeaturedConfig } from '../types';
import { bookService, ManagedBook, managedBookToBook } from './bookService';
import { storyService } from './storyService';
import { siteContentService } from './siteContentService';

export interface FeaturedItemResult {
  item: Book | Story;
  type: 'book' | 'story';
  isOverride: boolean;
  note?: string;
  monthName: string;
  year: number;
}

class FeaturedService {
  private monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /**
   * Resolves the current month's featured item:
   * 1. Checks if an Author manual override is configured in site content.
   * 2. Otherwise, automatically rotates through published books and short stories deterministically by calendar month.
   */
  async getCurrentFeaturedItem(): Promise<FeaturedItemResult | null> {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();
    const monthName = this.monthNames[currentMonthIndex];

    const content = siteContentService.getContent();
    const override = content.monthlyFeatured;

    const [allManagedBooks, allStories] = await Promise.all([
      bookService.getPublicBooks(),
      storyService.getStories(),
    ]);

    const convertedBooks: Book[] = allManagedBooks.map((mb) => managedBookToBook(mb));

    const publishedBooks = convertedBooks.filter((b) => b.publicationState === 'PUBLIC' || b.status === 'published');
    const publishedStories = allStories.filter((s) => s.publicationState === 'PUBLIC' || !s.publicationState);

    // Check Author manual override
    const targetOverrideId = override?.overrideId || override?.itemId;
    if (override && override.mode === 'override' && targetOverrideId) {
      if (override.overrideType === 'story') {
        const foundStory = allStories.find((s) => s.id === targetOverrideId);
        if (foundStory) {
          return {
            item: foundStory,
            type: 'story',
            isOverride: true,
            note: override.customNote || 'Author’s Spotlight for this month.',
            monthName,
            year: currentYear,
          };
        }
      } else {
        const foundBook = convertedBooks.find((b) => b.id === targetOverrideId);
        if (foundBook) {
          return {
            item: foundBook,
            type: 'book',
            isOverride: true,
            note: override.customNote || 'Author’s Spotlight for this month.',
            monthName,
            year: currentYear,
          };
        }
      }
    }

    // AUTOMATIC MONTHLY ROTATION FALLBACK:
    const combinedPool: Array<{ item: Book | Story; type: 'book' | 'story' }> = [
      ...publishedBooks.map((b) => ({ item: b, type: 'book' as const })),
      ...publishedStories.map((s) => ({ item: s, type: 'story' as const })),
    ];

    if (combinedPool.length === 0) {
      return null;
    }

    const rotationIndex = Math.abs(currentYear * 12 + currentMonthIndex) % combinedPool.length;
    const selected = combinedPool[rotationIndex];

    return {
      item: selected.item,
      type: selected.type,
      isOverride: false,
      note: selected.type === 'book'
        ? `Canon Feature for ${monthName} ${currentYear}`
        : `Featured Short Story for ${monthName} ${currentYear}`,
      monthName,
      year: currentYear,
    };
  }
}

export const featuredService = new FeaturedService();
