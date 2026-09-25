import React, { useState } from 'react';
import { STORIES } from '../../data/authorData';
import { Story } from '../../types';
import {
  BookOpen,
  Feather,
  Plus,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdminStoriesView: React.FC = () => {
  const [storiesList] = useState<Story[]>([...STORIES]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            Stories & Lore Management
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Manage canon short fiction, worldbuilding tales, and side stories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-[#171924] rounded-lg text-xs font-cinzel text-[#c5a059] border border-[#2b2e40]">
            {storiesList.length} Canon Stories
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {storiesList.map((story) => (
          <div
            key={story.id}
            className="bg-[#11131c] border border-[#232635] rounded-xl p-5 hover:border-[#c5a059]/40 transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059] px-2 py-0.5 bg-[#c5a059]/10 rounded border border-[#c5a059]/20">
                  {story.universe || 'Standalone Lore'}
                </span>
                <span className="text-[11px] text-[#7d776a] font-mono">{story.readTime}</span>
              </div>

              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                {story.title}
              </h3>
              {story.subtitle && (
                <p className="text-xs text-[#a8a396] font-cormorant italic text-sm line-clamp-2">
                  "{story.subtitle}"
                </p>
              )}
              <p className="text-xs text-[#7d776a] line-clamp-3 leading-relaxed">
                {story.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-[#1e202d] flex items-center justify-between">
              <span className="text-[11px] text-[#6d685c]">
                {story.datePublished || 'Canon Lore'}
              </span>

              <button
                onClick={() => setSelectedStory(story)}
                className="px-2.5 py-1 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#c5a059] rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>Read Story</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Excerpt Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4">
              <div className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059]">
                {selectedStory.universe} · Reading Room
              </div>
              <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-1">
                {selectedStory.title}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 font-cormorant text-base text-[#d4cfc2] leading-relaxed">
              {selectedStory.content && selectedStory.content.length > 0 ? (
                selectedStory.content.map((p: string, idx: number) => <p key={idx}>{p}</p>)
              ) : (
                <p className="italic text-[#8e887a]">No text stored for this story.</p>
              )}
            </div>

            <div className="border-t border-[#232635] pt-4 flex justify-end">
              <button
                onClick={() => setSelectedStory(null)}
                className="px-4 py-2 bg-[#171924] hover:bg-[#212433] text-xs font-cinzel text-[#f5efeb] rounded-lg cursor-pointer"
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
