import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import { newsService } from '../services/newsService';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { Feather, Calendar, Clock, Tag, ArrowRight, BookOpen, ChevronLeft, Loader2 } from 'lucide-react';

interface NewsViewProps {
  onOpenPrivacy?: () => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onOpenPrivacy }) => {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO(selectedArticle ? `news/${selectedArticle.slug}` : 'news');

  useEffect(() => {
    const unsub = newsService.subscribe((list) => {
      // Security: Public readers must only see PUBLIC or TEASER articles. Never DRAFT or PRIVATE.
      const publicOnly = list.filter((a) => {
        const state = (a.publicationState || 'PUBLIC').toUpperCase();
        return state === 'PUBLIC' || state === 'TEASER';
      });
      setArticles(publicOnly);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  const filteredArticles = articles.filter((article) => {
    if (categoryFilter === 'all') return true;
    return article.category === categoryFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          Author Journal & Notes
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cinzel font-bold text-[#f5efeb] tracking-tight">
          Dispatches from the Loom
        </h1>
        <p className="text-sm sm:text-base text-[#a8a396] font-cormorant italic text-xl leading-relaxed">
          Essays on storytelling craft, Navy and IT discipline, laser-engraved artifacts, and worldbuilding progress.
        </p>
      </div>

      {selectedArticle ? (
        /* SINGLE ARTICLE EXPANDED VIEW */
        <article className="bg-[#12141e] border border-[#232635] rounded-2xl p-6 sm:p-10 space-y-8 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-1.5 text-xs text-[#c5a059] hover:text-[#d6b169] font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to All Dispatches</span>
          </button>

          <div className="space-y-3 pb-6 border-b border-[#202334]">
            <div className="flex items-center gap-2 text-xs text-[#a39e92]">
              <span className="text-[#c5a059] font-semibold">{selectedArticle.category}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedArticle.date}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedArticle.readTime}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-cinzel font-bold text-[#f5efeb] tracking-tight leading-tight">
              {selectedArticle.title}
            </h2>

            <p className="text-base font-cormorant italic text-[#c2bcb0]">
              {selectedArticle.summary}
            </p>
          </div>

          <div className="space-y-5 text-sm sm:text-base text-[#ded8cc] leading-relaxed sm:leading-loose font-reading">
            {selectedArticle.content.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          <div className="pt-6 border-t border-[#202334] flex items-center justify-between flex-wrap gap-3 text-xs text-[#8e887a]">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#c5a059]" />
              {selectedArticle.tags.map((t, idx) => (
                <span key={t}>
                  #{t}
                  {idx < selectedArticle.tags.length - 1 && <span className="mx-1">·</span>}
                </span>
              ))}
            </div>

            <button
              onClick={() => setSelectedArticle(null)}
              className="text-xs text-[#c5a059] hover:underline"
            >
              Return to article list
            </button>
          </div>
        </article>
      ) : (
        /* ARTICLES LIST VIEW */
        <div className="space-y-8">
          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1 p-1 bg-[#131520] border border-[#232635] rounded-lg flex-wrap justify-center">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 text-xs font-cinzel rounded-md transition-colors cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-[#c5a059] text-[#0d0e14] font-bold'
                    : 'text-[#9c9689] hover:text-[#f5efeb]'
                }`}
              >
                All Dispatches
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-cinzel rounded-md transition-colors cursor-pointer ${
                    categoryFilter === cat
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
              <p className="text-xs font-cinzel">Loading dispatches...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 text-center bg-[#11131c] border border-[#232635] rounded-xl text-xs text-[#8e887a]">
              No dispatches currently available in this category.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="p-6 sm:p-8 rounded-xl bg-[#12141e] border border-[#232635] hover:border-[#c5a059]/40 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-[#8e887a]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#c5a059] font-semibold">{article.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.date}</span>
                    </div>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors leading-tight">
                    {article.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#aba597] leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#736e63]">
                      {article.tags.map((t) => (
                        <span key={t}>#{t}</span>
                      ))}
                    </div>

                    <span className="text-[#c5a059] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Dispatch</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MANDATORY NEWS PAGE NEWSLETTER SECTION */}
      {/*
        "News Page:
         Add a signup section near the bottom of the page."
      */}
      <div className="pt-6">
        <NewsletterSignup
          variant="news"
          heading="Subscribe to Dispatches"
          text="Receive essays on craft, chapter previews, and updates on physical woodcraft creations straight to your inbox."
          buttonText="Subscribe to Dispatches"
          source="news_dispatches_page"
          showFirstName={true}
          showConsent={true}
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
