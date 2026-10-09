import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  ExternalLink,
  Play,
  Pause,
  Disc,
  Sparkles,
  Volume2,
  BookOpen,
  Radio,
  FileText,
  X,
  Heart,
} from 'lucide-react';
import { Song, SongExternalLink } from '../types';
import { songService } from '../services/songService';

interface CompanionSongsSectionProps {
  seriesId?: string;
  seriesSlug?: string;
  seriesName?: string;
  bookId?: string;
  bookTitle?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const CompanionSongsSection: React.FC<CompanionSongsSectionProps> = ({
  seriesId,
  seriesSlug,
  seriesName,
  bookId,
  bookTitle,
  title,
  subtitle,
  className = '',
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [activeModalSong, setActiveModalSong] = useState<Song | null>(null);
  const [modalTab, setModalTab] = useState<'all' | 'story' | 'lyrics'>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadSongs = () => {
    let matches: Song[] = [];
    if (bookId) {
      matches = songService.getSongsForBook(bookId);
    } else if (seriesId || seriesSlug || seriesName) {
      if (seriesId) {
        matches = songService.getSongsForSeries(seriesId);
      }
      if (matches.length === 0 && seriesSlug) {
        matches = songService.getSongsForSeries(seriesSlug);
      }
      if (matches.length === 0 && seriesName) {
        matches = songService.getSongsForSeries(seriesName);
      }
    }
    setSongs(matches);
  };

  useEffect(() => {
    loadSongs();
    const unsub = songService.subscribe(loadSongs);
    return () => {
      unsub();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [seriesId, seriesSlug, seriesName, bookId]);

  // If no songs are associated with this series or book, do not clutter the page
  if (songs.length === 0) {
    return null;
  }

  const togglePlayAudio = (song: Song) => {
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
        audio.play().catch((err) => console.warn('Audio preview error:', err));
        audio.onended = () => setPlayingSongId(null);
        setPlayingSongId(song.id);
      }
    }
  };

  // Resolve best external URL for primary Listen button
  const getPrimaryListenUrl = (song: Song): { url: string; platform: string } | null => {
    if (song.youtubeUrl) return { url: song.youtubeUrl, platform: 'YouTube' };
    if (song.spotifyUrl) return { url: song.spotifyUrl, platform: 'Spotify' };
    if (song.sunoUrl) return { url: song.sunoUrl, platform: 'Suno' };
    if (song.soundcloudUrl) return { url: song.soundcloudUrl, platform: 'SoundCloud' };
    if (song.bandcampUrl) return { url: song.bandcampUrl, platform: 'Bandcamp' };

    if (song.externalLinks && song.externalLinks.length > 0) {
      const first = song.externalLinks[0];
      return { url: first.url, platform: first.platform || 'Streaming' };
    }

    return null;
  };

  const defaultSectionTitle = bookId
    ? `Soundtrack & Companion Music for ${bookTitle || 'This Book'}`
    : `Soundtrack & Companion Music for ${seriesName || 'This Series'}`;

  const defaultSectionSubtitle = bookId
    ? 'Original songs, acoustic recordings, and melodic character themes written specifically for this edition.'
    : 'Original acoustic recordings, theme songs, and atmospheric companion tracks composed for this universe.';

  return (
    <section
      aria-label="Companion Music Section"
      className={`space-y-6 animate-in fade-in duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#232635] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c5a059]" />
            <span className="text-xs font-cinzel uppercase tracking-widest text-[#c5a059] font-bold">
              Literary Soundscapes
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel font-bold text-[#f5efeb] mt-1">
            {title || defaultSectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#8e887a] mt-1 max-w-2xl font-serif leading-relaxed">
            {subtitle || defaultSectionSubtitle}
          </p>
        </div>

        <div className="text-xs font-cinzel text-[#8e887a] shrink-0 self-start sm:self-auto flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-[#c5a059]" />
          <span>{songs.length} Companion {songs.length === 1 ? 'Track' : 'Tracks'}</span>
        </div>
      </div>

      {/* Grid of Companion Songs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {songs.map((song) => {
          const isPlaying = playingSongId === song.id;
          const primaryListen = getPrimaryListenUrl(song);

          // Build consolidated list of platform links
          const links: SongExternalLink[] = song.externalLinks ? [...song.externalLinks] : [];
          if (song.youtubeUrl && !links.some((l) => l.platform === 'YouTube')) {
            links.push({ platform: 'YouTube', url: song.youtubeUrl });
          }
          if (song.spotifyUrl && !links.some((l) => l.platform === 'Spotify')) {
            links.push({ platform: 'Spotify', url: song.spotifyUrl });
          }
          if (song.sunoUrl && !links.some((l) => l.platform === 'Suno')) {
            links.push({ platform: 'Suno', url: song.sunoUrl });
          }
          if (song.soundcloudUrl && !links.some((l) => l.platform === 'SoundCloud')) {
            links.push({ platform: 'SoundCloud', url: song.soundcloudUrl });
          }
          if (song.bandcampUrl && !links.some((l) => l.platform === 'Bandcamp')) {
            links.push({ platform: 'Bandcamp', url: song.bandcampUrl });
          }

          // Distinct independent text fields
          const trackDesc =
            (song.trackDescription && song.trackDescription.trim()) ||
            (!song.trackDescription && song.description && song.description.trim()) ||
            '';
          const storyText = (song.storyBehindTrack && song.storyBehindTrack.trim()) || '';

          return (
            <div
              key={song.id}
              className="bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-200 group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Header Category and Book Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-cinzel font-bold uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2.5 py-0.5 rounded-full">
                    {song.category || 'Soundtrack Companion'}
                  </span>

                  {song.bookTitle && !bookId && (
                    <span className="text-[10px] font-cinzel text-sky-300 bg-sky-950/40 border border-sky-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5" />
                      <span>Companion to: {song.bookTitle}</span>
                    </span>
                  )}
                </div>

                {/* Song Title, Artist & Cover */}
                <div className="flex items-start gap-4">
                  {song.coverImage ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#0a0b10] border border-[#2b2e40] overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#0e1018] border border-[#232635] flex items-center justify-center shrink-0 text-[#c5a059]">
                      <Disc className="w-8 h-8 opacity-60" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-cinzel font-bold text-[#f5efeb] group-hover:text-[#c5a059] transition-colors truncate">
                      {song.title}
                    </h3>
                    <div className="text-xs text-[#8e887a] mt-0.5">
                      By {song.artist || 'Matthew E. Messmer'}
                      {song.releaseDate && ` · Released ${song.releaseDate}`}
                    </div>
                  </div>
                </div>

                {/* 1. Track Description (Displayed only when it contains content) */}
                {trackDesc && (
                  <div className="space-y-1 pt-1">
                    <h4 className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                      <Disc className="w-3 h-3 text-[#c5a059]" />
                      <span>Track Description</span>
                    </h4>
                    <p className="text-xs text-[#a8a295] leading-relaxed whitespace-pre-wrap font-sans">
                      {trackDesc}
                    </p>
                  </div>
                )}

                {/* 2. Story Behind the Track (Displayed separately when it has content) */}
                {storyText && (
                  <div className="p-3.5 bg-[#0a0b10] border border-[#1f2231] rounded-xl space-y-1.5">
                    <h4 className="text-[11px] font-cinzel font-semibold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#c5a059]" />
                      <span>Story Behind the Track</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-[#dcd7cb] font-cormorant italic leading-relaxed whitespace-pre-wrap">
                      {storyText}
                    </p>
                  </div>
                )}

                {/* Dedication Note if present */}
                {song.dedication && (
                  <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-lg text-xs text-rose-200/90 font-cormorant italic flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>"{song.dedication}"</span>
                  </div>
                )}

                {/* Live Audio Player Bar when actively playing */}
                {isPlaying && (
                  <div className="p-3 bg-[#171a27] border border-[#c5a059]/40 rounded-xl flex items-center gap-3 animate-in fade-in">
                    <Volume2 className="w-4 h-4 text-[#c5a059] animate-pulse" />
                    <div className="flex-1 text-xs text-[#e8e2d9]">
                      <div className="font-mono text-[11px] text-[#c5a059]">
                        Playing Preview Track
                      </div>
                      <div className="w-full bg-[#0a0b10] h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-[#c5a059] h-full w-2/3 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons & External Listen Controls */}
              <div className="pt-4 border-t border-[#1f2231] mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Working Listen Button opening external platform (YouTube, Suno, Spotify, etc.) */}
                  {primaryListen && (
                    <a
                      href={primaryListen.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-all shadow-md shadow-[#c5a059]/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Listen on {primaryListen.platform}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}

                  {/* Direct In-Browser Play Audio button if audioUrl exists */}
                  {song.audioUrl && (
                    <button
                      onClick={() => togglePlayAudio(song)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-cinzel font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isPlaying
                          ? 'bg-[#181b28] text-[#c5a059] border border-[#c5a059]'
                          : 'bg-[#161824] hover:bg-[#202334] text-[#d4cfc2] hover:text-[#f5efeb] border border-[#2b2e40]'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Preview Audio</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Story & Details Modal Trigger */}
                  {(storyText || song.lyrics) && (
                    <button
                      onClick={() => {
                        setActiveModalSong(song);
                        setModalTab(storyText ? 'story' : 'lyrics');
                      }}
                      className="px-3 py-2 bg-[#141622] hover:bg-[#1d2030] text-[#8e887a] hover:text-[#f5efeb] border border-[#232635] text-xs font-cinzel rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#c5a059]" />
                      <span>Read Story</span>
                    </button>
                  )}
                </div>

                {/* Additional Streaming Platform Links */}
                {links.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-cinzel uppercase tracking-wider text-[#736e62] mr-1">
                      Available on:
                    </span>
                    {links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0d0e16] hover:bg-[#181a28] border border-[#232635] hover:border-[#c5a059]/40 text-[#a39e90] hover:text-[#f5efeb] text-[11px] font-cinzel rounded transition-colors"
                      >
                        <span>{link.platform}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Story & Details Modal */}
      {activeModalSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-[#212334] pb-4">
              <div className="flex items-center gap-4">
                {activeModalSong.coverImage && (
                  <div className="w-16 h-16 rounded-xl bg-[#0a0b10] border border-[#2b2e40] overflow-hidden shrink-0 shadow">
                    <img
                      src={activeModalSong.coverImage}
                      alt={activeModalSong.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <span className="text-[11px] font-cinzel uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded">
                    {activeModalSong.category || 'Soundtrack Companion'}
                  </span>
                  <h3 className="font-cinzel font-bold text-xl sm:text-2xl text-[#f5efeb] mt-1">
                    {activeModalSong.title}
                  </h3>
                  <div className="text-xs text-[#8e887a] mt-0.5">
                    By {activeModalSong.artist || 'Matthew E. Messmer'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalSong(null)}
                className="text-[#7d776a] hover:text-[#f5efeb] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-[#1f2231] pb-2 text-xs font-cinzel">
              <button
                onClick={() => setModalTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  modalTab === 'all'
                    ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                    : 'text-[#8e887a] hover:text-[#f5efeb]'
                }`}
              >
                Overview
              </button>
              {activeModalSong.storyBehindTrack && (
                <button
                  onClick={() => setModalTab('story')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'story'
                      ? 'bg-[#c5a059] text-[#0c0d12] font-bold'
                      : 'text-[#8e887a] hover:text-[#f5efeb]'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Story Behind the Track</span>
                </button>
              )}
              {activeModalSong.lyrics && (
                <button
                  onClick={() => setModalTab('lyrics')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'lyrics'
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
              {/* 1. Track Description */}
              {modalTab === 'all' && (activeModalSong.trackDescription || activeModalSong.description) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                    <Disc className="w-4 h-4" />
                    <span>Track Description</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-[#a8a295] leading-relaxed whitespace-pre-wrap font-sans bg-[#0a0b10] p-4 rounded-xl border border-[#1f2231]">
                    {activeModalSong.trackDescription || activeModalSong.description}
                  </p>
                </div>
              )}

              {/* 2. Story Behind the Track */}
              {(modalTab === 'all' || modalTab === 'story') && activeModalSong.storyBehindTrack && (
                <div className="space-y-2">
                  <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Story Behind the Track</span>
                  </h4>
                  <div className="p-5 bg-[#0a0b10] border border-[#1f2231] rounded-xl font-cormorant text-base sm:text-lg text-[#f5efeb] leading-relaxed whitespace-pre-wrap italic">
                    {activeModalSong.storyBehindTrack}
                  </div>
                </div>
              )}

              {/* 3. Lyrics */}
              {(modalTab === 'all' || modalTab === 'lyrics') && activeModalSong.lyrics && (
                <div className="space-y-2">
                  <h4 className="text-xs font-cinzel font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Song Lyrics</span>
                  </h4>
                  <div className="p-5 bg-[#0a0b10] border border-[#1f2231] rounded-xl font-mono text-xs sm:text-sm text-[#e8e2d8] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {activeModalSong.lyrics}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#1f2231] pt-4">
              {getPrimaryListenUrl(activeModalSong) && (
                <a
                  href={getPrimaryListenUrl(activeModalSong)!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Listen on {getPrimaryListenUrl(activeModalSong)!.platform}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveModalSong(null)}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
