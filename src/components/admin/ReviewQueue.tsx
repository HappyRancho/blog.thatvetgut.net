import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  MessageSquare,
  Send,
  ShieldCheck,
  User,
  XCircle,
  Check,
} from 'lucide-react';
import { Article, ArticleStatus, ReviewNote } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  getArticlesFromFirestore,
  updateArticleStatusInFirestore,
  addInternalNoteToArticle,
} from '../../services/articleService';

export const ReviewQueue: React.FC = () => {
  const { currentAuthor, isCoFounder } = useAuth();
  const { navigateTo } = useNavigation();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [newNote, setNewNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter queue tabs
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'under_review' | 'changes_requested' | 'approved'>('all');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const all = await getArticlesFromFirestore();
      // Filter for items in review lifecycle
      const queueItems = all.filter(
        (a) =>
          a.status === 'SUBMITTED FOR REVIEW' ||
          a.status === 'UNDER REVIEW' ||
          a.status === 'CHANGES REQUESTED' ||
          a.status === 'APPROVED'
      );
      setArticles(queueItems);
      if (selectedArticle) {
        const updated = queueItems.find((a) => a.id === selectedArticle.id);
        if (updated) setSelectedArticle(updated);
      }
    } catch (err) {
      console.error('Error fetching review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filteredArticles = articles.filter((a) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'submitted') return a.status === 'SUBMITTED FOR REVIEW';
    if (activeTab === 'under_review') return a.status === 'UNDER REVIEW';
    if (activeTab === 'changes_requested') return a.status === 'CHANGES REQUESTED';
    if (activeTab === 'approved') return a.status === 'APPROVED';
    return true;
  });

  const handleAddNote = async () => {
    if (!selectedArticle || !newNote.trim()) return;
    setActionLoading(true);
    try {
      const added = await addInternalNoteToArticle(
        selectedArticle.id,
        newNote.trim(),
        currentAuthor?.id || 'reviewer',
        currentAuthor?.name || 'ThatVetGuy Co-Founder'
      );
      setSelectedArticle({
        ...selectedArticle,
        internalNotes: [...(selectedArticle.internalNotes || []), added],
      });
      setNewNote('');
      fetchQueue();
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ArticleStatus, notePrompt?: boolean) => {
    if (!selectedArticle) return;
    let noteText = '';
    if (notePrompt) {
      const promptRes = window.prompt(`Enter feedback/note for this status change (${newStatus}):`);
      if (promptRes === null) return;
      noteText = promptRes.trim();
    }

    setActionLoading(true);
    try {
      await updateArticleStatusInFirestore(selectedArticle.id, newStatus, {
        note: noteText || (newStatus === 'CHANGES REQUESTED' ? 'Changes requested by editorial reviewer.' : undefined),
        authorId: currentAuthor?.id,
        authorName: currentAuthor?.name,
        reviewerName: currentAuthor?.name,
      });

      alert(`Article status updated to ${newStatus}`);
      await fetchQueue();
      if (newStatus === 'PUBLISHED') {
        setSelectedArticle(null);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900">
            Clinical Peer Review Queue
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Collaborative review and approval pipeline for ThatVetGuy Co-Founders and Contributors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950">
            {articles.length} in Queue
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-stone-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
            activeTab === 'all'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          All Queue ({articles.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submitted')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
            activeTab === 'submitted'
              ? 'bg-amber-800 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Submitted ({articles.filter((a) => a.status === 'SUBMITTED FOR REVIEW').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('under_review')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
            activeTab === 'under_review'
              ? 'bg-blue-800 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Under Review ({articles.filter((a) => a.status === 'UNDER REVIEW').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('changes_requested')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
            activeTab === 'changes_requested'
              ? 'bg-red-800 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Changes Requested ({articles.filter((a) => a.status === 'CHANGES REQUESTED').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
            activeTab === 'approved'
              ? 'bg-emerald-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Approved ({articles.filter((a) => a.status === 'APPROVED').length})
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-emerald-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-xs">Loading queue items...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-emerald-800 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-stone-900 text-lg">Review Queue is Clear</h3>
          <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto mt-1">
            No articles currently awaiting review under this filter. When a Co-Founder or Contributor submits an article, it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List of articles */}
          <div className={`${selectedArticle ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
            {filteredArticles.map((art) => {
              const isSelected = selectedArticle?.id === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-emerald-800 ring-2 ring-emerald-800/20 shadow-md'
                      : 'border-stone-200 hover:border-stone-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        art.status === 'SUBMITTED FOR REVIEW'
                          ? 'bg-amber-100 text-amber-900'
                          : art.status === 'UNDER REVIEW'
                          ? 'bg-blue-100 text-blue-900'
                          : art.status === 'CHANGES REQUESTED'
                          ? 'bg-red-100 text-red-900'
                          : 'bg-emerald-100 text-emerald-950'
                      }`}
                    >
                      {art.status}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      v{art.version || 1}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-stone-900 text-base leading-snug line-clamp-2">
                    {art.title}
                  </h4>

                  <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                    {art.subtitle || art.excerpt}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{art.authorName}</span>
                    </div>
                    {art.internalNotes && art.internalNotes.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-900 font-semibold text-[11px]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {art.internalNotes.length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Article Detail & Review Panel */}
          {selectedArticle && (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-xs p-4 sm:p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block mb-1">
                    {selectedArticle.status}
                  </span>
                  <h3 className="font-serif font-bold text-xl text-stone-900 leading-tight">
                    {selectedArticle.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    By <span className="font-semibold text-stone-700">{selectedArticle.authorName}</span> • Slug: <span className="font-mono">/article/{selectedArticle.slug}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo({ name: 'admin', section: 'edit', articleId: selectedArticle.id })}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 shrink-0 min-h-[44px]"
                >
                  <Edit3 className="w-4 h-4 text-emerald-900" />
                  <span>Full Edit</span>
                </button>
              </div>

              {/* Review Action Controls (For Co-Founders) */}
              {isCoFounder && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <h5 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                    Editorial Actions (All Co-Founders Have Equal Authority)
                  </h5>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('UNDER REVIEW')}
                      className="px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-xl min-h-[44px] flex items-center gap-1 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Set Under Review</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('CHANGES REQUESTED', true)}
                      className="px-3 py-2 text-xs font-semibold text-red-900 bg-red-100 hover:bg-red-200 rounded-xl min-h-[44px] flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Request Changes</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('APPROVED')}
                      className="px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl min-h-[44px] flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-900" />
                      <span>Approve Article</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus('PUBLISHED')}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl min-h-[44px] flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Publish Directly</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Internal Notes Section (Never shown publicly) */}
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-900" />
                    <span>Internal Editorial Notes (Private & Internal Only)</span>
                  </h4>
                  <span className="text-[11px] text-stone-400 font-medium">Never visible to public</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {!selectedArticle.internalNotes || selectedArticle.internalNotes.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-1">
                      No internal notes recorded yet.
                    </p>
                  ) : (
                    selectedArticle.internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                          <span className="font-bold text-stone-800">{note.authorName}</span>
                          <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-stone-700 whitespace-pre-wrap">{note.note}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add note input */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNote();
                    }}
                    placeholder="Add an internal reviewer comment or feedback..."
                    className="flex-1 text-xs border border-stone-200 rounded-xl px-3 py-2.5 min-h-[44px] outline-hidden focus:border-emerald-800"
                  />
                  <button
                    type="button"
                    disabled={!newNote.trim() || actionLoading}
                    onClick={handleAddNote}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 rounded-xl min-h-[44px] flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </div>

              {/* Article Content Preview */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  Document Preview
                </h4>
                <div className="p-4 sm:p-6 bg-stone-50 rounded-2xl border border-stone-200 max-h-96 overflow-y-auto prose prose-stone text-xs sm:text-sm leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedArticle.content ||
                        '<p class="text-stone-400 italic">No formatted content available.</p>',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
