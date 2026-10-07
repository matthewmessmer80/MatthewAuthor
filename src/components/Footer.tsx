import React, { useState, useEffect } from 'react';
import { NewsletterSignup } from './NewsletterSignup';
import { AUTHOR_INFO } from '../data/authorData';
import { bookService, ManagedSeries } from '../services/bookService';
import { useAuth } from '../context/AuthContext';
import { Shield } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onOpenPrivacy: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  setActiveTab,
  onOpenPrivacy,
  onOpenAdmin,
}) => {
  const { canEditSite } = useAuth();
  const [seriesList, setSeriesList] = useState<ManagedSeries[]>(() => {
    const cached = bookService.getCachedSeries();
    return cached && cached.length > 0 ? cached : [];
  });

  useEffect(() => {
    let isMounted = true;

    const fetchSeries = async () => {
      try {
        const list = await bookService.getAllSeries();
        if (isMounted && list && list.length > 0) {
          setSeriesList(list);
        }
      } catch (err) {
        if (isMounted) {
          const cached = bookService.getCachedSeries();
          if (cached && cached.length > 0) {
            setSeriesList(cached);
          }
        }
      }
    };

    fetchSeries();
    const unsub = bookService.subscribe(fetchSeries);
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Filter out any archived series; show all current series
  const activeSeries = seriesList.filter((s) => s.status !== 'ARCHIVED');

  const handleSeriesClick = (series: ManagedSeries) => {
    let targetTab = `/series/${series.slug || series.id}`;
    if (series.id === 'breathwoven-cycle' || series.slug === 'the-breathwoven-cycle') {
      targetTab = 'breathwoven-cycle';
    } else if (
      series.id === 'abyssal-current' ||
      series.slug === 'the-abyssal-current' ||
      series.slug === 'abyssal'
    ) {
      targetTab = 'abyssal';
    }
    setActiveTab(targetTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#08090d] border-t border-[#1e202d] text-[#8e897d] pt-14 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[#1b1d28]">
          {/* Col 1: Author Brand & Philosophy */}
          <div className="md:col-span-4 space-y-4">
            <span className="text-xl font-cinzel font-bold tracking-wider text-[#f5efeb] block">
              Matthew E. Messmer
            </span>
            <p className="text-xs uppercase tracking-widest text-[#c5a059] font-medium">
              Stories Woven Through Time
            </p>
            <p className="text-xs text-[#9d978a] leading-relaxed max-w-sm">
              Author, storyteller, Navy veteran, and physical woodcraft creator. Exploring the threads of courage, family, and memory across time.
            </p>
            <div className="pt-2 text-[11px] text-[#6d685c]">
              Based in Texas · The Breathwoven Cycle & The Abyssal Current
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase font-cinzel tracking-widest text-[#d5cfc2] font-semibold">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#f5efeb] transition-colors cursor-pointer text-left block"
                >
                  Homepage
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('books');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#f5efeb] transition-colors cursor-pointer text-left block"
                >
                  All Books
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('audio-hub');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#f5efeb] transition-colors cursor-pointer text-left block"
                >
                  Audio & Soundtracks
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('craft');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#f5efeb] transition-colors cursor-pointer text-left block"
                >
                  Gallery & Craft
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#f5efeb] transition-colors cursor-pointer text-left block"
                >
                  About Matthew
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('news');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#f5efeb] transition-colors cursor-pointer text-left block"
                >
                  Dispatches & News
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#f5efeb] transition-colors cursor-pointer text-[#c5a059] text-left block"
                >
                  Contact Matthew
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Works (Dynamic Series & Short Stories) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase font-cinzel tracking-widest text-[#d5cfc2] font-semibold">
              Works
            </h4>
            <ul className="space-y-2 text-xs">
              {activeSeries.map((series) => (
                <li key={series.id}>
                  <button
                    onClick={() => handleSeriesClick(series)}
                    className="text-[#b5af9f] hover:text-[#f5efeb] text-left transition-colors cursor-pointer block"
                  >
                    {series.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => {
                    setActiveTab('stories');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-[#b5af9f] hover:text-[#f5efeb] text-left transition-colors cursor-pointer block"
                >
                  Short Stories
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Footer Compact Newsletter Signup */}
          <div className="md:col-span-4">
            <NewsletterSignup
              variant="footer"
              heading="Stay Connected"
              text="Get occasional updates from Matthew E. Messmer."
              buttonText="Subscribe"
              source="footer"
              showFirstName={false}
              showConsent={false}
              onOpenPrivacy={onOpenPrivacy}
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6e6a5e]">
          <p>© {new Date().getFullYear()} Matthew E. Messmer. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[#c5a059] transition-colors cursor-pointer underline"
            >
              Privacy Policy
            </button>

            {canEditSite && (
              <>
                <span aria-hidden="true">·</span>

                <button
                  onClick={onOpenAdmin}
                  className="hover:text-[#c5a059] transition-colors cursor-pointer flex items-center gap-1"
                  title="Author Administration & Content Editor"
                >
                  <Shield className="w-3 h-3 text-[#c5a059]" />
                  <span>Admin Portal (Edit Site)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
