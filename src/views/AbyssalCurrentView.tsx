import React from 'react';
import { Book } from '../types';
import { BOOKS } from '../data/authorData';
import { BookCoverArt } from '../components/BookCoverArt';
import { NewsletterSignup } from '../components/NewsletterSignup';
import { useSEO } from '../hooks/useSEO';
import { Waves, Compass, Anchor, BookOpen, Clock, Shield, Sparkles } from 'lucide-react';

interface AbyssalCurrentViewProps {
  onOpenExcerpt: (book: Book) => void;
  onOpenPrivacy?: () => void;
}

export const AbyssalCurrentView: React.FC<AbyssalCurrentViewProps> = ({
  onOpenExcerpt,
  onOpenPrivacy,
}) => {
  useSEO('abyssal');
  const abyssalBook = BOOKS.find((b) => b.id === 'abyssal-current') || BOOKS[3];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#081b22] via-[#051318] to-[#020a0d] border border-teal-900/60 p-8 sm:p-14 shadow-2xl">
        {/* Subtle decorative bathymetric curves */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg viewBox="0 0 800 600" className="w-full h-full stroke-teal-400" fill="none">
            <path d="M0 100 C 200 80, 600 140, 800 100" strokeWidth="1" />
            <path d="M0 200 C 300 240, 500 160, 800 220" strokeWidth="1" />
            <path d="M0 300 C 250 360, 650 280, 800 340" strokeWidth="1" />
            <path d="M0 400 C 400 450, 450 380, 800 420" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="700" cy="150" r="80" strokeWidth="1" strokeDasharray="2,2" />
          </svg>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-2 text-xs text-teal-400 font-cinzel font-semibold uppercase tracking-wider">
              <Waves className="w-4 h-4" />
              <span>Upcoming Epic Fantasy Series</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-cinzel font-bold text-[#f0fdfa] tracking-tight leading-tight">
              The Abyssal Current
            </h1>

            <p className="text-lg sm:text-xl font-cormorant italic text-teal-200">
              "The ocean does not hide secrets because it is cruel; it hides them because eternity is too heavy for the sun."
            </p>

            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-2xl">
              Deep beneath the charted seas, time flows not forward, but down. Drawing from Matthew E. Messmer's years as a Navy Master-at-Arms and a lifelong fascination with maritime physics, naval lore, and oceanic isolation, <em>The Abyssal Current</em> marks the dawn of an exhilarating new fantasy epic.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onOpenExcerpt(abyssalBook)}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-teal-950 text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-lg shadow-teal-950/40 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Read Depth Mark 4,000 Fathoms Teaser</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <BookCoverArt book={abyssalBook} size="lg" />
          </div>
        </div>
      </div>

      {/* Naval Precision & Worldbuilding Roots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0a141b] border border-teal-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-700/40 flex items-center justify-center text-teal-400">
            <Anchor className="w-5 h-5" />
          </div>
          <h3 className="text-base font-cinzel font-bold text-[#f0fdfa]">
            Naval Watch & Steel Hulls
          </h3>
          <p className="text-xs text-teal-100/70 leading-relaxed">
            Rooted in the authentic operational reality of shipboard watchstanding, steam piping, bulkhead groans, and the psychological weight of isolation miles from dry land.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a141b] border border-teal-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-700/40 flex items-center justify-center text-teal-400">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-cinzel font-bold text-[#f0fdfa]">
            Temporal Bathymetry
          </h3>
          <p className="text-xs text-teal-100/70 leading-relaxed">
            In the Mariana Rift, depth is chronological. At 2,000 fathoms you cross the century of iron; at 4,000 fathoms, time solidifies into navigable oceanic currents.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a141b] border border-teal-900/40 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-950 border border-teal-700/40 flex items-center justify-center text-teal-400">
            <Compass className="w-5 h-5" />
          </div>
          <h3 className="text-base font-cinzel font-bold text-[#f0fdfa]">
            Physical Laser Engraved Charts
          </h3>
          <p className="text-xs text-teal-100/70 leading-relaxed">
            Every trench depth and magnetic declination is being personally prototyped and cut in layered birch wood in Matthew's Texas laser workshop.
          </p>
        </div>
      </div>

      {/* Teaser Narrative Sample */}
      <div className="p-8 sm:p-12 rounded-2xl bg-[#09151c] border border-teal-900/40 space-y-6 max-w-4xl mx-auto">
        <div className="text-center pb-4 border-b border-teal-900/30">
          <p className="text-xs uppercase font-cinzel tracking-widest text-teal-400 font-semibold mb-1">
            Opening Logs
          </p>
          <h3 className="text-2xl font-cinzel font-bold text-[#f0fdfa]">
            Depth Mark: 4,000 Fathoms
          </h3>
        </div>

        <div className="font-reading text-sm sm:text-base text-teal-50/90 leading-relaxed space-y-4">
          <p className="drop-cap-lead">
            The pressure gauges on the bulkhead ticked with mechanical certainty: 4,100 fathoms. 4,200 fathoms. Chief Engineer Miller wiped engine grease from his brow and listened to the rivets of the Leviathan groaning against the dark. There was no light out there, only the endless, icy squeeze of the Mariana Rift.
          </p>
          <p>
            Then the sound began. Not the scream of failing bronze, but a slow, rhythmic toll—like a bell struck five miles below the atmosphere.
          </p>
          <p className="font-serif italic text-teal-300 pl-4 border-l-2 border-teal-500">
            "Captain," Miller whispered into the voice pipe. "Whatever is down here... it's breathing in time with our boilers."
          </p>
        </div>
      </div>

      {/* SPECIAL THE ABYSSAL CURRENT NEWSLETTER CTA (Mandatory verbatim from prompt) */}
      {/*
        Heading: Want to Know What Comes Next?
        Text: The Abyssal Current is only beginning. Join the newsletter for future reveals, announcements, and updates as the series takes shape.
        Button: Follow the Current
      */}
      <div className="max-w-3xl mx-auto pt-4">
        <NewsletterSignup
          variant="abyssal_current"
          heading="Want to Know What Comes Next?"
          text="The Abyssal Current is only beginning. Join the newsletter for future reveals, announcements, and updates as the series takes shape."
          buttonText="Follow the Current"
          source="abyssal_current_page"
          onOpenPrivacy={onOpenPrivacy}
        />
      </div>
    </div>
  );
};
