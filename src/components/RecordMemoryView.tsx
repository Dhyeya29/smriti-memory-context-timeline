import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Feather,
  Send,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Calendar,
  Save,
  MessageSquare,
  Sparkles,
  Compass,
  PenTool,
  HelpCircle,
  RotateCcw,
  X,
  Plus,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon
} from 'lucide-react';
import type { ConversationMessage, StructuredMemoryDraft, Memory } from '../types';
import { sendMemoryChatMessage, synthesizeMemory } from '../services/api';
import { saveUserMemory } from '../firebase';

interface RecordMemoryViewProps {
  userId: string;
  onMemorySaved: (memoryId: string) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  'Personal',
  'Career',
  'Decisions',
  'Projects',
  'Health',
  'Relationships',
  'Milestone'
];

const STARTER_PROMPTS = [
  'A career turning point or job transition',
  'Why I paused or walked away from a project',
  'A pivotal decision involving family or relocation',
  'A quiet change in my priorities or values',
  'A moment that tested my convictions'
];

const REFLECTION_TITLES = [
  'Smriti asks',
  'A quiet reflection',
  'Something worth exploring',
  'A gentle question'
];

export const RecordMemoryView: React.FC<RecordMemoryViewProps> = ({
  userId,
  onMemorySaved,
  onCancel
}) => {
  // Draft / Journal State
  const [topicTitle, setTopicTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [category, setCategory] = useState<string>('Personal');
  const [tags, setTags] = useState<string[]>(['reflection']);
  const [tagInput, setTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Date State
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const [entryDate, setEntryDate] = useState(todayFormatted);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Gemini Multi-turn Companion Conversation
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [reflectionInput, setReflectionInput] = useState('');
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [isSendingToSmriti, setIsSendingToSmriti] = useState(false);

  // Saving / Distillation States
  const [isSaving, setIsSaving] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [synthesizedDraft, setSynthesizedDraft] = useState<StructuredMemoryDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ruledLinesEnabled, setRuledLinesEnabled] = useState(true);

  // Refs for auto-expanding textarea and scrolling
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const companionEndRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const draftStorageKey = `smriti_journal_draft_${userId}`;

  // Auto-resize writing canvas textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(340, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  // Restore local draft on mount if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem(draftStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.journalContent || parsed.topicTitle) {
          if (parsed.topicTitle) setTopicTitle(parsed.topicTitle);
          if (parsed.journalContent) setJournalContent(parsed.journalContent);
          if (parsed.category) setCategory(parsed.category);
          if (Array.isArray(parsed.tags)) setTags(parsed.tags);
          if (parsed.entryDate) setEntryDate(parsed.entryDate);
          if (Array.isArray(parsed.conversation)) setConversation(parsed.conversation);
          setAutosaveStatus('saved');
        }
      }
    } catch (e) {
      console.warn('Failed to load draft:', e);
    }
  }, [draftStorageKey]);

  // Adjust textarea on content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [journalContent, adjustTextareaHeight]);

  // Autosave to localStorage debounced
  useEffect(() => {
    if (!journalContent.trim() && !topicTitle.trim()) {
      setAutosaveStatus('idle');
      return;
    }

    setAutosaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            topicTitle,
            journalContent,
            category,
            tags,
            entryDate,
            conversation,
            savedAt: Date.now()
          })
        );
        setAutosaveStatus('saved');
      } catch (e) {
        console.warn('Autosave error:', e);
        setAutosaveStatus('idle');
      }
    }, 700);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [topicTitle, journalContent, category, tags, entryDate, conversation, draftStorageKey]);

  // Scroll companion chat into view
  useEffect(() => {
    if (isCompanionOpen) {
      companionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, isSendingToSmriti, isCompanionOpen]);

  // Add a tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Word count & estimate read time
  const wordCount = journalContent.trim() ? journalContent.trim().split(/\s+/).length : 0;
  const readTimeMinutes = Math.max(1, Math.round(wordCount / 180));

  // Multi-turn dialogue with Smriti
  const handleSendToSmriti = async (messageToSend?: string) => {
    const text = (messageToSend || reflectionInput).trim();
    if (!text && !journalContent.trim()) return;

    setError(null);
    setIsCompanionOpen(true);
    setIsSendingToSmriti(true);

    const promptText = text || 'Reflect on what I have written so far and offer a gentle inquiry.';

    const userMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now()
    };

    const newHistory = [...conversation, userMsg];
    setConversation(newHistory);
    setReflectionInput('');

    try {
      // Include current journal content if conversation has not yet included it
      const combinedHistoryPayload = newHistory.map((m) => ({
        role: m.role,
        content: m.content
      }));

      // If this is the first turn and journal has text, send journal content as context
      const effectiveMessage =
        conversation.length === 0 && journalContent.trim()
          ? `Journal Entry:\n"${journalContent.trim()}"\n\nQuestion/Thought:\n${promptText}`
          : promptText;

      const res = await sendMemoryChatMessage(
        combinedHistoryPayload.slice(0, -1),
        effectiveMessage,
        topicTitle || undefined
      );

      const modelMsg: ConversationMessage = {
        id: `msg-${Date.now()}-model`,
        role: 'model',
        content: res.reply,
        timestamp: Date.now()
      };

      setConversation((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Failed to communicate with Smriti:', err);
      setError(err.message || 'Smriti was unable to pen a reflection. Please try again.');
    } finally {
      setIsSendingToSmriti(false);
    }
  };

  // Crystallize / Synthesize entry for full review spread
  const handleCrystallize = async () => {
    if (!journalContent.trim() && conversation.length === 0) {
      setError('Please write your reflection on the journal page before distilling.');
      return;
    }

    setError(null);
    setIsSynthesizing(true);

    try {
      // Construct rich conversation history for synthesis
      const historyPayload: Array<{ role: 'user' | 'model'; content: string }> = [];

      if (journalContent.trim()) {
        historyPayload.push({
          role: 'user',
          content: `Journal Reflection:\n${journalContent.trim()}`
        });
      }

      conversation.forEach((msg) => {
        historyPayload.push({
          role: msg.role,
          content: msg.content
        });
      });

      const res = await synthesizeMemory(historyPayload, `Category: ${category}. Tags: ${tags.join(', ')}`);
      
      const draftWithDefaults: StructuredMemoryDraft = {
        title: topicTitle.trim() || res.summary.title || 'Untitled Journal Reflection',
        approximateDate: entryDate,
        category: category || res.summary.category || 'Personal',
        whatHappened: res.summary.whatHappened || journalContent,
        importantContext: res.summary.importantContext || '',
        goalsOrDecisions: res.summary.goalsOrDecisions || '',
        whatChanged: res.summary.whatChanged || '',
        whatRemainsUnclear: res.summary.whatRemainsUnclear || '',
        keyLessons: res.summary.keyLessons?.length ? res.summary.keyLessons : [],
        tags: Array.from(new Set([...tags, ...(res.summary.tags || [])]))
      };

      setSynthesizedDraft(draftWithDefaults);
      if (!topicTitle.trim() && draftWithDefaults.title) {
        setTopicTitle(draftWithDefaults.title);
      }
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setError(err.message || 'Could not distill reflection spread. You can still save directly.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Direct Save or Commit Synthesized Spread to Firestore
  const handleSaveReflection = async () => {
    if (!journalContent.trim() && conversation.length === 0 && !synthesizedDraft) {
      setError('Please write your reflection before saving.');
      return;
    }

    setError(null);
    setIsSaving(true);
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      let memoryToSave: Partial<Memory>;

      if (synthesizedDraft) {
        // Saving the distilled spread
        memoryToSave = {
          id: memoryId,
          userId,
          title: synthesizedDraft.title.trim() || topicTitle.trim() || 'Untitled Journal Entry',
          approximateDate: synthesizedDraft.approximateDate || entryDate,
          category: synthesizedDraft.category || category,
          whatHappened: synthesizedDraft.whatHappened || journalContent,
          importantContext: synthesizedDraft.importantContext || '',
          goalsOrDecisions: synthesizedDraft.goalsOrDecisions || '',
          whatChanged: synthesizedDraft.whatChanged || '',
          whatRemainsUnclear: synthesizedDraft.whatRemainsUnclear || '',
          keyLessons: synthesizedDraft.keyLessons || [],
          tags: synthesizedDraft.tags?.length ? synthesizedDraft.tags : tags,
          conversation,
          userNotes: journalContent,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      } else {
        // Direct save: synthesize smoothly in background if possible, or save with pristine structure
        let summary: StructuredMemoryDraft | null = null;
        try {
          const historyPayload: Array<{ role: 'user' | 'model'; content: string }> = [];
          if (journalContent.trim()) {
            historyPayload.push({ role: 'user', content: journalContent.trim() });
          }
          conversation.forEach((msg) => historyPayload.push({ role: msg.role, content: msg.content }));
          
          const synthRes = await synthesizeMemory(historyPayload);
          summary = synthRes.summary;
        } catch (synthErr) {
          console.warn('Silent synthesis fallback to direct journal payload:', synthErr);
        }

        memoryToSave = {
          id: memoryId,
          userId,
          title: topicTitle.trim() || summary?.title || 'Journal Reflection',
          approximateDate: entryDate,
          category,
          whatHappened: summary?.whatHappened || journalContent,
          importantContext: summary?.importantContext || '',
          goalsOrDecisions: summary?.goalsOrDecisions || '',
          whatChanged: summary?.whatChanged || '',
          whatRemainsUnclear: summary?.whatRemainsUnclear || '',
          keyLessons: summary?.keyLessons || [],
          tags: Array.from(new Set([...tags, ...(summary?.tags || [])])),
          conversation,
          userNotes: journalContent,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      }

      await saveUserMemory(userId, memoryId, memoryToSave);

      // Clear local draft upon successful save
      try {
        localStorage.removeItem(draftStorageKey);
      } catch (e) {
        // ignore
      }

      onMemorySaved(memoryId);
    } catch (err: any) {
      console.error('Failed to save to Firestore:', err);
      setError(err.message || 'Could not preserve memory to your vault. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between pb-6 mb-8 border-b border-[#E8E1D5] gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[#DFD7CB] bg-white px-3.5 py-1.5 text-xs font-medium text-[#645647] hover:bg-[#F5F0E6] transition-colors cursor-pointer"
          >
            ← Return to Journey
          </button>

          {/* Subtle Autosave Status Pill */}
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-[#FAF6EE] border border-[#E9E1D1] px-2.5 py-1 text-[11px] text-[#786A5A]">
            {autosaveStatus === 'saving' ? (
              <>
                <div className="h-1.5 w-1.5 rounded-full bg-[#C5A059] animate-pulse"></div>
                <span className="font-serif italic">Saving draft...</span>
              </>
            ) : autosaveStatus === 'saved' ? (
              <>
                <Check className="h-3 w-3 text-[#2C6E49]" />
                <span className="font-serif italic text-[#475C4E]">Draft saved</span>
              </>
            ) : (
              <span className="font-serif italic text-[#8E8071]">Private journal sheet</span>
            )}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center space-x-2.5">
          {!synthesizedDraft && (
            <button
              onClick={handleCrystallize}
              disabled={isSynthesizing || isSaving || (!journalContent.trim() && conversation.length === 0)}
              id="crystallize-draft-btn"
              title="Distill into structured two-page reflection spread"
              className="hidden sm:inline-flex items-center space-x-1.5 rounded-xl border border-[#D5CAB8] bg-white px-3.5 py-2 text-xs font-semibold text-[#544637] hover:bg-[#F7F3EA] transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
              <span>{isSynthesizing ? 'Distilling...' : 'Review Spread'}</span>
            </button>
          )}

          <button
            onClick={handleSaveReflection}
            disabled={isSaving || isSynthesizing || (!journalContent.trim() && conversation.length === 0 && !synthesizedDraft)}
            id="save-reflection-btn"
            className="inline-flex items-center space-x-2 rounded-2xl bg-[#1E3A2F] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#FAF8F5] shadow-xs hover:bg-[#284E3F] transition-all disabled:opacity-40 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 text-[#E6C594]" />
            <span>{isSaving ? 'Preserving...' : 'Save Reflection'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center space-x-2.5 rounded-2xl bg-[#FDF4F4] border border-[#F0D5D8] p-4 text-xs text-[#823B47] shadow-2xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#A34757]" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Journal Page Canvas or Synthesized Spread Mode */}
      {!synthesizedDraft ? (
        <div className="space-y-8">
          {/* THE REAL PERSONAL JOURNAL PAGE */}
          <div className="journal-paper-sheet rounded-3xl border border-[#E7E0D3] p-6 sm:p-10 lg:p-12 relative overflow-hidden transition-shadow">
            {/* Authentic Journal Header: Date, Scribe Badge & Ruled Line Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4D6] pb-5 mb-7">
              {/* Natural Date Display with Inline Edit */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-[#A35C42]" />
                {isCustomDateOpen ? (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      placeholder="e.g. October 14, 2024"
                      className="rounded-lg border border-[#D5C9B7] bg-white px-2.5 py-1 text-xs font-serif text-[#2C241D] focus:outline-none focus:border-[#1E3A2F]"
                    />
                    <button
                      onClick={() => setIsCustomDateOpen(false)}
                      className="rounded-lg bg-[#EFE9DF] p-1 text-xs text-[#524434] hover:bg-[#E4DDD0]"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCustomDateOpen(true)}
                    title="Click to adjust entry date"
                    className="group flex items-center space-x-1.5 font-serif text-sm sm:text-base font-semibold text-[#3D332A] hover:text-[#1E3A2F] transition-colors cursor-pointer"
                  >
                    <span>{entryDate}</span>
                    <span className="text-[10px] text-[#A89F93] group-hover:text-[#1E3A2F] font-sans font-normal ml-1">
                      (change)
                    </span>
                  </button>
                )}
              </div>

              {/* Right Side Tools: Ruled Lines & Feather Stamp */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setRuledLinesEnabled(!ruledLinesEnabled)}
                  title={ruledLinesEnabled ? 'Hide ruled lines' : 'Show ruled lines'}
                  className="flex items-center space-x-1 text-[11px] text-[#8C7F70] hover:text-[#2C241D] px-2 py-1 rounded-lg hover:bg-[#F2ECE1] transition-colors cursor-pointer"
                >
                  <AlignLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">{ruledLinesEnabled ? 'Ruled lines' : 'Blank page'}</span>
                </button>

                <div className="inline-flex items-center space-x-1.5 rounded-full bg-[#EBF2EC] px-3 py-1 text-xs font-medium text-[#244237] border border-[#D5E4D8]">
                  <Feather className="h-3 w-3 text-[#3B6652]" />
                  <span>Personal Journal</span>
                </div>
              </div>
            </div>

            {/* Category Selector Styled Peacefully as Earthy Pills */}
            <div className="mb-6 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7D6F] mr-2">
                  Category:
                </span>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E3A2F] text-[#FAF8F5] font-semibold shadow-2xs'
                          : 'bg-white/80 border border-[#E2D8C9] text-[#635547] hover:bg-[#F5EFE4]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Entry Title */}
            <div className="mb-6">
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="Give this reflection a title (optional)..."
                className="w-full font-serif text-2xl sm:text-3xl font-bold text-[#222E26] placeholder:text-[#A89F93] placeholder:font-normal bg-transparent border-b border-dashed border-[#DDD5C7] pb-2 focus:border-[#1E3A2F] focus:outline-none transition-colors"
              />
            </div>

            {/* Inspiration prompts if the page is currently empty */}
            {!journalContent.trim() && conversation.length === 0 && (
              <div className="mb-6 rounded-2xl bg-[#FAF6EE] border border-[#EAE1D2] p-4 text-xs text-[#635546]">
                <div className="flex items-center space-x-2 font-serif font-bold text-[#3D332A] mb-2">
                  <PenTool className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>Prompts for your pen:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setJournalContent(`Reflecting on: ${prompt}...\n\n`);
                        if (!topicTitle) setTopicTitle(prompt);
                      }}
                      className="rounded-xl border border-[#DFD6C8] bg-white px-2.5 py-1 text-[11px] text-[#5D5144] hover:bg-[#F6F1E8] hover:border-[#C5BBAA] transition-colors cursor-pointer"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* THE LARGE EXPANDABLE WRITING CANVAS */}
            <div className="relative journal-margin-line pl-4 sm:pl-7">
              <textarea
                ref={textareaRef}
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSaveReflection();
                  }
                }}
                placeholder="What happened, what were you feeling, and what mattered most about this moment? Write your thoughts here freely..."
                className={`w-full min-h-[340px] bg-transparent font-serif text-[17px] sm:text-[18px] text-[#2C241D] placeholder:text-[#A89F93] placeholder:font-sans placeholder:text-sm focus:outline-none resize-none overflow-hidden ${
                  ruledLinesEnabled ? 'journal-ruled-bg' : 'leading-[32px]'
                }`}
              />
            </div>

            {/* Journal Page Footer: Word Count, Reading Time & Tags */}
            <div className="mt-6 pt-5 border-t border-[#EDE4D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Tags Section */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7D6F] flex items-center space-x-1 mr-1">
                  <TagIcon className="h-3 w-3 text-[#A35C42]" />
                  <span>Tags:</span>
                </span>

                {tags.map((t) => (
                  <span
                    key={t}
                    className="group inline-flex items-center space-x-1 rounded-lg bg-[#FAF5F2] px-2.5 py-0.5 text-xs font-medium text-[#684C3D] border border-[#E9DDD4]"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#9E8274] hover:text-[#8C3A46] transition-colors ml-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}

                {isAddingTag ? (
                  <div className="inline-flex items-center space-x-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        } else if (e.key === 'Escape') {
                          setIsAddingTag(false);
                        }
                      }}
                      autoFocus
                      placeholder="tag name..."
                      className="w-20 rounded-md border border-[#D5CAB9] bg-white px-2 py-0.5 text-xs text-[#2C241D] focus:outline-none focus:border-[#1E3A2F]"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="rounded-md bg-[#1E3A2F] p-1 text-white hover:bg-[#284E3F]"
                    >
                      <Check className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="inline-flex items-center space-x-1 rounded-lg border border-dashed border-[#CFBEAA] bg-white/60 px-2 py-0.5 text-xs font-medium text-[#7A6B5B] hover:bg-white hover:border-[#1E3A2F] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>tag</span>
                  </button>
                )}
              </div>

              {/* Word Count and Subtle Shortcut */}
              <div className="flex items-center space-x-3 text-xs text-[#8A7D6F] font-serif">
                <span>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
                <span>•</span>
                <span>~{readTimeMinutes} min reflection</span>
              </div>
            </div>
          </div>

          {/* SMRITI REFLECTIVE COMPANION (Expandable Margins) */}
          <div className="rounded-3xl border border-[#E8DFD3] bg-white/80 p-6 sm:p-8 shadow-2xs backdrop-blur-xs transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#EBF2EC] flex items-center justify-center text-[#244237] border border-[#D3E3D6]">
                  <Sparkles className="h-4 w-4 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#222E26]">
                    Reflect with Smriti
                  </h3>
                  <p className="text-xs text-[#736556] font-serif italic">
                    Invite a gentle, thoughtful inquiry to explore your motivations deeper.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCompanionOpen(!isCompanionOpen)}
                className="flex items-center space-x-1.5 rounded-xl border border-[#DFD6C8] bg-[#FAF8F5] px-3.5 py-1.5 text-xs font-medium text-[#5D5043] hover:bg-[#F2ECE1] transition-colors cursor-pointer"
              >
                <span>{isCompanionOpen ? 'Hide Inquiries' : 'Open Dialogue'}</span>
                {isCompanionOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Expanded Companion Dialogue Stream */}
            {isCompanionOpen && (
              <div className="mt-6 pt-6 border-t border-[#EFE8DC] space-y-5">
                {conversation.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAF7F0] border border-[#EAE1D2] p-5 text-center text-xs text-[#6F604F]">
                    <p className="font-serif italic text-sm mb-3 text-[#3E3328]">
                      "Every memory has layers beneath the surface."
                    </p>
                    <p className="mb-4 text-[#756655]">
                      Ask Smriti to reflect on what you just wrote, or pose a question about this chapter.
                    </p>
                    <button
                      type="button"
                      disabled={isSendingToSmriti || !journalContent.trim()}
                      onClick={() => handleSendToSmriti('What question should I ask myself about this decision?')}
                      className="inline-flex items-center space-x-2 rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-[#FAF8F5] hover:bg-[#284E3F] disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#E6C594]" />
                      <span>{isSendingToSmriti ? 'Reflecting...' : 'Ask Smriti for an Inquiry'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversation.map((msg, index) => {
                      const isUser = msg.role === 'user';
                      const label = REFLECTION_TITLES[index % REFLECTION_TITLES.length];

                      return (
                        <div key={msg.id}>
                          {isUser ? (
                            <div className="rounded-2xl bg-[#FAF8F5] border border-[#E9E1D3] p-4 text-xs text-[#2C241D] font-serif shadow-2xs">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C7E6E] mb-1">
                                Your Note
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                          ) : (
                            <div className="rounded-2xl bg-[#F4F7F4] border border-[#D5E3D8] p-4 sm:p-5 text-xs text-[#1E3A2F] shadow-2xs">
                              <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2E5844] mb-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                                <span>{label}</span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed font-serif text-[13px] sm:text-sm">
                                {msg.content}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isSendingToSmriti && (
                      <div className="rounded-2xl bg-[#FAF7F0] border border-[#EAE1D2] p-4 text-xs text-[#6F6151] flex items-center space-x-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1E3A2F] border-t-transparent"></div>
                        <span className="font-serif italic">Smriti is quietly penning a thought...</span>
                      </div>
                    )}

                    <div ref={companionEndRef} />
                  </div>
                )}

                {/* Companion Reply Input */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="text"
                    value={reflectionInput}
                    onChange={(e) => setReflectionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendToSmriti();
                      }
                    }}
                    placeholder="Ask Smriti a follow-up or reply to the inquiry..."
                    disabled={isSendingToSmriti}
                    className="flex-1 rounded-xl border border-[#DFD6C7] bg-white px-3.5 py-2 text-xs text-[#2D261F] placeholder:text-[#9F9384] focus:outline-none focus:border-[#1E3A2F]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendToSmriti()}
                    disabled={isSendingToSmriti || !reflectionInput.trim()}
                    className="rounded-xl bg-[#1E3A2F] p-2 text-[#FAF8F5] hover:bg-[#284E3F] disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Send className="h-4 w-4 text-[#E6C594]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Synthesized Structured Journal Spread Mode */
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#CDE0D1] bg-[#F2F7F3] p-4 text-xs text-[#204533] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#2C6E49] shrink-0" />
              <span>
                Your thoughts have crystallized into a structured journal spread. Review and fine-tune your chapter before saving.
              </span>
            </div>
            <button
              onClick={() => setSynthesizedDraft(null)}
              className="text-xs font-medium text-[#4D6355] underline hover:text-[#1E3A2F] ml-4 shrink-0 cursor-pointer"
            >
              Continue writing on paper
            </button>
          </div>

          {/* The Open Journal Spread */}
          <div className="paper-card-warm rounded-3xl p-6 sm:p-10 shadow-sm border border-[#E8E1D5] relative">
            {/* Header: Title & Meta */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE4D8] pb-6 mb-8">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A7C6E] mb-1">
                  Journal Entry Title
                </label>
                <input
                  type="text"
                  value={synthesizedDraft.title}
                  onChange={(e) =>
                    setSynthesizedDraft({ ...synthesizedDraft, title: e.target.value })
                  }
                  className="w-full font-serif text-2xl sm:text-3xl font-bold text-[#222E26] border-b border-dashed border-[#D2C8B8] focus:border-[#1E3A2F] focus:outline-none pb-1 bg-transparent"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A7C6E] mb-1">
                    Category
                  </label>
                  <select
                    value={synthesizedDraft.category}
                    onChange={(e) =>
                      setSynthesizedDraft({ ...synthesizedDraft, category: e.target.value })
                    }
                    className="rounded-xl border border-[#D5CAB9] bg-white px-3 py-1.5 text-xs font-medium text-[#3E3328] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A7C6E] mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={synthesizedDraft.approximateDate}
                    onChange={(e) =>
                      setSynthesizedDraft({ ...synthesizedDraft, approximateDate: e.target.value })
                    }
                    className="rounded-xl border border-[#D5CAB9] bg-white px-3 py-1.5 text-xs text-[#3E3328] focus:outline-none font-serif"
                  />
                </div>
              </div>
            </div>

            {/* Two-Column Journal Spread */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {/* Left Spread */}
              <div className="space-y-5">
                {/* 1. What Happened */}
                <div className="rounded-2xl border border-[#E8E1D5] bg-white p-5 shadow-2xs">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#685A4C] mb-2 flex items-center space-x-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#A35C42]" />
                    <span>1. What Happened</span>
                  </h4>
                  <textarea
                    rows={4}
                    value={synthesizedDraft.whatHappened}
                    onChange={(e) =>
                      setSynthesizedDraft({ ...synthesizedDraft, whatHappened: e.target.value })
                    }
                    className="w-full text-[#2D251D] bg-transparent text-xs leading-relaxed focus:outline-none resize-y"
                  />
                </div>

                {/* 2. Important Context */}
                <div className="rounded-2xl border border-[#E8E1D5] bg-white p-5 shadow-2xs">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#685A4C] mb-2 flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#8C6D38]" />
                    <span>2. Important Context</span>
                  </h4>
                  <textarea
                    rows={4}
                    value={synthesizedDraft.importantContext}
                    onChange={(e) =>
                      setSynthesizedDraft({ ...synthesizedDraft, importantContext: e.target.value })
                    }
                    className="w-full text-[#2D251D] bg-transparent text-xs leading-relaxed focus:outline-none resize-y"
                  />
                </div>

                {/* 3. Goals or Decisions */}
                <div className="rounded-2xl border border-[#D3E0D6] bg-[#F4F7F4] p-5 shadow-2xs">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#244237] mb-2 flex items-center space-x-1.5">
                    <Compass className="h-3.5 w-3.5 text-[#2C6E49]" />
                    <span>3. Goals or Decisions Involved</span>
                  </h4>
                  <textarea
                    rows={3}
                    value={synthesizedDraft.goalsOrDecisions}
                    onChange={(e) =>
                      setSynthesizedDraft({ ...synthesizedDraft, goalsOrDecisions: e.target.value })
                    }
                    className="w-full text-[#1A3328] bg-transparent text-xs leading-relaxed font-semibold focus:outline-none resize-y"
                  />
                </div>
              </div>

              {/* Right Spread */}
              <div className="space-y-5">
                {/* 4. What Changed */}
                <div className="rounded-2xl border border-[#EFE5D1] bg-[#FAF7EF] p-5 shadow-2xs">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#8A6324] mb-2 flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                    <span>4. What Changed (Mindset Inflection)</span>
                  </h4>
                  <textarea
                    rows={3}
                    value={synthesizedDraft.whatChanged}
                    onChange={(e) =>
                      setSynthesizedDraft({ ...synthesizedDraft, whatChanged: e.target.value })
                    }
                    className="w-full text-[#382813] bg-transparent text-xs leading-relaxed font-medium focus:outline-none resize-y"
                  />
                </div>

                {/* 5. What Remains Unclear */}
                <div className="rounded-2xl border border-[#F0DFDF] bg-[#FAF5F5] p-5 shadow-2xs">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#7A3641] mb-2 flex items-center space-x-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-[#A34757]" />
                    <span>5. What Remains Unclear</span>
                  </h4>
                  <textarea
                    rows={3}
                    value={synthesizedDraft.whatRemainsUnclear}
                    onChange={(e) =>
                      setSynthesizedDraft({ ...synthesizedDraft, whatRemainsUnclear: e.target.value })
                    }
                    className="w-full text-[#4E242B] bg-transparent text-xs leading-relaxed focus:outline-none resize-y"
                  />
                </div>

                {/* 6. Key Lessons */}
                <div className="rounded-2xl border border-[#E8E1D5] bg-white p-5 shadow-2xs">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#685A4C] mb-2">
                    Key Lessons & Insights
                  </h4>
                  <ul className="space-y-2 text-xs text-[#42372B]">
                    {synthesizedDraft.keyLessons?.map((lesson, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-[#C5A059] font-bold">•</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {synthesizedDraft.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-[#EFE9DF] px-2.5 py-1 text-[11px] font-medium text-[#5B4E41] border border-[#E2D8CA]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Commit to Personal Timeline */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE4D8] pt-6">
              <button
                onClick={() => setSynthesizedDraft(null)}
                className="rounded-xl border border-[#D5CAB9] bg-white px-4 py-2.5 text-xs font-medium text-[#5B4F42] hover:bg-[#F7F3EA] transition-colors cursor-pointer"
              >
                ← Return to Writing
              </button>

              <button
                onClick={handleSaveReflection}
                disabled={isSaving}
                id="save-crystallized-btn"
                className="flex items-center space-x-2.5 rounded-2xl bg-[#1E3A2F] px-7 py-3 text-xs sm:text-sm font-semibold text-[#FAF8F5] shadow-sm hover:bg-[#284E3F] disabled:opacity-50 transition-all cursor-pointer"
              >
                <Save className="h-4 w-4 text-[#E6C594]" />
                <span>{isSaving ? 'Preserving in Private Vault...' : 'Save Reflection to Timeline'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
