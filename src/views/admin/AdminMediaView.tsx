import React, { useState, useEffect } from 'react';
import { bookService, ManagedBook } from '../../services/bookService';
import { CRAFT_ARTWORKS } from '../../data/authorData';
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Trash2,
  Filter,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  title: string;
  category: 'Book Covers' | 'Series Artwork' | 'Author' | 'Gallery' | 'Stories' | 'News' | 'Other';
  dimensions?: string;
  format: string;
  fileSize?: string;
  updatedAt: string;
}

export const AdminMediaView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMedia = async () => {
    const books = await bookService.getBooks();
    const items: MediaItem[] = [];

    // Book covers
    books.forEach((b) => {
      if (b.coverImage) {
        items.push({
          id: `book-${b.id}`,
          url: b.coverImage,
          title: `${b.title} Cover`,
          category: 'Book Covers',
          dimensions: '1600 × 2400',
          format: b.coverImage.startsWith('data:image/png') ? 'PNG' : 'WEBP',
          fileSize: '~480 KB',
          updatedAt: b.updatedAt || 'Recently',
        });
      }
    });

    // Author photo
    items.push({
      id: 'author-portrait',
      url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
      title: 'Matthew E. Messmer Official Portrait',
      category: 'Author',
      dimensions: '800 × 800',
      format: 'JPEG',
      fileSize: '320 KB',
      updatedAt: '2024-01-15',
    });

    // Gallery / Laser Engravings
    CRAFT_ARTWORKS.forEach((craft, idx) => {
      const craftImages = [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=1200',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
      ];
      items.push({
        id: `craft-${craft.id}`,
        url: craftImages[idx % craftImages.length],
        title: craft.title,
        category: 'Gallery',
        dimensions: craft.dimensions || '1200 × 900',
        format: 'JPEG',
        fileSize: '410 KB',
        updatedAt: craft.year || '2025',
      });
    });

    // Series Artwork
    items.push({
      id: 'series-breathwoven',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
      title: 'The Breathwoven Cycle Landscape',
      category: 'Series Artwork',
      dimensions: '1920 × 1080',
      format: 'JPEG',
      fileSize: '650 KB',
      updatedAt: '2024-05-10',
    });

    items.push({
      id: 'series-abyssal',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200',
      title: 'The Abyssal Current Oceanic Chart',
      category: 'Series Artwork',
      dimensions: '1920 × 1080',
      format: 'JPEG',
      fileSize: '710 KB',
      updatedAt: '2024-07-01',
    });

    setMediaItems(items);
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const categories = ['All', 'Book Covers', 'Series Artwork', 'Author', 'Gallery', 'Stories', 'News', 'Other'];

  const filteredItems = mediaItems.filter((item) => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Media Library
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Cloud-managed media assets, high-resolution book covers, and gallery wood reliefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadMedia}
            className="p-2 bg-[#171924] hover:bg-[#202332] text-[#8e887a] hover:text-[#f5efeb] rounded-lg transition-colors cursor-pointer"
            title="Refresh assets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel tracking-wider transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#c5a059] text-[#0c0d12] font-bold shadow-md shadow-[#c5a059]/15'
                  : 'bg-[#12141e] text-[#8e887a] hover:bg-[#1a1d2b] hover:text-[#f5efeb]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter assets by name..."
          className="w-full sm:w-64 px-3 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] placeholder-[#6e685a] focus:outline-none focus:border-[#c5a059]"
        />
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#11131c] border border-[#232635] rounded-xl overflow-hidden hover:border-[#c5a059]/40 transition-all flex flex-col group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-[#08090d] flex items-center justify-center overflow-hidden border-b border-[#1e202e]">
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#0c0d13]/85 backdrop-blur-sm border border-[#2b2e40] rounded text-[10px] font-cinzel text-[#c5a059] uppercase tracking-wider">
                {item.category}
              </span>
            </div>

            {/* Info */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-xs font-cinzel font-semibold text-[#f5efeb] line-clamp-1">
                  {item.title}
                </h4>
                <div className="text-[11px] text-[#7d776a] mt-1 flex items-center gap-2">
                  <span>{item.format}</span>
                  <span>·</span>
                  <span>{item.dimensions || 'Responsive'}</span>
                  <span>·</span>
                  <span>{item.fileSize}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1a1c28] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyUrl(item)}
                  className="px-2.5 py-1 bg-[#171924] hover:bg-[#202332] text-[11px] font-cinzel text-[#c5a059] rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-[#7d776a] hover:text-[#f5efeb] transition-colors"
                  title="Open full resolution in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
