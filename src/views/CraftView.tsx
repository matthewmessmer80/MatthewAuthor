import React, { useState, useEffect } from 'react';
import { GalleryItem } from '../types';
import { galleryService } from '../services/galleryService';
import { useSEO } from '../hooks/useSEO';
import { Hammer, Sparkles, Layers, Bookmark, Compass, Shield, Image as ImageIcon, X, ExternalLink, Loader2 } from 'lucide-react';

export const CraftView: React.FC = () => {
  useSEO('gallery');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    const unsub = galleryService.subscribe((list) => {
      // Security: Readers only see PUBLIC or TEASER gallery items. Never DRAFT or PRIVATE.
      const publicItems = list.filter((item) => {
        const state = (item.publicationState || 'PUBLIC').toUpperCase();
        return state === 'PUBLIC' || state === 'TEASER';
      });
      setItems(publicItems);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <p className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          The Texas Workshop
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
          Physical Craft & Laser Engraving
        </h1>
        <p className="text-sm sm:text-base text-[#a8a396] font-cormorant italic text-xl leading-relaxed">
          "For Matthew, creativity isn't limited to one medium. A story can live on a page, a digital screen, or even be carved into wood."
        </p>
      </div>

      {/* Narrative Section: Craft meets code and story */}
      <div className="bg-[#11131c] border border-[#232635] rounded-2xl p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
              Taking Ideas from Imagination into Tangible Reality
            </h3>
            <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
              Between raising four children, working in Information Technology, and writing novels, Matthew spends time in his Texas workshop operating laser engraving systems. What starts as vector mathematics on a workstation screen becomes burns and relief carvings across walnut, maple, and brass.
            </p>
            <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
              From decorative seals of the Royal House of Val-Mora to multi-tiered bathymetric maps for <em>The Abyssal Current</em>, physical craft allows readers to hold a tangible piece of the fantasy universe in their hands.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs text-[#8e887a]">
              <span>Diode & CO2 Laser Systems</span>
              <span aria-hidden="true">·</span>
              <span>American Hardwoods</span>
              <span aria-hidden="true">·</span>
              <span>Hand-Rubbed Tung Oil & Beeswax</span>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl bg-[#161826] border border-[#2b2e40] space-y-3 text-xs text-[#c2bcb0]">
            <div className="flex items-center gap-2 text-[#c5a059] font-cinzel font-semibold uppercase text-xs">
              <Layers className="w-4 h-4" />
              <span>Workshop Disciplines</span>
            </div>
            <p>
              • <strong>High-Resolution Vector Rastering:</strong> 1000 DPI laser beam tracing of fantasy insignias and book title typographic crests.
            </p>
            <p>
              • <strong>Topographic Layering:</strong> Multi-ply birch sheets stepped at 0.5mm increments to simulate ocean trenches and royal spires.
            </p>
            <p>
              • <strong>End-Grain Stamping Blocks:</strong> Carved hard rock maple blocks for stamping limited first-edition hardcovers.
            </p>
          </div>
        </div>
      </div>

      {/* Workshop Gallery Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
            Handcrafted Artifacts & Visual Gallery
          </h3>

          {/* Category Tabs */}
          <div className="inline-flex items-center gap-1 p-1 bg-[#131520] border border-[#232635] rounded-lg flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-cinzel rounded-md transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#c5a059] text-[#0d0e14] font-bold'
                    : 'text-[#9c9689] hover:text-[#f5efeb]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#8e887a] space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#c5a059]" />
            <p className="text-xs font-cinzel">Loading gallery artifacts...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center bg-[#11131c] border border-[#232635] rounded-xl text-xs text-[#8e887a]">
            No gallery artifacts found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="bg-[#12141e] border border-[#242738] hover:border-[#c5a059]/40 rounded-xl overflow-hidden transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {item.imageUrl && (
                    <div className="relative aspect-4/3 bg-[#0a0b10] overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.altText || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2 py-0.5 bg-black/75 text-[#c5a059] border border-[#c5a059]/30 rounded text-[10px] font-cinzel font-semibold backdrop-blur-md">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-2">
                    <h4 className="text-base font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-[#aba597] leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-[#0e1018] border-t border-[#1f2232] flex items-center justify-between text-xs text-[#7a7569]">
                  <span>{item.dimensions || item.medium || 'Workshop Piece'}</span>
                  <span className="text-[#c5a059] font-medium font-cinzel text-[11px]">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Zoom Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#11131c] border border-[#2b2e40] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative aspect-16/9 bg-black flex items-center justify-center">
              <img
                src={activeItem.imageUrl}
                alt={activeItem.altText || activeItem.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-[#f5efeb] rounded-full backdrop-blur-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              <span className="text-xs font-cinzel font-bold text-[#c5a059] uppercase tracking-wider">
                {activeItem.category}
              </span>
              <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
                {activeItem.title}
              </h3>
              {activeItem.description && (
                <p className="text-xs sm:text-sm text-[#ded8cc] leading-relaxed">
                  {activeItem.description}
                </p>
              )}

              {(activeItem.dimensions || activeItem.medium) && (
                <div className="pt-3 border-t border-[#202334] grid grid-cols-2 gap-3 text-xs text-[#8e887a]">
                  {activeItem.medium && (
                    <div>
                      <span className="block text-[10px] text-[#6b665c] font-mono">Medium:</span>
                      <span className="text-[#ded8cc]">{activeItem.medium}</span>
                    </div>
                  )}
                  {activeItem.dimensions && (
                    <div>
                      <span className="block text-[10px] text-[#6b665c] font-mono">Dimensions:</span>
                      <span className="text-[#ded8cc]">{activeItem.dimensions}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-[#0d0e16] border-t border-[#1d202e] flex justify-end">
              <button
                onClick={() => setActiveItem(null)}
                className="px-4 py-1.5 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#f5efeb] rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
