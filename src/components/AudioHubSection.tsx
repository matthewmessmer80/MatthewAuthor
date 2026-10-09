import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  ExternalLink,
  Play,
  Pause,
  Heart,
  Disc,
  Volume2,
  Sparkles,
  FileText,
  X,
  VolumeX,
  BookOpen,
  Info,
  Layers,
} from 'lucide-react';
import { Song, SongExternalLink } from '../types';
import { songService } from '../services/songService';

export type { Song };

interface AudioHubSectionProps {
  className?: string;
  isStandalonePage?: boolean;
}

export default function AudioHubSection({ className = '', isStandalonePage = false }: AudioHubSectionProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [activeDetailSong, setActiveDetailSong] = useState<Song | null>(null);
  const [activeTabInModal, setActiveTabInModal] = useState<'all' | 'story' | 'lyrics'>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial cached songs
    const initial = songService.getCachedSongs();
    setSongs(initial);

    // Live subscription to authoritative database
    const unsubscribe = songService.subscribe((list) => {
      setSongs(list);
    });

    return () => {
      unsubscribe();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Filter songs for public display: only Published and isPublic !== false
  const publicSongs = songs.filter(
    (s) => s.status === 'Published' && s.isPublic !== false
  );

  const togglePlay = (song: Song) => {
    if (playingSongId === song.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (song.audioUrl) {
        const audio = new Audio(song.audioUrl);
        audioRef.current = audio;
        audio.play().catch((e) => console.warn('Audio playback error:', e));
        audio.onended = () => setPlayingSongId(null);
      }
      setPlayingSongId(song.id);
    }
  };

  return (
    <section id="audio-hub" className={`py-16 px-4 max-w-6xl mx-auto ${className}`}>
      {/* Section Header */}
      <div className="text-center mb-12 space-y-3">
        <div className="inline-flex items-center justify-center p-2.5 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-full text-[#c5a059] mb-1 shadow-inner">
          <Music className="w-5 h-5" />
        </div>
        <div className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          Original Music & Companion Audio
        </div>
        <h2 className="text-3xl sm:text-4xl font-cinzel font-bold tracking-tight text-[#f5efeb]">
          Audio & Soundtrack Vault
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#9e978a] max-w-2xl mx-auto font-cormorant text-lg italic leading-relaxed">
          Explore original songs, character themes, and companion tracks written alongside my books.
        </p>
      </div>

      {/* Song Cards Grid */}
      {publicSongs.length === 0 ? (
        <div className="p-12 text-center bg-[#11131c] border border-[#232635] rounded-2xl max-w-md mx-auto space-y-3">
          <Disc className="w-10 h-10 text-[#6d685c] mx-auto opacity-50" />
          <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">Vault Vaults Preparing</h3>
          <p className="text-xs text-[#8e887a] leading-relaxed">
            Companion soundtracks and acoustic recordings are being cataloged. Check back soon for new releases.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {publicSongs.map((song) => {
            const isPlaying = playingSongId === song.id;
            const hasDirectAudio = !!song.audioUrl;
            const hasLyrics = !!song.lyrics?.trim();
            const dedicationNote = song.dedication || song.releaseNote;

            // Separate independent fields: never combined
            const trackDesc = (song.trackDescription && song.trackDescription.trim()) || (!song.trackDescription && song.description && song.description.trim()) || '';
            const storyText = (song.storyBehindTrack && song.storyBehindTrack.trim()) || '';

            // Consolidate external links
            const links: SongExternalLink[] = song.externalLinks ? [...song.externalLinks] : [];
            if (song.youtubeUrl && !links.some((l) => l.platform === 'YouTube')) {
              links.push({ platform: 'YouTube', url: song.youtubeUrl });
            }
            if (song.spotifyUrl && !links.some((l) => l.platform === 'Spotify')) {
              links.push({ platform: 'Spotify', url: song.spotifyUrl });
            }
            if (song.soundcloudUrl && !links.some((l) => l.platform === 'SoundCloud')) {
              links.push({ platform: 'SoundCloud', url: song.soundcloudUrl });
            }
            if (song.bandcampUrl && !links.some((l) => l.platform === 'Bandcamp')) {
              links.push({ platform: 'Bandcamp', url: song.bandcampUrl });
            }

            return (
              <div
                key={song.id}
                className="bg-[#11131c] rounded-2xl shadow-lg border border-[#232635] hover:border-[#c5a059]/40 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-[#c5a059]/5 group"
              >
                <div className="p-6 sm:p-7 space-y-4">
                  {/* Header Badge & Action */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-3 py-1 rounded-full">
                      {song.category || 'Soundtrack Companion'}
                    </span>

                    {(dedicationNote || song.category?.toLowerCase().includes('dedication')) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-cinzel text-rose-300 bg-rose-950/40 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400/30" />
                        <span>Sister Dawn Tribute</span>
                      </span>
                    )}
                  </div>

                  {/* Song Title & Cover thumbnail */}
                  <div className="flex items-start gap-4">
                    {song.coverImage && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#0a0b10] border border-[#2b2e40] overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <img
                          src={song.coverImage}
                          alt={song.title}
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors flex items-center gap-2">
                        {!song.coverImage && (
                          <Disc className="w-5 h-5 text-[#c5a059] shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                        )}
                        <span className="truncate">{song.title}</span>
                      </h3>
                      <div className="text-xs text-[#8e887a] mt-0.5">
                        By {song.artist || 'Matthew E. Messmer'}
                        {song.releaseDate && ` · Released ${song.releaseDate}`}
                      </div>
                    </div>
                  </div>

                  {/* Series and Book Association Badge */}
                  {(song.seriesName || song.seriesId) && (
                    <div className="flex items-center gap-1.5 text-[10px] font-cinzel text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-md px-2.5 py-1 w-fit">
                      <Layers className="w-3 h-3 text-[#c5a059] shrink-0" />
                      <span>
                        Series: {song.seriesName || 'Associated Series'}
                        {song.bookTitle ? ` · ${song.bookTitle}` : ''}
                      </span>
                    </div>
                  )}

                  {/* 1. Track Description (Displayed independently only when content exists) */}
                  {trackDesc && (
                    <div className="space-y-1 pt-1">
                      <h4 className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                        <Disc className="w-3 h-3 text-[#c5a059]" />
                        <span>Track Description</span>
                      </h4>
                      <p className="text-[#a8a295] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {trackDesc}
                      </p>
                    </div>
                  )}

                  {/* 2. Story Behind the Track (Displayed independently only when content exists) */}
                  {storyText && (
                    <div className="p-3.5 bg-[#0a0b10] border border-[#1f2231] rounded-xl space-y-1.5">
                      <h4 className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>Story Behind the Track</span>
                      </h4>
                      <div className="text-[#dcd7cb] font-cormorant text-sm sm:text-base italic leading-relaxed whitespace-pre-wrap">
                        {storyText}
                      </div>
                    </div>
                  )}

                  {/* Dedication / Special Note */}
                  {dedicationNote && (
                    <div className="p-3 bg-[#0a0b10] border border-[#1f2231] rounded-xl text-xs text-[#8e887b] italic font-cormorant text-sm leading-relaxed flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
                      <span>"{dedicationNote}"</span>
                    </div>
                  )}

                  {/* Series & Book Associations or Tags */}
                  {song.tags && song.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {song.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-[#141624] text-[#8e887a] border border-[#232635]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Play & Preview Controls */}
                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => togglePlay(song)}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-[#c5a059] text-[#0c0d12] shadow-md shadow-[#c5a059]/20'
                          : 'bg-[#181b28] hover:bg-[#c5a059] text-[#e5dfd5] hover:text-[#0c0d12] border border-[#2c3044] hover:border-[#c5a059]'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause Preview</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span>{hasDirectAudio ? 'Play Audio' : 'Audio Preview'}</span>
                        </>
                      )}
                    </button>

                    {(storyText || trackDesc || hasLyrics) && (
                      <button
                        onClick={() => {
                          setActiveDetailSong(song);
                          setActiveTabInModal(storyText ? 'story' : hasLyrics ? 'lyrics' : 'all');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cinzel text-[#d4cfc2] hover:text-[#0c0d12] bg-[#12141f] hover:bg-[#c5a059] border border-[#232635] hover:border-[#c5a059] transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Story & Details</span>
                      </button>
                    )}

                    {hasLyrics && (
                      <button
                        onClick={() => {
                          setActiveDetailSong(song);
                          setActiveTabInModal('lyrics');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-cinzel text-[#b5af9f] hover:text-[#f5efeb] bg-[#12141f] hover:bg-[#1c1f2e] border border-[#232635] transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
                        <span>View Lyrics</span>
                      </button>
                    )}
                  </div>

                  {/* Audio preview simulator or player banner if active */}
                  {isPlaying && (
                    <div className="p-3 bg-[#171a27] border border-[#c5a059]/40 rounded-xl flex items-center gap-3 animate-in fade-in">
                      <Volume2 className="w-4 h-4 text-[#c5a059] animate-pulse" />
                      <div className="flex-1 text-xs text-[#e8e2d9]">
                        <div className="font-mono text-[11px] text-[#c5a059]">
                          {hasDirectAudio ? 'Playing Audio Track' : 'Streaming Preview Simulator'}
                        </div>
                        <div className="w-full bg-[#0a0b10] h-1.5 rounded-full overflow-hidden mt-1">
                          <div className="bg-[#c5a059] h-full w-2/3 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom listen on platforms */}
                {links.length > 0 && (
                  <div className="px-6 py-4 bg-[#0a0b10] border-t border-[#1e202d] flex flex-wrap items-center justify-between gap-3 mt-auto">
                    <span className="text-xs text-[#8e887b] font-cinzel uppercase tracking-wider font-semibold">
                      Listen on:
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {links.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-cinzel font-medium text-[#d4cfc2] hover:text-[#0c0d12] bg-[#161824] hover:bg-[#c5a059] border border-[#2b2e40] hover:border-[#c5a059] px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          <span>{link.platform}</span>
                          <ExternalLink className="w-3 h-3 text-[#8e887b] group-hover:text-inherit" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Story & Song Details Modal */}
      {activeDetailSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#212334] pb-4">
              <div className="flex items-center gap-4">
                {activeDetailSong.coverImage && (
                  <div className="w-16 h-16 rounded-xl bg-[#0a0b10] border border-[#2b2e40] overflow-hidden shrink-0 shadow">
                    <img
                      src={activeDetailSong.coverImage}
                      alt={activeDetailSong.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded">
                    {activeDetailSong.category || 'Soundtrack Companion'}
                  </span>
                  <h3 className="font-cinzel font-bold text-xl sm:text-2xl text-[#f5efeb] mt-1">
                    {activeDetailSong.title}
                  </h3>
                  <div className="text-xs text-[#8e887a] mt-0.5">
                    By {activeDetailSong.artist || 'Matthew E. Messmer'}
                    {activeDetailSong.releaseDate && ` · ${activeDetailSong.releaseDate}`}
                  </div>
                  {(activeDetailSong.seriesName || activeDetailSong.seriesId) && (
                    <div className="flex items-center gap-1.5 text-[10px] font-cinzel text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-md px-2 py-0.5 w-fit mt-1.5">
                      <Layers className="w-3 h-3 text-[#c5a059] shrink-0" />
                      <span>
                        Series: {activeDetailSong.seriesName || 'Associated Series'}
                        {activeDetailSong.bookTitle ? ` · ${activeDetailSong.bookTitle}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailSong(null)}
                className="text-[#7d776a] hover:text-[#f5efeb] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dedication Banner if present */}
            {activeDetailSong.dedication && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-200/90 font-cormorant italic flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                <span>"{activeDetailSong.dedication}"</span>
              </div>
            )}

            {/* Modal Tab Controls */}
            <div className="flex items-center gap-2 border-b border-[#1f2231] pb-2 text-xs font-cinzel">
              <button
                onClick={() => setActiveTabInModal('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTabInModal === 'all'
                    ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                    : 'text-[#8e887a] hover:text-[#f5efeb]'
                }`}
              >
                Overview
              </button>
              {activeDetailSong.storyBehindTrack && (
                <button
                  onClick={() => setActiveTabInModal('story')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTabInModal === 'story'
                      ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                      : 'text-[#8e887a] hover:text-[#f5efeb]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Story Behind the Track</span>
                </button>
              )}
              {activeDetailSong.lyrics && (
                <button
                  onClick={() => setActiveTabInModal('lyrics')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTabInModal === 'lyrics'
                      ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                      : 'text-[#8e887a] hover:text-[#f5efeb]'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Lyrics</span>
                </button>
              )}
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-6">
              {/* 1. Track Description (Shown in 'all' view if populated) */}
              {(activeTabInModal === 'all') &&
                (activeDetailSong.trackDescription || activeDetailSong.description) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                      <Disc className="w-4 h-4" />
                      <span>Track Description</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-[#a8a295] leading-relaxed whitespace-pre-wrap font-sans bg-[#0a0b10] p-4 rounded-xl border border-[#1f2231]">
                      {activeDetailSong.trackDescription || activeDetailSong.description}
                    </p>
                  </div>
                )}

              {/* 2. Story Behind the Track (Shown in 'all' or 'story' view if populated) */}
              {(activeTabInModal === 'all' || activeTabInModal === 'story') &&
                activeDetailSong.storyBehindTrack && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Story Behind the Track</span>
                    </h4>
                    <div className="p-5 bg-[#0a0b10] border border-[#1f2231] rounded-xl font-cormorant text-base sm:text-lg text-[#f5efeb] leading-relaxed whitespace-pre-wrap italic">
                      {activeDetailSong.storyBehindTrack}
                    </div>
                  </div>
                )}

              {/* 3. Lyrics (Shown in 'all' or 'lyrics' view if populated) */}
              {(activeTabInModal === 'all' || activeTabInModal === 'lyrics') &&
                activeDetailSong.lyrics && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Song Lyrics</span>
                    </h4>
                    <div className="p-5 bg-[#0a0b10] border border-[#1f2231] rounded-xl font-mono text-xs sm:text-sm text-[#e8e2d8] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                      {activeDetailSong.lyrics}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#1f2231] pt-4">
              <button
                type="button"
                onClick={() => togglePlay(activeDetailSong)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#c5a059] text-xs font-cinzel font-semibold text-[#f5efeb] hover:text-[#0c0d12] rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                {playingSongId === activeDetailSong.id ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Audio Track</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailSong(null)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Companion Vault Context Footer */}
      <div className="mt-12 p-6 rounded-2xl bg-[#0e1017] border border-[#1f2231] text-center max-w-3xl mx-auto space-y-2">
        <p className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
          Soundtracks For Stories Woven Through Time
        </p>
        <p className="text-xs text-[#8e887b] leading-relaxed">
          Music and narrative have always been twin crafts in Matthew E. Messmer&apos;s creative world.
          From heartfelt acoustic tributes like <em>Some Family Finds You</em> to thematic companion tracks,
          soundscapes add another dimension to the tapestry of family, memory, and resilience.
        </p>
      </div>
    </section>
  );
}

export { AudioHubSection };
