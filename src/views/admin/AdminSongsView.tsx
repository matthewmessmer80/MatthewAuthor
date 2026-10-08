import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Heart,
  Globe,
  Lock,
  Search,
  Volume2,
  Disc,
  X,
  FileText,
  Tag,
  Calendar,
  User,
  Radio,
  Eye,
  List,
  Grid,
  Loader2,
} from 'lucide-react';
import { Song, SongStatus, SongExternalLink } from '../../types';
import { songService } from '../../services/songService';
import { useAuth } from '../../context/AuthContext';

const PREDEFINED_CATEGORIES = [
  'Original Country & Acoustic',
  'Dedication Track',
  'Soundtrack Companion',
  'Character Theme',
  'Atmospheric Instrumental',
  'Epic Fantasy Score',
  'Folk Ballad',
];

export const AdminSongsView: React.FC = () => {
  const { isAuthor } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & layout
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SongStatus>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Audio preview playback
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File upload state
  const [coverUploading, setCoverUploading] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);

  // Quick uploader state (direct upload to vault)
  const [quickUploadLoading, setQuickUploadLoading] = useState(false);
  const [quickUploadProgress, setQuickUploadProgress] = useState(0);
  const [quickUploadError, setQuickUploadError] = useState<string | null>(null);

  // File input refs for clearing values
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const quickAudioInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSongs(songService.getCachedSongs());
    setLoading(false);

    const unsub = songService.subscribe((list) => {
      setSongs(list);
    });

    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenNewSong = () => {
    setEditingSong({
      title: '',
      artist: 'Matthew E. Messmer',
      category: 'Soundtrack Companion',
      description: '',
      lyrics: '',
      dedication: '',
      audioUrl: '',
      coverImage: '',
      releaseDate: new Date().toISOString().split('T')[0],
      status: 'Draft', // Strict requirement: newly uploaded song defaults to Draft!
      isPublic: true,
      featured: false,
      displayOrder: songs.length + 1,
      tags: [],
      youtubeUrl: '',
      spotifyUrl: '',
      soundcloudUrl: '',
      bandcampUrl: '',
    });
    setIsEditorOpen(true);
  };

  const handleOpenEditSong = (song: Song) => {
    setEditingSong({
      ...song,
      youtubeUrl: song.youtubeUrl || song.externalLinks?.find((l) => l.platform === 'YouTube')?.url || '',
      spotifyUrl: song.spotifyUrl || song.externalLinks?.find((l) => l.platform === 'Spotify')?.url || '',
      soundcloudUrl: song.soundcloudUrl || song.externalLinks?.find((l) => l.platform === 'SoundCloud')?.url || '',
      bandcampUrl: song.bandcampUrl || song.externalLinks?.find((l) => l.platform === 'Bandcamp')?.url || '',
    });
    setIsEditorOpen(true);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !editingSong.title?.trim()) {
      alert('Please provide a song title.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await songService.saveSong(editingSong);
      showToast(`Song "${saved.title}" saved successfully (${saved.status}).`);
      setIsEditorOpen(false);
      setEditingSong(null);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSong = async () => {
    if (!songToDelete) return;
    setIsDeleting(true);
    try {
      if (playingSongId === songToDelete.id && audioRef.current) {
        audioRef.current.pause();
        setPlayingSongId(null);
      }
      await songService.deleteSong(songToDelete.id);
      showToast(`Song "${songToDelete.title}" permanently deleted.`);
      setSongToDelete(null);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= songs.length) return;

    const newOrder = [...songs];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    await songService.reorderSongs(newOrder.map((s) => s.id));
    showToast('Display order updated.');
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const dataUrl = await songService.uploadCoverArtwork(file);
      setEditingSong((prev) => ({ ...prev, coverImage: dataUrl }));
      showToast('Cover artwork uploaded.');
    } catch (err: any) {
      alert(`Cover upload failed: ${err.message}`);
    } finally {
      setCoverUploading(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioUploadError(null);

    // Validate audio file
    const validation = songService.validateAudioFile(file);
    if (!validation.valid) {
      setAudioUploadError(validation.error || 'Invalid audio file.');
      if (audioInputRef.current) audioInputRef.current.value = '';
      return;
    }

    setAudioUploading(true);
    setAudioUploadProgress(0);

    try {
      const result = await songService.uploadAudioFileResumable(file, {
        songId: editingSong?.id,
        onProgress: (p) => {
          setAudioUploadProgress(p.progressPercent);
        },
      });

      setEditingSong((prev) => ({
        ...prev,
        audioUrl: result.downloadUrl,
        storagePath: result.storagePath,
        fileSize: result.fileSize,
        duration: result.duration !== undefined ? result.duration : prev?.duration,
      }));

      showToast(`Audio file "${file.name}" uploaded successfully.`);
    } catch (err: any) {
      console.error('Audio upload error:', err);
      setAudioUploadError(err.message || 'Storage error during audio upload.');
    } finally {
      setAudioUploading(false);
      setAudioUploadProgress(0);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    }
  };

  const handleQuickAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQuickUploadError(null);

    // Validate audio file
    const validation = songService.validateAudioFile(file);
    if (!validation.valid) {
      setQuickUploadError(validation.error || 'Invalid audio file.');
      if (quickAudioInputRef.current) quickAudioInputRef.current.value = '';
      return;
    }

    setQuickUploadLoading(true);
    setQuickUploadProgress(0);

    try {
      const savedSong = await songService.createTrackFromUpload(
        file,
        { status: 'Draft' },
        (p) => {
          setQuickUploadProgress(p.progressPercent);
        }
      );

      showToast(`Track "${savedSong.title}" uploaded and added to vault!`);
    } catch (err: any) {
      console.error('Quick audio upload error:', err);
      setQuickUploadError(err.message || 'Storage error during audio upload.');
    } finally {
      setQuickUploadLoading(false);
      setQuickUploadProgress(0);
      if (quickAudioInputRef.current) {
        quickAudioInputRef.current.value = '';
      }
    }
  };

  const togglePlayAudio = (song: Song) => {
    if (!song.audioUrl) {
      alert('No direct audio preview file is attached to this song yet. You can attach an MP3 or audio link in the editor.');
      return;
    }

    if (playingSongId === song.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingSongId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(song.audioUrl);
      audioRef.current = audio;
      audio.play().catch((err) => {
        console.warn('Playback error:', err);
      });
      audio.onended = () => setPlayingSongId(null);
      setPlayingSongId(song.id);
    }
  };

  // Filtered list
  const filteredSongs = songs.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const publishedCount = songs.filter((s) => s.status === 'Published').length;
  const draftCount = songs.filter((s) => s.status === 'Draft').length;
  const unreleasedCount = songs.filter((s) => s.status === 'Unreleased').length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232635] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb]">
              Songs & Music Library
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-cinzel bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059]">
              Companion Audio
            </span>
          </div>
          <p className="text-xs text-[#8e887a] mt-1">
            Authoritative music vault. Manage original recordings, tribute tracks, and streaming discography.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Quick Audio Uploader */}
          <label
            className={`px-3.5 py-2.5 bg-[#171926] hover:bg-[#202334] border border-[#2e3246] text-[#c5a059] text-xs font-cinzel rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-md ${
              quickUploadLoading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {quickUploadLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" />
            ) : (
              <Upload className="w-4 h-4 text-[#c5a059]" />
            )}
            <span>
              {quickUploadLoading
                ? `Uploading Track (${quickUploadProgress}%)...`
                : 'Upload Audio Track to Vault'}
            </span>
            <input
              ref={quickAudioInputRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/*"
              onChange={handleQuickAudioUpload}
              disabled={quickUploadLoading}
              className="hidden"
            />
          </label>

          <button
            onClick={handleOpenNewSong}
            className="px-4 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5a059]/15"
          >
            <Plus className="w-4 h-4" />
            <span>Add Song</span>
          </button>
        </div>
      </div>

      {/* Quick Upload Progress Bar Banner */}
      {quickUploadLoading && (
        <div className="p-4 bg-[#11131c] border border-[#c5a059]/50 rounded-xl space-y-2.5 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-cinzel">
            <span className="text-[#f5efeb] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" />
              Uploading track to Audio & Soundtrack Vault...
            </span>
            <span className="text-[#c5a059] font-mono font-bold">{quickUploadProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-[#0a0b10] rounded-full overflow-hidden border border-[#2b2e40]">
            <div
              className="h-full bg-gradient-to-r from-[#c5a059] to-amber-300 transition-all duration-200"
              style={{ width: `${quickUploadProgress}%` }}
            />
          </div>
          <div className="text-[11px] text-[#8e887a] flex items-center justify-between">
            <span>Transferring audio data to secure storage</span>
            <span>Resumable upload monitored</span>
          </div>
        </div>
      )}

      {/* Quick Upload Error Banner */}
      {quickUploadError && (
        <div className="p-4 bg-rose-950/80 border border-rose-600/70 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <strong className="block font-semibold text-rose-100">Audio Upload Failed</strong>
              <span>{quickUploadError}</span>
            </div>
          </div>
          <button
            onClick={() => setQuickUploadError(null)}
            className="text-rose-400 hover:text-rose-100 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {toastMessage && (
        <div className="p-3.5 bg-emerald-950/70 border border-emerald-600/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#11131c] border border-[#232635]">
          <div className="text-[11px] text-[#8e887a] font-cinzel uppercase tracking-wider">Total Songs</div>
          <div className="text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">{songs.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#11131c] border border-[#232635]">
          <div className="text-[11px] text-emerald-400 font-cinzel uppercase tracking-wider">Published</div>
          <div className="text-2xl font-cinzel font-bold text-emerald-300 mt-1">{publishedCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#11131c] border border-[#232635]">
          <div className="text-[11px] text-amber-400 font-cinzel uppercase tracking-wider">Drafts</div>
          <div className="text-2xl font-cinzel font-bold text-amber-300 mt-1">{draftCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#11131c] border border-[#232635]">
          <div className="text-[11px] text-indigo-400 font-cinzel uppercase tracking-wider">Unreleased</div>
          <div className="text-2xl font-cinzel font-bold text-indigo-300 mt-1">{unreleasedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#11131c] border border-[#232635] p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7d776a] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs, artist, tags..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#d4cfc2] focus:outline-none focus:border-[#c5a059]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Published">Published Only</option>
            <option value="Draft">Drafts Only</option>
            <option value="Unreleased">Unreleased Only</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#d4cfc2] focus:outline-none focus:border-[#c5a059]"
          >
            <option value="ALL">All Categories</option>
            {PREDEFINED_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0a0b10] border border-[#2b2e40] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#1e202d] text-[#c5a059]' : 'text-[#7d776a]'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1e202d] text-[#c5a059]' : 'text-[#7d776a]'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Song List Content */}
      {filteredSongs.length === 0 ? (
        <div className="bg-[#11131c] border border-[#232635] rounded-xl p-12 text-center space-y-3">
          <Music className="w-10 h-10 text-[#6d685c] mx-auto opacity-50" />
          <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">No Songs Found</h3>
          <p className="text-xs text-[#8e887a] max-w-md mx-auto">
            {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No songs matched your current filters. Try resetting the search or category filter.'
              : 'The music library is currently empty. Click "Add Song" above to create your first musical track.'}
          </p>
          {(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-3.5 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs.map((song, index) => {
            const isPlaying = playingSongId === song.id;
            return (
              <div
                key={song.id}
                className="bg-[#11131c] border border-[#232635] hover:border-[#c5a059]/40 rounded-xl overflow-hidden flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Cover & Header */}
                  <div className="relative h-44 bg-[#0a0b10] border-b border-[#1f2231] overflow-hidden">
                    {song.coverImage ? (
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#12141f] to-[#0c0d12] text-[#c5a059]">
                        <Disc className="w-12 h-12 opacity-40 animate-spin-slow" />
                        <span className="text-[11px] font-cinzel uppercase tracking-widest mt-2 text-[#8e887a]">
                          Soundtrack Vault
                        </span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#11131c] via-transparent to-black/60 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase tracking-wider ${
                          song.status === 'Published'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                            : song.status === 'Draft'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                            : 'bg-indigo-950/80 text-indigo-300 border border-indigo-700/50'
                        }`}
                      >
                        {song.status}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {song.featured && (
                          <span className="p-1 rounded bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40" title="Featured Song">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                        {!song.isPublic && (
                          <span className="p-1 rounded bg-zinc-900/80 text-zinc-400 border border-zinc-700" title="Private / Unlisted">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Audio Play Overlay Button */}
                    {song.audioUrl && (
                      <button
                        onClick={() => togglePlayAudio(song)}
                        className={`absolute bottom-3 right-3 p-3 rounded-full transition-transform cursor-pointer shadow-xl ${
                          isPlaying
                            ? 'bg-[#c5a059] text-[#0c0d12] scale-110'
                            : 'bg-[#0c0d12]/90 hover:bg-[#c5a059] text-[#c5a059] hover:text-[#0c0d12] border border-[#c5a059]/40'
                        }`}
                        title={isPlaying ? 'Pause preview' : 'Play audio preview'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <div className="text-[11px] font-cinzel text-[#c5a059] uppercase font-semibold">
                        {song.category}
                      </div>
                      <h3 className="font-cinzel font-bold text-base text-[#f5efeb] mt-0.5 group-hover:text-[#c5a059] transition-colors">
                        {song.title}
                      </h3>
                      <div className="text-xs text-[#8e887a] mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{song.artist}</span>
                        {song.releaseDate && (
                          <>
                            <span>·</span>
                            <Calendar className="w-3 h-3 ml-1" />
                            <span>{song.releaseDate}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {song.dedication && (
                      <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-lg text-xs text-rose-200/90 font-cormorant italic flex items-start gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>"{song.dedication}"</span>
                      </div>
                    )}

                    <p className="text-xs text-[#a8a396] line-clamp-2 leading-relaxed">
                      {song.description || 'No description provided.'}
                    </p>

                    {/* External links pills */}
                    {song.externalLinks && song.externalLinks.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {song.externalLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded bg-[#161824] hover:bg-[#202334] text-[10px] font-cinzel text-[#b5af9f] hover:text-[#f5efeb] border border-[#2b2e40] flex items-center gap-1 transition-colors"
                          >
                            <span>{link.platform}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-[#0a0b10] border-t border-[#1f2231] flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveOrder(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-[#7d776a] hover:text-[#f5efeb] disabled:opacity-30 disabled:pointer-events-none rounded"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(index, 'down')}
                      disabled={index === songs.length - 1}
                      className="p-1.5 text-[#7d776a] hover:text-[#f5efeb] disabled:opacity-30 disabled:pointer-events-none rounded"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-[#5a554a] font-mono ml-1">#{song.displayOrder || index + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditSong(song)}
                      className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setSongToDelete(song)}
                      className="px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-cinzel rounded transition-colors flex items-center gap-1 cursor-pointer"
                      title="Delete Song"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#11131c] border border-[#232635] rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#212332] text-[#8e887a] font-cinzel uppercase text-[11px] bg-[#0c0d12]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Song Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Artist</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Release Date</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b1e2c]">
                {filteredSongs.map((song, index) => (
                  <tr key={song.id} className="hover:bg-[#151724] transition-colors">
                    <td className="py-3 px-4 text-center text-[#6e685c] font-mono">
                      {song.displayOrder || index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-[#0a0b10] border border-[#2b2e40] overflow-hidden shrink-0 flex items-center justify-center">
                          {song.coverImage ? (
                            <img src={song.coverImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Disc className="w-4 h-4 text-[#c5a059]" />
                          )}
                        </div>
                        <div>
                          <div className="font-cinzel font-bold text-xs text-[#f5efeb]">{song.title}</div>
                          {song.dedication && (
                            <div className="text-[11px] text-rose-300 italic font-cormorant">
                              "{song.dedication}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-cinzel font-bold uppercase ${
                          song.status === 'Published'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/40'
                            : song.status === 'Draft'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-700/40'
                            : 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/40'
                        }`}
                      >
                        {song.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#d4cfc2]">{song.artist}</td>
                    <td className="py-3 px-4 text-[#c5a059] font-cinzel text-[11px]">{song.category}</td>
                    <td className="py-3 px-4 text-[#7d776a] font-mono">{song.releaseDate || '—'}</td>
                    <td className="py-3 px-4">
                      {song.featured ? (
                        <span className="text-emerald-400 font-cinzel text-[11px] font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-[#5a554a] text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {song.audioUrl && (
                          <button
                            onClick={() => togglePlayAudio(song)}
                            className="p-1.5 text-[#c5a059] hover:bg-[#1f2231] rounded"
                            title="Preview Audio"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditSong(song)}
                          className="px-2.5 py-1 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setSongToDelete(song)}
                          className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-cinzel rounded border border-rose-800/40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SONG EDITOR MODAL */}
      {isEditorOpen && editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#11131c] border border-[#2b2e40] rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#212334] pb-4">
              <div>
                <h3 className="font-cinzel font-bold text-lg text-[#f5efeb]">
                  {editingSong.id ? `Edit Song: ${editingSong.title}` : 'Add New Song'}
                </h3>
                <p className="text-xs text-[#8e887a] mt-0.5">
                  Newly added songs default to Draft status. Publish only when ready for public display.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[#7d776a] hover:text-[#f5efeb] p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="space-y-6">
              {/* Core Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                    Song Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSong.title || ''}
                    onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                    placeholder="e.g. Different Roads, Same Family"
                    className="w-full px-3.5 py-2.5 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-sm text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                    Artist / Performer
                  </label>
                  <input
                    type="text"
                    value={editingSong.artist || ''}
                    onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                    placeholder="Matthew E. Messmer"
                    className="w-full px-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                    Publication Status *
                  </label>
                  <select
                    value={editingSong.status || 'Draft'}
                    onChange={(e) => setEditingSong({ ...editingSong, status: e.target.value as SongStatus })}
                    className="w-full px-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  >
                    <option value="Draft">Draft (Hidden from public site)</option>
                    <option value="Published">Published (Live in Public Vault)</option>
                    <option value="Unreleased">Unreleased (Upcoming / Teaser)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                    Category / Genre
                  </label>
                  <select
                    value={editingSong.category || 'Soundtrack Companion'}
                    onChange={(e) => setEditingSong({ ...editingSong, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  >
                    {PREDEFINED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Custom">Other / Custom</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={editingSong.releaseDate || ''}
                    onChange={(e) => setEditingSong({ ...editingSong, releaseDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Dedication Information */}
              <div className="space-y-1.5 p-4 bg-[#0d0f18] border border-[#1f2231] rounded-xl">
                <label className="block text-xs font-cinzel font-semibold text-rose-300 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dedication Information / Special Tribute Note</span>
                </label>
                <input
                  type="text"
                  value={editingSong.dedication || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, dedication: e.target.value })}
                  placeholder="e.g. Dedicated with love to my sister Dawn — celebrating unbreakable bonds across time and distance."
                  className="w-full px-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                  Description & Story Behind the Track
                </label>
                <textarea
                  rows={3}
                  value={editingSong.description || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, description: e.target.value })}
                  placeholder="Describe the inspiration, narrative tie-in, or worldbuilding context..."
                  className="w-full px-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Lyrics */}
              <div className="space-y-1.5">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2] flex items-center justify-between">
                  <span>Lyrics</span>
                  <span className="text-[11px] text-[#7d776a] font-normal">Optional</span>
                </label>
                <textarea
                  rows={5}
                  value={editingSong.lyrics || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, lyrics: e.target.value })}
                  placeholder="Add verse, chorus, and bridge lyrics..."
                  className="w-full px-3.5 py-2 bg-[#0a0b10] border border-[#2b2e40] rounded-lg text-xs font-mono text-[#f5efeb] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {/* Cover Artwork & Audio File Association */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#0d0f18] border border-[#1f2231] rounded-xl">
                {/* Cover Image Upload / URL */}
                <div className="space-y-3">
                  <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                    Cover Artwork
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-[#0a0b10] border border-[#2b2e40] overflow-hidden shrink-0 flex items-center justify-center">
                      {editingSong.coverImage ? (
                        <img src={editingSong.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Disc className="w-6 h-6 text-[#7d776a]" />
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded cursor-pointer inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{coverUploading ? 'Compressing...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          disabled={coverUploading}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={editingSong.coverImage || ''}
                        onChange={(e) => setEditingSong({ ...editingSong, coverImage: e.target.value })}
                        placeholder="Or enter image URL..."
                        className="w-full px-2.5 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Audio File Upload / URL */}
                <div className="space-y-3">
                  <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                    Audio File / Preview Stream
                  </label>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className={`px-3 py-1.5 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#c5a059] rounded cursor-pointer inline-flex items-center gap-1.5 transition-colors ${
                          audioUploading ? 'opacity-60 pointer-events-none' : ''
                        }`}
                      >
                        {audioUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c5a059]" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {audioUploading
                            ? `Uploading (${audioUploadProgress}%)...`
                            : 'Upload Audio File'}
                        </span>
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/*"
                          onChange={handleAudioUpload}
                          disabled={audioUploading}
                          className="hidden"
                        />
                      </label>

                      {editingSong.duration !== undefined && editingSong.duration > 0 && (
                        <span className="text-[11px] text-[#8e887a] font-mono px-2 py-0.5 bg-[#0a0b10] rounded border border-[#1f2231]">
                          Duration: {Math.floor(editingSong.duration / 60)}:
                          {String(editingSong.duration % 60).padStart(2, '0')}
                        </span>
                      )}

                      {editingSong.fileSize !== undefined && editingSong.fileSize > 0 && (
                        <span className="text-[11px] text-[#8e887a] font-mono px-2 py-0.5 bg-[#0a0b10] rounded border border-[#1f2231]">
                          Size: {(editingSong.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      )}
                    </div>

                    {/* Modal Audio Upload Progress Bar */}
                    {audioUploading && (
                      <div className="p-3 bg-[#0a0b10] border border-[#c5a059]/40 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-cinzel">
                          <span className="text-[#f5efeb] flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin text-[#c5a059]" />
                            Uploading to Storage...
                          </span>
                          <span className="text-[#c5a059] font-mono font-bold">
                            {audioUploadProgress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#171924] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#c5a059] to-amber-300 transition-all duration-150"
                            style={{ width: `${audioUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Modal Audio Upload Error */}
                    {audioUploadError && (
                      <div className="p-2.5 bg-rose-950/70 border border-rose-600/60 rounded-lg text-rose-200 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{audioUploadError}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAudioUploadError(null)}
                          className="text-rose-400 hover:text-rose-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <input
                      type="text"
                      value={editingSong.audioUrl || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, audioUrl: e.target.value })}
                      placeholder="Direct MP3 / audio link or data URL..."
                      className="w-full px-2.5 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-xs text-[#f5efeb] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Streaming Links */}
              <div className="space-y-3 p-4 bg-[#0d0f18] border border-[#1f2231] rounded-xl">
                <label className="block text-xs font-cinzel font-semibold text-[#d4cfc2]">
                  Streaming & Platform Links
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-[#8e887a] block mb-1">YouTube Link</label>
                    <input
                      type="url"
                      value={editingSong.youtubeUrl || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, youtubeUrl: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-3 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-[#f5efeb] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e887a] block mb-1">Spotify Link</label>
                    <input
                      type="url"
                      value={editingSong.spotifyUrl || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, spotifyUrl: e.target.value })}
                      placeholder="https://open.spotify.com/track/..."
                      className="w-full px-3 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-[#f5efeb] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e887a] block mb-1">SoundCloud Link</label>
                    <input
                      type="url"
                      value={editingSong.soundcloudUrl || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, soundcloudUrl: e.target.value })}
                      placeholder="https://soundcloud.com/..."
                      className="w-full px-3 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-[#f5efeb] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e887a] block mb-1">Bandcamp Link</label>
                    <input
                      type="url"
                      value={editingSong.bandcampUrl || ''}
                      onChange={(e) => setEditingSong({ ...editingSong, bandcampUrl: e.target.value })}
                      placeholder="https://matthewemessmer.bandcamp.com/..."
                      className="w-full px-3 py-1.5 bg-[#0a0b10] border border-[#2b2e40] rounded text-[#f5efeb] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles & Visibility */}
              <div className="flex flex-wrap items-center gap-6 p-4 bg-[#0d0f18] border border-[#1f2231] rounded-xl text-xs">
                <label className="flex items-center gap-2 text-[#d4cfc2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSong.isPublic !== false}
                    onChange={(e) => setEditingSong({ ...editingSong, isPublic: e.target.checked })}
                    className="w-4 h-4 rounded text-[#c5a059] focus:ring-0"
                  />
                  <span>Publicly Visible on Website</span>
                </label>

                <label className="flex items-center gap-2 text-[#d4cfc2] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingSong.featured}
                    onChange={(e) => setEditingSong({ ...editingSong, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#c5a059] focus:ring-0"
                  />
                  <span>Featured Song Spotlight</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#212334]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingSong.id ? 'Save Changes' : 'Create Song'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {songToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131c] border border-rose-900/50 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-950/70 border border-rose-800/40 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#f5efeb]">
                  Delete Song
                </h3>
                <p className="text-xs text-[#8e887a]">Permanent removal confirmation</p>
              </div>
            </div>

            <div className="p-4 bg-[#0a0b10] border border-[#232635] rounded-xl space-y-2">
              <p className="text-sm font-cinzel font-bold text-[#f5efeb]">
                "{songToDelete.title}"
              </p>
              <div className="text-xs text-[#8e887a]">
                Artist: <strong className="text-[#c5a059]">{songToDelete.artist}</strong> · Status: {songToDelete.status}
              </div>
              <p className="text-xs text-rose-300/90 pt-1">
                Are you sure you want to permanently delete this song?
              </p>
              <p className="text-[11px] text-[#7d776a]">
                This will remove the song from the authoritative database and public Audio & Soundtrack Vault.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSongToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#1b1e2c] hover:bg-[#25283c] text-xs font-cinzel text-[#d4cfc2] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSong}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSongsView;
