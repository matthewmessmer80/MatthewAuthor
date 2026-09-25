import React, { useState } from 'react';
import { CraftArtwork } from '../types';
import { CRAFT_ARTWORKS } from '../data/authorData';
import { useSEO } from '../hooks/useSEO';
import { Hammer, Sparkles, Layers, Bookmark, Compass, Shield } from 'lucide-react';

export const CraftView: React.FC = () => {
  useSEO('gallery');
  const [selectedArtwork, setSelectedArtwork] = useState<CraftArtwork | null>(CRAFT_ARTWORKS[0]);

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
        <h3 className="text-xl font-cinzel font-bold text-[#f5efeb]">
          Featured Handcrafted Pieces
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CRAFT_ARTWORKS.map((artwork) => {
            const isSelected = selectedArtwork?.id === artwork.id;
            return (
              <div
                key={artwork.id}
                onClick={() => setSelectedArtwork(artwork)}
                className={`p-6 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#181b28] border-[#c5a059] shadow-xl shadow-[#c5a059]/10'
                    : 'bg-[#12141e] border-[#242738] hover:border-[#c5a059]/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#a39e92] mb-3">
                    <span className="text-[#c5a059] font-medium">{artwork.medium}</span>
                    <span>{artwork.year}</span>
                  </div>

                  <h4 className="text-lg font-cinzel font-bold text-[#f5efeb] mb-2">
                    {artwork.title}
                  </h4>

                  <p className="text-xs text-[#aba597] leading-relaxed mb-4">
                    {artwork.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1f2232] flex items-center justify-between text-xs text-[#7a7569]">
                  <span>Dimensions: {artwork.dimensions}</span>
                  <span className="text-[#c5a059] font-medium font-cinzel">
                    {artwork.inspirationBookId ? 'Story Artifact' : 'Original Piece'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
