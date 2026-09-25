import React, { useState } from 'react';
import { NEWS_ARTICLES } from '../../data/authorData';
import { NewsArticle } from '../../types';
import { Feather, Calendar, Tag, ArrowRight, Eye, CheckCircle2, Clock } from 'lucide-react';

export const AdminNewsView: React.FC = () => {
  const [articles] = useState<NewsArticle[]>([...NEWS_ARTICLES]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
            News & Dispatches Management
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Public dispatches, release announcements, and author craft articles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-[#171924] rounded-lg text-xs font-cinzel text-[#c5a059] border border-[#2b2e40]">
            {articles.length} Dispatches Published
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {articles.map((article) => (
          <div
            key={article.id}
            className="p-5 bg-[#11131c] border border-[#232635] rounded-xl hover:border-[#c5a059]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 rounded text-[10px] font-cinzel uppercase tracking-wider font-semibold">
                  {article.category}
                </span>
                <span className="text-[11px] text-[#7d776a] font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {article.date}
                </span>
              </div>

              <h3 className="text-base font-cinzel font-bold text-[#f5efeb]">
                {article.title}
              </h3>
              <p className="text-xs text-[#8e887a] line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setSelectedArticle(article)}
                className="px-3 py-1.5 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#c5a059] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Read Article</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4">
              <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059]">
                {selectedArticle.category} · {selectedArticle.date}
              </span>
              <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-1">
                {selectedArticle.title}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm text-[#d4cfc2] leading-relaxed">
              {selectedArticle.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="border-t border-[#232635] pt-4 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
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
