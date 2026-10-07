import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { bookService } from '../services/bookService';

interface BookCoverArtProps {
  book: Book | any;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fill';
  className?: string;
  showHoverEffect?: boolean;
}

export const BookCoverArt: React.FC<BookCoverArtProps> = ({
  book,
  size = 'md',
  className = '',
  showHoverEffect = true,
}) => {
  const getAuthoritativeCover = (): string | null => {
    if (!book?.id) return (book as any)?.coverImage || null;
    const liveBook = bookService.getCachedBookById(book.id);
    return liveBook?.coverImage || (book as any)?.coverImage || null;
  };

  const [effectiveCover, setEffectiveCover] = useState<string | null>(getAuthoritativeCover);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const syncCover = () => {
      const cover = getAuthoritativeCover();
      setEffectiveCover(cover);
      setImgError(false);
    };
    syncCover();

    if (!book?.id) return;
    const unsubBook = bookService.subscribe(syncCover);
    return () => {
      unsubBook();
    };
  }, [book?.id, (book as any)?.coverImage]);

  useEffect(() => {
    setImgError(false);
  }, [effectiveCover]);

  // Determine if the caller requested filling the parent container
  const isFill = size === 'fill' || className.includes('w-full') || className.includes('h-full');

  // Default standard book cover aspect ratio is 2:3 (golden ratio for paperbacks & hardcovers)
  const defaultSizeClasses: Record<string, string> = {
    sm: 'w-28 aspect-[2/3]',
    md: 'w-44 sm:w-52 aspect-[2/3]',
    lg: 'w-60 sm:w-72 aspect-[2/3]',
    xl: 'w-72 sm:w-80 aspect-[2/3]',
    fill: 'w-full h-full',
  };

  const dimensionClasses = isFill ? 'w-full h-full' : (defaultSizeClasses[size] || defaultSizeClasses.md);

  // If a custom image was uploaded by the user or saved in storage
  if (effectiveCover && !imgError) {
    return (
      <div
        className={`relative ${dimensionClasses} rounded-md shadow-2xl overflow-hidden border border-[#2b2e40] bg-[#090b10] ${
          showHoverEffect ? 'transition-transform duration-300 hover:-translate-y-1.5' : ''
        } ${className}`}
      >
        <img
          key={effectiveCover || book?.id}
          src={effectiveCover}
          alt={(book as any)?.coverImageAlt || `Cover of ${book?.title || 'Book'} by Matthew E. Messmer`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center block"
          loading="lazy"
        />
        {/* Subtle book spine lighting effect */}
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/10 pointer-events-none" />
      </div>
    );
  }

  // Faithful visual render matching the author's real covers
  const renderFaithfulArt = () => {
    switch (book.id) {
      /* ----------------------------------------------------
       * BOOK 1: THE KING'S SEVERANCE
       * King in plate armor on stone watchtower, sword with purple fire,
       * twin streams of fiery orange and ice blue thread, solar eclipse
       * ---------------------------------------------------- */
      case 'kings-severance':
        return (
          <div className="relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-[#2a2420] via-[#1a171c] to-[#0c0d12] border border-[#c5a059]/40 shadow-2xl overflow-hidden">
            {/* Background Sky, Eclipse & Distant Tower */}
            <div className="absolute inset-0 pointer-events-none">
              <svg viewBox="0 0 300 450" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  {/* Sky gradient */}
                  <linearGradient id="ksSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3d373f" />
                    <stop offset="35%" stopColor="#4d382e" />
                    <stop offset="70%" stopColor="#2b1f1d" />
                    <stop offset="100%" stopColor="#141113" />
                  </linearGradient>

                  {/* Corona glow */}
                  <radialGradient id="ksCorona" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#080709" />
                    <stop offset="72%" stopColor="#0a080c" />
                    <stop offset="78%" stopColor="#ffd88a" />
                    <stop offset="88%" stopColor="#ff7b2b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                  </radialGradient>

                  {/* Fire stream */}
                  <linearGradient id="fireThread" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#b43aff" />
                    <stop offset="30%" stopColor="#ff851b" />
                    <stop offset="80%" stopColor="#ffcc00" />
                    <stop offset="100%" stopColor="#fffae6" />
                  </linearGradient>

                  {/* Ice thread */}
                  <linearGradient id="iceThread" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9b51e0" />
                    <stop offset="40%" stopColor="#4facfe" />
                    <stop offset="80%" stopColor="#00f2fe" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>

                <rect width="300" height="450" fill="url(#ksSky)" />

                {/* Craggy mountains */}
                <path d="M0 280 L60 250 L120 280 L180 230 L240 270 L300 240 L300 450 L0 450 Z" fill="#1b181e" opacity="0.7" />
                <path d="M0 320 L80 290 L160 330 L220 280 L300 310 L300 450 L0 450 Z" fill="#131116" />

                {/* Distant Spire on Cliff (right side) */}
                <path d="M260 250 L264 210 L266 210 L270 250 Z" fill="#0d0c0e" />
                <rect x="263" y="195" width="4" height="15" fill="#0d0c0e" />
                <path d="M255 250 L275 250 L285 300 L245 300 Z" fill="#0d0c0e" />

                {/* Solar Eclipse in sky */}
                <circle cx="225" cy="190" r="32" fill="url(#ksCorona)" />
                <circle cx="225" cy="190" r="23" fill="#0b0a0e" />
                <line x1="225" y1="213" x2="225" y2="245" stroke="#ffae42" strokeWidth="1.5" strokeOpacity="0.7" />

                {/* Tower in foreground (left) */}
                <path d="M0 240 L80 210 L85 450 L0 450 Z" fill="#2b2829" />
                {/* Tower stone battlements & crenellations */}
                <rect x="0" y="235" width="18" height="20" fill="#3c3738" stroke="#1f1c1d" />
                <rect x="24" y="230" width="18" height="20" fill="#3c3738" stroke="#1f1c1d" />
                <rect x="48" y="225" width="18" height="20" fill="#3c3738" stroke="#1f1c1d" />
                <rect x="70" y="220" width="15" height="20" fill="#3c3738" stroke="#1f1c1d" />
                {/* Tower stone texture horizontal bands */}
                <line x1="0" y1="270" x2="82" y2="270" stroke="#1a1819" strokeWidth="1" />
                <line x1="0" y1="300" x2="83" y2="300" stroke="#1a1819" strokeWidth="1" />
                <line x1="0" y1="340" x2="84" y2="340" stroke="#1a1819" strokeWidth="1" />
                <line x1="0" y1="390" x2="85" y2="390" stroke="#1a1819" strokeWidth="1" />

                {/* The King on tower */}
                {/* Legs */}
                <path d="M45 220 L40 185 L50 185 L52 220 Z" fill="#6d7278" />
                <path d="M54 220 L58 185 L68 185 L64 220 Z" fill="#585c61" />
                {/* Torso & Armor */}
                <path d="M38 185 L44 140 L66 140 L70 185 Z" fill="#8a9098" stroke="#484d52" />
                <path d="M48 185 L50 215 L58 215 L60 185 Z" fill="#8c2d19" /> {/* red tunic sash */}
                {/* Left Arm holding dark fire sword */}
                <path d="M40 145 L25 160 L32 175 Z" fill="#5b2c6f" />
                {/* Crown & Head */}
                <circle cx="55" cy="128" r="7" fill="#c49b66" />
                <path d="M50 123 L52 118 L55 121 L58 118 L60 123 Z" fill="#e6b800" />
                {/* Sword extending right */}
                <path d="M60 155 L125 140 L130 145 L62 160 Z" fill="#4a154b" />
                <path d="M60 155 L130 142" stroke="#a855f7" strokeWidth="2.5" />

                {/* Swirling Orange Fire Thread to the left of the eclipse */}
                <path
                  d="M125 142 Q 160 110 180 145 T 235 150"
                  fill="none"
                  stroke="url(#fireThread)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M120 140 Q 155 90 195 130 T 250 140"
                  fill="none"
                  stroke="#ff9900"
                  strokeWidth="2"
                  opacity="0.8"
                />

                {/* Swirling Ice Blue Energy Thread to the right */}
                <path
                  d="M125 142 Q 170 130 210 115 T 285 110"
                  fill="none"
                  stroke="url(#iceThread)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M130 145 Q 185 140 230 110 T 290 120"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  opacity="0.8"
                />
              </svg>
            </div>

            {/* TOP TITLE: THE KING'S SEVERANCE */}
            <div className="relative z-10 text-center pt-2">
              <h3 className="text-xl sm:text-2xl font-cinzel font-black tracking-wider leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                <span className="text-[#e2ab3b]">THE KING'S </span>
                <span className="text-[#d8d2cb] drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">
                  SEVERANCE
                </span>
              </h3>
            </div>

            {/* Empty space in middle to view art */}
            <div className="flex-1" />

            {/* BOTTOM: SUBTITLE & AUTHOR */}
            <div className="relative z-10 text-center pb-2 space-y-1 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-6">
              <p className="text-[10px] sm:text-xs font-serif text-[#e4b568] tracking-wide font-medium">
                Book One of The <span className="text-[#d4cdbf]">Breathwoven Cycle</span>
              </p>
              <p className="text-xs sm:text-sm font-cinzel font-semibold tracking-wider text-[#ffffff] drop-shadow-md">
                Matthew E. Messmer
              </p>
            </div>

            {/* Spine lighting */}
            <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
          </div>
        );

      /* ----------------------------------------------------
       * BOOK 2: THE BLUE MOON CHILD
       * Luminous crescent moon in dark gnarled forest, hooded figure
       * holding glowing blue baby, swirling celestial mist ribbons
       * ---------------------------------------------------- */
      case 'blue-moon-child':
        return (
          <div className="relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-[#091522] via-[#0b171c] to-[#04080f] border border-[#5c8df6]/40 shadow-2xl overflow-hidden">
            {/* Background Twisted Forest & Glowing Blue Moon */}
            <div className="absolute inset-0 pointer-events-none">
              <svg viewBox="0 0 300 450" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0b1b2b" />
                    <stop offset="40%" stopColor="#0e2330" />
                    <stop offset="80%" stopColor="#081419" />
                    <stop offset="100%" stopColor="#03080d" />
                  </linearGradient>

                  <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id="babyGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor="#67e8f9" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width="300" height="450" fill="url(#forestSky)" />

                {/* Glowing Blue Crescent Moon (High in sky) */}
                <circle cx="150" cy="140" r="75" fill="url(#moonGlow)" />
                {/* Crescent Moon Shape */}
                <path
                  d="M110 95 A 60 60 0 1 0 190 185 A 65 65 0 1 1 110 95 Z"
                  fill="#7dd3fc"
                  opacity="0.9"
                />
                <path
                  d="M115 100 A 55 55 0 1 0 185 180 A 60 60 0 1 1 115 100 Z"
                  fill="#bae6fd"
                />

                {/* Ancient Twisted Gnarled Trees on left & right */}
                {/* Left Tree Trunk & Roots */}
                <path
                  d="M0 50 Q 30 180 15 280 Q 40 340 0 450 L 50 450 Q 55 350 45 270 Q 60 160 30 50 Z"
                  fill="#10191c"
                />
                <path d="M25 150 Q 70 120 100 80" stroke="#10191c" strokeWidth="8" fill="none" />
                <path d="M20 220 Q 80 200 95 160" stroke="#0b1317" strokeWidth="6" fill="none" />

                {/* Right Tree Trunk & Roots */}
                <path
                  d="M300 50 Q 270 180 285 280 Q 260 340 300 450 L 250 450 Q 245 350 255 270 Q 240 160 270 50 Z"
                  fill="#10191c"
                />
                <path d="M275 150 Q 230 120 200 80" stroke="#10191c" strokeWidth="8" fill="none" />
                <path d="M280 220 Q 220 200 205 160" stroke="#0b1317" strokeWidth="6" fill="none" />

                {/* Central Forest Pathway */}
                <path d="M120 450 L 140 350 L 160 350 L 180 450 Z" fill="#0d1417" />

                {/* Hooded Mother / Guardian Figure in center */}
                <path d="M136 345 Q 150 290 150 260 Q 150 290 164 345 Z" fill="#1e293b" />
                {/* Hood */}
                <path d="M142 260 Q 150 245 158 260 Q 150 270 142 260 Z" fill="#0f172a" />
                {/* Face shadow */}
                <circle cx="150" cy="258" r="3" fill="#cbd5e1" opacity="0.6" />

                {/* Glowing Blue Swaddled Child */}
                <circle cx="152" cy="275" r="14" fill="url(#babyGlow)" />
                <ellipse cx="152" cy="275" rx="6" ry="8" fill="#e0f2fe" />

                {/* Swirling luminous white/cyan ribbons across forest */}
                <path
                  d="M152 275 Q 80 250 40 280 T 10 230"
                  stroke="#bae6fd"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.8"
                />
                <path
                  d="M152 275 Q 110 310 50 330 T 20 370"
                  stroke="#e0f2fe"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M152 275 Q 220 250 260 280 T 290 230"
                  stroke="#bae6fd"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.8"
                />
                <path
                  d="M152 275 Q 190 310 250 330 T 280 370"
                  stroke="#e0f2fe"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            </div>

            {/* TOP TITLE: The Blue Moon Child in Script */}
            <div className="relative z-10 text-center pt-2">
              <h3 className="text-2xl sm:text-3xl font-serif italic tracking-wide text-[#f0f9ff] drop-shadow-[0_2px_8px_rgba(56,189,248,0.8)] font-medium">
                The Blue Moon Child
              </h3>
            </div>

            <div className="flex-1" />

            {/* BOTTOM: SUBTITLE & AUTHOR */}
            <div className="relative z-10 text-center pb-2 space-y-1 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-6">
              <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[#e4b568] to-transparent mx-auto mb-1" />
              <p className="text-[10px] sm:text-xs font-serif text-[#e4b568] tracking-wide font-medium">
                Book Two of The <span className="text-[#ffffff]">Breathwoven Cycle</span>
              </p>
              <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[#e4b568] to-transparent mx-auto mt-1 mb-2" />
              <p className="text-xs sm:text-sm font-cinzel font-semibold tracking-wider text-[#f8fafc] drop-shadow-md">
                Matthew E. Messmer
              </p>
            </div>

            <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
          </div>
        );

      /* ----------------------------------------------------
       * BOOK 3: THE WEAVER'S LULLABY - THE GREAT MENDING
       * Silver frame with vines, monumental emerald glowing World Tree,
       * Weaver silhouette extending luminous threads, burning book & staff
       * ---------------------------------------------------- */
      case 'weavers-lullaby':
        return (
          <div className="relative w-full h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#14281e] via-[#0d1c14] to-[#060e0a] border border-emerald-500/50 shadow-2xl overflow-hidden">
            {/* Background Great World Tree with Emerald Glow & Ruins */}
            <div className="absolute inset-0 pointer-events-none">
              <svg viewBox="0 0 300 450" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="treeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#22c55e" stopOpacity="0.6" />
                    <stop offset="80%" stopColor="#15803d" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#052e16" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Dark night sky */}
                <rect width="300" height="450" fill="#09130d" />

                {/* Massive emerald canopy aura */}
                <circle cx="150" cy="220" r="130" fill="url(#treeGlow)" />

                {/* Great World Tree Trunk & Canopy branches */}
                <path
                  d="M130 360 C 135 290, 110 240, 150 180 C 190 240, 165 290, 170 360 Z"
                  fill="#062d16"
                />
                {/* Emerald glowing veins in trunk */}
                <path d="M145 360 Q 148 290 148 240" stroke="#86efac" strokeWidth="3" fill="none" />
                <path d="M155 360 Q 152 290 152 240" stroke="#4ade80" strokeWidth="2" fill="none" />

                {/* Spreading Tree Foliage */}
                <circle cx="90" cy="180" r="45" fill="#0f391e" opacity="0.9" />
                <circle cx="210" cy="180" r="45" fill="#0f391e" opacity="0.9" />
                <circle cx="150" cy="140" r="55" fill="#14532d" opacity="0.95" />
                <circle cx="150" cy="160" r="40" fill="#22c55e" opacity="0.4" />

                {/* The Weaver Silhouette inside the glowing heart of the tree */}
                <path
                  d="M148 215 C 144 220, 142 240, 140 260 L 160 260 C 158 240, 156 220, 152 215 Z"
                  fill="#032512"
                />
                <circle cx="150" cy="210" r="5" fill="#032512" />

                {/* Outstretched arms holding radiant silver threads */}
                <line x1="148" y1="220" x2="132" y2="225" stroke="#032512" strokeWidth="2.5" />
                <line x1="152" y1="220" x2="168" y2="225" stroke="#032512" strokeWidth="2.5" />

                {/* Luminous Silver/White Threads radiating across tree canopy */}
                <path
                  d="M132 225 C 100 200, 70 170, 30 160"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="3,2"
                  fill="none"
                />
                <path
                  d="M132 225 C 90 220, 50 200, 20 220"
                  stroke="#bbf7d0"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M168 225 C 200 200, 230 170, 270 160"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="3,2"
                  fill="none"
                />
                <path
                  d="M168 225 C 210 220, 250 200, 280 220"
                  stroke="#bbf7d0"
                  strokeWidth="1.5"
                  fill="none"
                />

                {/* Stone Terrace Steps & Roots in foreground */}
                <rect x="20" y="380" width="260" height="20" fill="#1b2820" />
                <rect x="40" y="400" width="220" height="20" fill="#152019" />
                <rect x="60" y="420" width="180" height="30" fill="#0f1611" />

                {/* Burning open book / grimoire on left */}
                <path d="M25 365 L 50 355 L 75 365 L 50 375 Z" fill="#e2d5c3" />
                <path d="M35 350 Q 50 325 45 360" stroke="#f59e0b" strokeWidth="4" fill="none" />
                <circle cx="45" cy="340" r="10" fill="#f59e0b" opacity="0.6" />

                {/* Serpentine silver staff on right */}
                <line x1="200" y1="390" x2="260" y2="340" stroke="#94a3b8" strokeWidth="3" />
                <path d="M205 385 Q 220 375 235 360 Q 250 350 260 340" stroke="#e2e8f0" strokeWidth="2" fill="none" />
              </svg>
            </div>

            {/* SILVER ORNATE FRAME OVERLAY */}
            <div className="absolute inset-2 border-2 border-[#94a3b8]/70 pointer-events-none rounded-sm">
              <div className="absolute -top-1 left-2 text-[9px] text-emerald-400">✤</div>
              <div className="absolute -top-1 right-2 text-[9px] text-emerald-400">✤</div>
              <div className="absolute -bottom-1 left-2 text-[9px] text-emerald-400">✤</div>
              <div className="absolute -bottom-1 right-2 text-[9px] text-emerald-400">✤</div>
            </div>

            {/* TOP HEADER: BOOK 3 OF THE BREATHWOVEN CYCLE */}
            <div className="relative z-10 text-center pt-2">
              <p className="text-[9px] sm:text-[10px] uppercase font-sans tracking-[0.2em] text-[#d1fae5] font-semibold">
                BOOK 3 OF THE BREATHWOVEN CYCLE
              </p>
              <h3 className="text-xl sm:text-2xl font-cinzel font-black tracking-wider text-[#e6f4ea] mt-1 drop-shadow-[0_2px_8px_rgba(34,197,94,0.7)] leading-tight">
                THE WEAVER'S
                <span className="block text-2xl sm:text-3xl text-[#ffffff] font-extrabold tracking-widest">
                  LULLABY
                </span>
              </h3>
              <p className="text-[10px] sm:text-xs font-cinzel tracking-[0.25em] text-[#86efac] font-bold mt-0.5">
                THE GREAT MENDING
              </p>
            </div>

            <div className="flex-1" />

            {/* BOTTOM: AUTHOR */}
            <div className="relative z-10 text-center pb-2 pt-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
              <p className="text-xs sm:text-sm font-cinzel font-bold tracking-[0.18em] text-[#ffffff] drop-shadow-md">
                MATTHEW E. MESSMER
              </p>
            </div>

            <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
          </div>
        );

      /* ----------------------------------------------------
       * THE ABYSSAL CURRENT (Upcoming)
       * ---------------------------------------------------- */
      case 'abyssal-current':
      default:
        return (
          <div className="relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-[#06181d] via-[#041014] to-[#02090b] border border-[#14b8a6]/40 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-25 pointer-events-none">
              <svg viewBox="0 0 200 300" className="w-full h-full stroke-[#14b8a6]" fill="none" strokeWidth="1">
                <path d="M10 80 C 60 70, 140 100, 190 80" />
                <path d="M10 120 C 50 140, 150 110, 190 130" />
                <path d="M10 160 C 80 150, 120 180, 190 160" />
                <path d="M10 200 C 60 220, 140 190, 190 210" />
                <circle cx="100" cy="140" r="50" strokeDasharray="3,3" />
              </svg>
            </div>

            <div className="text-center pt-2 relative z-10">
              <p className="text-[10px] tracking-[0.25em] uppercase font-sans text-[#2dd4bf] font-semibold">
                Matthew E. Messmer
              </p>
              <div className="w-12 h-[1px] bg-[#14b8a6]/60 mx-auto mt-1" />
            </div>

            <div className="my-auto text-center relative z-10 py-4">
              <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#14b8a6]" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="50" cy="50" r="35" />
                  <path d="M50 15 L55 45 L85 50 L55 55 L50 85 L45 55 L15 50 L45 45 Z" fill="rgba(20, 184, 166, 0.25)" />
                </svg>
              </div>

              <h3 className="text-lg sm:text-xl font-cinzel font-bold text-[#f0fdfa] tracking-tight leading-tight">
                The Abyssal
                <span className="block text-[#2dd4bf] font-extrabold tracking-wider">
                  Current
                </span>
              </h3>
            </div>

            <div className="text-center pb-2 relative z-10 border-t border-[#14b8a6]/30 pt-2">
              <p className="text-[9px] uppercase tracking-[0.2em] font-sans text-[#99f6e4]">
                Book I · The Abyssal Current
              </p>
            </div>

            <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
          </div>
        );
    }
  };

  return (
    <div
      className={`relative ${dimensionClasses} rounded-md shadow-2xl overflow-hidden border border-[#2b2e40] bg-[#090b10] ${
        showHoverEffect ? 'transition-transform duration-300 hover:-translate-y-1.5' : ''
      } ${className}`}
    >
      {renderFaithfulArt()}
      {/* Subtle book spine lighting & book depth effect */}
      <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 rounded-md ring-1 ring-inset ring-white/10 pointer-events-none" />
    </div>
  );
};
