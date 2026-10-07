import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storyService } from '../../services/storyService';
import { Story, PublicationState } from '../../types';
import {
  BookOpen,
  Plus,
  Edit3,
  Eye,
  Trash2,
  Clock,
  Sparkles,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';

export const AdminStoriesView: React.FC = () => {
  const { isAuthor, isEditor, role } = useAuth();
  const [storiesList, setStoriesList] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [editingStory, setEditingStory] = useState<Partial<Story> | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStories = async () => {
    const list = await storyService.getStories();
    setStoriesList(list);
  };

  useEffect(() => {
    loadStories();
    const unsub = storyService.subscribe((list) => setStoriesList(list));
    return () => unsub();
  }, []);

  const handleStartCreate = () => {
    if (!isAuthor) {
      setErrorMessage('Creation restricted: Only users with the Author role can create short stories.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setEditingStory({
      title: '',
      subtitle: '',
      universe: 'The Breathwoven Cycle',
      summary: '',
      content: [],
      readTime: '5 min read',
      publicationState: 'PUBLIC',
      datePublished: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
    setIsEditorModalOpen(true);
  };

  const handleStartEdit = (story: Story) => {
    if (!isAuthor && !isEditor) {
      setErrorMessage('Editing restricted: Only users with the Author role can modify short stories.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setEditingStory({ ...story });
    setIsEditorModalOpen(true);
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStory || !editingStory.title?.trim()) {
      setErrorMessage('Title is required.');
      return;
    }

    const res = await storyService.saveStory(
      editingStory as Story,
      isAuthor,
      isEditor
    );

    if (res.success) {
      setIsEditorModalOpen(false);
      setEditingStory(null);
      setActionSuccess('Short story saved successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadStories();
    } else {
      setErrorMessage(res.error || 'Failed to save short story.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!isAuthor) {
      setErrorMessage('Deletion restricted: Only users with the Author role can delete short stories.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const res = await storyService.deleteStory(storyId, isAuthor);
    if (res.success) {
      setDeletingStoryId(null);
      if (selectedStory?.id === storyId) setSelectedStory(null);
      setActionSuccess('Short story deleted permanently.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadStories();
    } else {
      setErrorMessage(res.error || 'Failed to delete story.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleDeleteAll = async () => {
    if (!isAuthor) {
      setErrorMessage('Deletion restricted: Only users with the Author role can delete short stories.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const res = await storyService.deleteAllStories(isAuthor);
    setIsDeletingAll(false);
    if (res.success) {
      setSelectedStory(null);
      setActionSuccess('All short stories deleted permanently.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadStories();
    } else {
      setErrorMessage(res.error || 'Failed to delete all stories.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!isAuthor) {
      setErrorMessage('Restoring defaults restricted: Only users with the Author role can restore stories.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    const res = await storyService.restoreInitialStories(isAuthor);
    if (res.success) {
      setActionSuccess('Default canon short stories restored successfully.');
      setTimeout(() => setActionSuccess(null), 3000);
      loadStories();
    } else {
      setErrorMessage(res.error || 'Failed to restore default stories.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Rebranded strictly to Short Stories */}
      <div className="border-b border-[#232635] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-cinzel tracking-widest text-[#c5a059] font-semibold">
              Editorial Fiction
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-cinzel uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Author Management
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-cinzel font-bold text-[#f5efeb] mt-1">
            Short Stories
          </h2>
          <p className="text-xs text-[#8e887a] mt-0.5">
            Manage canon short stories, companion tales, and reader commenting. Creation and deletion strictly restricted to Author role.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-[#171924] rounded-lg text-xs font-cinzel text-[#c5a059] border border-[#2b2e40]">
            {storiesList.length} Short Stories
          </div>

          {isAuthor ? (
            <div className="flex items-center gap-2">
              {storiesList.length > 0 && (
                <button
                  onClick={() => setIsDeletingAll(true)}
                  className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-cinzel uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Delete all short stories permanently"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete All</span>
                </button>
              )}
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#c5a059]/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Short Story</span>
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg text-xs font-cinzel bg-[#191b29] text-[#787367] border border-[#2b2e40] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Author-Only Management</span>
            </div>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-[#19221b] border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stories Grid / Empty State */}
      {storiesList.length === 0 ? (
        <div className="p-12 text-center text-[#8e887a] bg-[#11131c] border border-[#232635] rounded-xl space-y-4">
          <BookOpen className="w-8 h-8 text-[#5c5649] mx-auto" />
          <h3 className="font-cinzel text-base text-[#f5efeb]">No Short Stories Found</h3>
          <p className="text-xs text-[#7d776a] max-w-md mx-auto">
            {isAuthor
              ? 'All short stories have been deleted. You can create a new short story from scratch or restore the 3 default canon stories at any time.'
              : 'No short stories are currently available.'}
          </p>
          {isAuthor && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleStartCreate}
                className="px-4 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#c5a059]/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Short Story</span>
              </button>
              <button
                onClick={handleRestoreDefaults}
                className="px-4 py-2 bg-[#171924] hover:bg-[#222536] text-[#c5a059] text-xs font-cinzel uppercase tracking-wider rounded-lg border border-[#2b2e40] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restore 3 Canon Stories</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {storiesList.map((story) => (
            <div
              key={story.id}
              className="bg-[#11131c] border border-[#232635] rounded-xl p-5 hover:border-[#c5a059]/40 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059] px-2 py-0.5 bg-[#c5a059]/10 rounded border border-[#c5a059]/20">
                    {story.universe || 'Short Story'}
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
                  {story.datePublished || 'Canon'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedStory(story)}
                    className="px-2.5 py-1 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#c5a059] rounded flex items-center gap-1 transition-colors cursor-pointer"
                    title="Read story"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </button>

                  {(isAuthor || isEditor) && (
                    <button
                      onClick={() => handleStartEdit(story)}
                      className="p-1 bg-[#171924] hover:bg-[#202332] text-sky-400 rounded transition-colors cursor-pointer"
                      title="Edit story"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isAuthor && (
                    <button
                      onClick={() => setDeletingStoryId(story.id)}
                      className="p-1 bg-[#171924] hover:bg-rose-950/40 text-rose-400 rounded transition-colors cursor-pointer"
                      title="Delete story (Author only)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Excerpt / Reader Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="border-b border-[#232635] pb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-cinzel uppercase tracking-widest text-[#c5a059]">
                  {selectedStory.universe} · Short Story Preview
                </div>
                <h3 className="text-xl font-cinzel font-bold text-[#f5efeb] mt-1">
                  {selectedStory.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStory(null)}
                className="text-[#7d776a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
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
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal (Author only) */}
      {isEditorModalOpen && editingStory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl bg-[#11131c] border border-[#2b2e40] rounded-2xl p-6 sm:p-8 shadow-2xl max-h-[90vh] flex flex-col space-y-4">
            <div className="border-b border-[#232635] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#c5a059]" />
                <h3 className="text-lg font-cinzel font-bold text-[#f5efeb]">
                  {editingStory.id ? 'Edit Short Story' : 'New Short Story (Author Only)'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorModalOpen(false)}
                className="text-[#807b70] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStory} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  value={editingStory.title || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                  placeholder="e.g., The Loomtender's Solstice"
                  className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#e8e2d9]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    Subtitle / Tagline (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingStory.subtitle || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, subtitle: e.target.value })}
                    placeholder="e.g., A chronicle from the High Citadel"
                    className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#e8e2d9]"
                  />
                </div>

                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    Universe / Setting
                  </label>
                  <input
                    type="text"
                    value={editingStory.universe || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, universe: e.target.value })}
                    placeholder="e.g., The Breathwoven Cycle"
                    className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#e8e2d9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    Estimated Read Time
                  </label>
                  <input
                    type="text"
                    value={editingStory.readTime || ''}
                    onChange={(e) => setEditingStory({ ...editingStory, readTime: e.target.value })}
                    placeholder="e.g., 8 min read"
                    className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#e8e2d9]"
                  />
                </div>

                <div>
                  <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                    Publication State
                  </label>
                  <select
                    value={editingStory.publicationState || 'PUBLIC'}
                    onChange={(e) => setEditingStory({ ...editingStory, publicationState: e.target.value as PublicationState })}
                    className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg px-3 py-2 text-xs text-[#e8e2d9]"
                  >
                    <option value="PUBLIC">PUBLIC (Visible & Commentable)</option>
                    <option value="TEASER">TEASER</option>
                    <option value="DRAFT">DRAFT (Author only)</option>
                    <option value="PRIVATE">PRIVATE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Brief Synopsis / Summary
                </label>
                <textarea
                  value={editingStory.summary || ''}
                  onChange={(e) => setEditingStory({ ...editingStory, summary: e.target.value })}
                  placeholder="Short description shown on cards..."
                  rows={2}
                  className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#e8e2d9] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-cinzel text-[#dcd7cb] block mb-1">
                  Story Content (Separate paragraphs with blank lines)
                </label>
                <textarea
                  value={
                    Array.isArray(editingStory.content)
                      ? editingStory.content.join('\n\n')
                      : (editingStory.content as unknown as string) || ''
                  }
                  onChange={(e) =>
                    setEditingStory({
                      ...editingStory,
                      content: e.target.value.split('\n\n').filter(Boolean),
                    })
                  }
                  placeholder="Paste or write full short story paragraphs here..."
                  rows={8}
                  className="w-full bg-[#151724] border border-[#2b2e40] focus:border-[#c5a059] focus:outline-none rounded-lg p-3 text-xs text-[#e8e2d9] resize-y font-serif"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#232635]">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d6b066] text-[#0c0d12] text-xs font-cinzel font-bold uppercase rounded-lg transition-colors"
                >
                  Save Short Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Author only) */}
      {deletingStoryId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-[#11131c] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Confirm Short Story Deletion</span>
            </div>
            <p className="text-xs text-[#a8a396]">
              Are you sure you want to permanently delete this short story? This action is restricted to the Author role and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStoryId(null)}
                className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStory(deletingStoryId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Stories Confirmation Modal (Author only) */}
      {isDeletingAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-[#11131c] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-cinzel font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Delete All Short Stories?</span>
            </div>
            <p className="text-xs text-[#a8a396]">
              Are you sure you want to permanently delete all {storiesList.length} short stories? This action will remove all stories and will not automatically restore them.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeletingAll(false)}
                className="px-4 py-2 text-xs font-cinzel text-[#8f897c] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-cinzel font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Delete All Stories
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
