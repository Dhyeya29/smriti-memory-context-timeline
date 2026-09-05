import React, { useState } from 'react';
import {
  Feather,
  Sparkles,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  GitCompare,
  Lock,
  HelpCircle,
  CheckCircle2,
  BookmarkCheck,
  ExternalLink,
  Copy,
  Check,
  Info,
  PenLine,
  Heart
} from 'lucide-react';
import { isInIframe, firebaseConfig } from '../firebase';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, isLoading, error }) => {
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [hasCopiedDomain, setHasCopiedDomain] = useState(false);
  const inIframe = isInIframe();
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyHostname = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setHasCopiedDomain(true);
      setTimeout(() => setHasCopiedDomain(false), 2500);
    }
  };

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const sampleMemories = [
    {
      title: 'Deciding to leave BigTech to build open-source tools',
      date: 'April 2024',
      category: 'Career',
      categoryColor: 'bg-[#EBF2EC] text-[#244237] border-[#D1E0D4]',
      whatHappened: 'Handed in notice as Senior Staff Engineer after 4 years. Transitioning full-time to independent research and crafting software tools.',
      context: 'Suffering chronic cognitive fatigue and endless meeting sprawl. Had accumulated 14 months of emergency living runway. Spouse supported the experiment.',
      decision: 'Prioritize intellectual sovereignty over equity golden handcuffs. Set strict 12-month runway review milestone.',
      whatChanged: 'Shifted from optimizing for corporate status to high-density creative craft and sovereign schedule.',
      unclear: 'Whether micro-grants and consulting can stabilize baseline revenue before runway dries up.'
    },
    {
      title: 'Paused the weekly newsletter after 18 issues',
      date: 'November 2023',
      category: 'Projects',
      categoryColor: 'bg-[#F9F4EB] text-[#7A5B28] border-[#EADFC7]',
      whatHappened: 'Decided to stop weekly publication despite reaching 3,200 active subscribers.',
      context: 'Felt like a hamster wheel of reactive tech hype curation instead of primary thoughtful work. Was consuming entire Sundays.',
      decision: 'Halt production immediately rather than selling out or producing low-effort summaries.',
      whatChanged: 'Reclaimed 15 hours per weekend; stopped feeling obligated to comment on every fleeting announcement.',
      unclear: 'Will subscribers feel abandoned? Can this audience be reactivated for in-depth longform essays later?'
    },
    {
      title: 'Shift from heavy strength training to zone 2 cardio & mobility',
      date: 'January 2024',
      category: 'Health',
      categoryColor: 'bg-[#F9F1F1] text-[#7D3D47] border-[#EED7D9]',
      whatHappened: 'Replaced powerlifting program with 4x weekly low-heart-rate running and daily spinal mobility routines.',
      context: 'Recurrent lumbar tightness and elevated resting stress from constant high central nervous system loading.',
      decision: 'Reframe fitness definition around 80-year-old longevity metrics rather than gym personal records.',
      whatChanged: 'Energy stabilized throughout the afternoon without mid-day crashes; lumbar stiffness vanished.',
      unclear: 'How much raw strength will be lost long-term, and does it matter for daily functionality?'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2723] selection:bg-[#EBDDC7] selection:text-[#382B1E]">
      {/* Embedded Preview Banner */}
      {inIframe && (
        <aside aria-label="Preview Environment Notice" className="border-b border-[#E8DFC8] bg-[#FDFBF7] px-4 py-2 text-xs text-[#6B5A3C]">
          <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-[#A87932] shrink-0" />
              <span>
                Embedded preview active. If your browser restricts popups or cookies in frames, open in a dedicated tab.
              </span>
            </div>
            <button
              onClick={handleOpenNewTab}
              id="top-banner-open-tab-btn"
              className="inline-flex items-center space-x-1 font-semibold text-[#3D2C17] hover:text-[#1E3A2F] underline underline-offset-2 shrink-0 transition-colors"
            >
              <span>Open App in New Tab</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </aside>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-24 sm:pb-28 border-b border-[#E8E1D5] bg-[#FAF8F5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Subtle status pill */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-[#DCD3C4] bg-[#F2EDE3] px-4 py-1 text-xs font-medium text-[#5F5245] mb-8 shadow-2xs">
            <Feather className="h-3.5 w-3.5 text-[#244237]" />
            <span>A Quiet Sanctuary for Your Life Story</span>
            <span className="text-[#B5A999]">•</span>
            <span>Private to you</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#222E26] max-w-3xl mx-auto leading-[1.18]">
            A private place to preserve memories, decisions and the context behind them.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#6B5E50] max-w-2xl mx-auto font-serif italic leading-relaxed">
            Smriti helps you remember not just what happened, but why it mattered.
          </p>

          {/* Action CTA */}
          <div className="mt-10 flex flex-col items-center justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3.5">
            <button
              onClick={onSignIn}
              disabled={isLoading}
              id="hero-sign-in-btn"
              className="group relative flex items-center justify-center space-x-3 rounded-2xl bg-[#1E3A2F] px-8 py-4 text-base font-semibold text-[#FAF8F5] shadow-sm hover:bg-[#274B3C] transition-all focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-75 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2.5">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E5DAC8] border-t-transparent"></div>
                  <span>Opening Your Journal...</span>
                </div>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                  <ArrowRight className="h-4 w-4 text-[#D8C7B0] group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button
              onClick={handleOpenNewTab}
              id="hero-open-tab-btn"
              title="Open Smriti in a dedicated browser tab for full native window authentication"
              className="inline-flex items-center space-x-2 rounded-2xl border border-[#DED6C8] bg-white px-5 py-4 text-sm font-semibold text-[#5A4E40] shadow-2xs hover:bg-[#F8F5EE] transition-colors focus:outline-none"
            >
              <ExternalLink className="h-4 w-4 text-[#8C8072]" />
              <span>Open in New Tab</span>
            </button>
          </div>

          {/* Privacy reassurance */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-[#7A6E5F]">
            <ShieldCheck className="h-4 w-4 text-[#2C6E49]" />
            <span>Private & confidential • Encrypted vault • Your reflections remain strictly yours</span>
          </div>

          {error && (
            <div className="mt-6 max-w-xl mx-auto rounded-2xl border border-[#E9C8C8] bg-[#FBF1F1] p-4 text-left shadow-2xs text-[#7D3D47]">
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-[#F5D8D8] p-1 text-[#8C3A46] shrink-0 mt-0.5">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-[#57222B]">Sign-In Assistance</p>
                  <p className="mt-1 text-[#7A3641] leading-relaxed">{error}</p>

                  {error.includes('Domain unauthorized') && currentHostname && (
                    <div className="mt-3 rounded-xl border border-[#E4BCBC] bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] text-[#55473E] font-medium">Domain to authorize in Firebase Console:</div>
                        <button
                          onClick={handleCopyHostname}
                          className="inline-flex items-center space-x-1 rounded-lg bg-[#1E3A2F] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#2B5242] shrink-0"
                        >
                          {hasCopiedDomain ? (
                            <>
                              <Check className="h-3 w-3 text-[#A3E0BA]" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Domain</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="truncate font-mono text-[11px] text-[#2C241D] bg-[#F8F5EE] px-2 py-1 rounded">
                        {currentHostname}
                      </div>
                      {firebaseConfig.authDomain && (
                        <p className="text-[10px] text-[#85786A]">
                          OAuth Callback URL: <code className="font-mono text-[#524538]">https://{firebaseConfig.authDomain}/__/auth/handler</code>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleOpenNewTab}
                      id="error-open-tab-btn"
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-[#1E3A2F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2B5242] transition-colors shadow-2xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open in Separate Tab</span>
                    </button>
                    <span className="text-[11px] text-[#874550]">
                      Resolves iframe sandbox cookie & popup blocks instantly.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Journal Philosophy: Three Pillars */}
      <section className="py-16 sm:py-24 border-b border-[#E8E1D5] bg-[#F7F4EE]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A35C42]">The Journaling Philosophy</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#243329] mt-1.5">
              Why traditional notes lose their soul
            </h2>
            <p className="mt-4 text-base text-[#6B5E50] leading-relaxed">
              Standard note apps save cold bullet points. Calendars save meeting slots. Neither captures your doubts, what was at stake, or what you were willing to sacrifice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-[#E3DCCF] bg-[#FFFFFF] p-7 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-[#F3ECE0] flex items-center justify-center text-[#8C6026] mb-5">
                <PenLine className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#243329]">1. Gentle Dialogue</h3>
              <p className="mt-2.5 text-xs text-[#6B5E50] leading-relaxed">
                Rather than facing an intimidating blank page, Smriti asks gentle reflective questions about your mindset, dismissed alternatives, and feelings in the moment.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E3DCCF] bg-[#FFFFFF] p-7 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-[#E8F0EA] flex items-center justify-center text-[#244237] mb-5">
                <BookmarkCheck className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#243329]">2. Elegant Synthesis</h3>
              <p className="mt-2.5 text-xs text-[#6B5E50] leading-relaxed">
                Your thoughts are distilled into a warm journal spread: What Happened, Context, Decisions, What Changed, and What Remains Unclear.
              </p>
            </div>

            <div className="rounded-3xl border border-[#E3DCCF] bg-[#FFFFFF] p-7 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-[#F6EEEC] flex items-center justify-center text-[#8E4453] mb-5">
                <GitCompare className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#243329]">3. Looking Back</h3>
              <p className="mt-2.5 text-xs text-[#6B5E50] leading-relaxed">
                Ask <em>"Why did I walk away from that path?"</em> or place two journal entries side-by-side in <strong>Then & Now</strong> to see how much you have grown.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sample Memory Card Preview (Book spread) */}
      <section className="py-16 sm:py-24 bg-[#FAF8F5] border-b border-[#E8E1D5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A35C42]">
                A Look Inside
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#243329] mt-1">
                A Smriti Journal Entry
              </h2>
            </div>

            {/* Category tabs */}
            <div className="flex items-center space-x-2">
              {sampleMemories.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSampleIndex(idx)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                    activeSampleIndex === idx
                      ? 'bg-[#1E3A2F] text-[#FAF8F5] shadow-2xs font-semibold'
                      : 'bg-[#EFE9DF] text-[#635749] hover:bg-[#E5DDD0]'
                  }`}
                >
                  {m.category}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Paper Journal Card */}
          <div className="rounded-3xl border border-[#E5DFD4] bg-[#FFFFFF] p-6 sm:p-9 shadow-sm relative">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE9DF] pb-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-medium border ${sampleMemories[activeSampleIndex].categoryColor}`}>
                  {sampleMemories[activeSampleIndex].category}
                </span>
                <span className="text-xs text-[#82776A] font-serif italic">
                  {sampleMemories[activeSampleIndex].date}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-medium text-[#244237] bg-[#EEF5F0] px-3 py-1 rounded-full border border-[#D5E6DA]">
                <Sparkles className="h-3 w-3 text-[#C5A059]" />
                <span>Reflective Summary</span>
              </div>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#222E26] mt-5">
              {sampleMemories[activeSampleIndex].title}
            </h3>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#ECE6DB]">
                  <h4 className="font-serif text-xs font-bold text-[#574B3E] uppercase tracking-wider">What Happened</h4>
                  <p className="mt-1.5 text-xs text-[#3D342B] leading-relaxed">
                    {sampleMemories[activeSampleIndex].whatHappened}
                  </p>
                </div>

                <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#ECE6DB]">
                  <h4 className="font-serif text-xs font-bold text-[#574B3E] uppercase tracking-wider">Important Context</h4>
                  <p className="mt-1.5 text-xs text-[#3D342B] leading-relaxed">
                    {sampleMemories[activeSampleIndex].context}
                  </p>
                </div>

                <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#ECE6DB]">
                  <h4 className="font-serif text-xs font-bold text-[#574B3E] uppercase tracking-wider">Goals or Decisions</h4>
                  <p className="mt-1.5 text-xs text-[#243329] leading-relaxed font-semibold">
                    {sampleMemories[activeSampleIndex].decision}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#FAF6EE] rounded-2xl p-4 border border-[#E9DFCE]">
                  <h4 className="font-serif text-xs font-bold text-[#805822] uppercase tracking-wider">What Changed</h4>
                  <p className="mt-1.5 text-xs text-[#443828] leading-relaxed">
                    {sampleMemories[activeSampleIndex].whatChanged}
                  </p>
                </div>

                <div className="bg-[#FAF5F5] rounded-2xl p-4 border border-[#EEDFDF]">
                  <h4 className="font-serif text-xs font-bold text-[#7A3641] uppercase tracking-wider">What Remains Unclear</h4>
                  <p className="mt-1.5 text-xs text-[#523238] leading-relaxed">
                    {sampleMemories[activeSampleIndex].unclear}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Capabilities Callout */}
      <section className="py-16 sm:py-24 bg-[#F5F1E9]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#1E3A2F] p-8 sm:p-12 text-[#FAF8F5] shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center space-x-2 rounded-full bg-[#2A4D3F] px-3.5 py-1 text-xs text-[#E6C594] font-medium mb-6">
                <Feather className="h-3.5 w-3.5" />
                <span>Private & Grounded In Your Words</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Revisit your reasoning whenever you need clarity.
              </h2>

              <p className="mt-4 text-sm sm:text-base text-[#D4E4D9] leading-relaxed font-serif italic">
                Life moves quickly, and our memory naturally smooths over past trade-offs. Smriti keeps your authentic, unvarnished intentions safe so you can look back with compassion and insight.
              </p>

              <div className="mt-8 space-y-3 text-xs sm:text-sm text-[#E6EFE9]">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <span><strong>Look Back & Recover Context:</strong> Ask natural questions like <em>"Why did I step away from that collaboration?"</em></span>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-4 w-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <span><strong>Then & Now:</strong> Compare any two journal entries side-by-side to appreciate your trajectory and mindset shifts.</span>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <button
                  onClick={onSignIn}
                  disabled={isLoading}
                  id="cta-sign-in-btn"
                  className="rounded-2xl bg-[#E6C594] px-7 py-3.5 text-xs sm:text-sm font-bold text-[#1E3A2F] shadow-sm hover:bg-[#F2D7AE] transition-colors cursor-pointer"
                >
                  Begin Your Private Journal
                </button>
                <button
                  onClick={handleOpenNewTab}
                  id="cta-open-tab-btn"
                  className="rounded-2xl border border-[#3E6554] bg-[#244739] px-5 py-3.5 text-xs sm:text-sm font-medium text-[#E6EFE9] hover:bg-[#2D5645] transition-colors inline-flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4 text-[#C5A059]" />
                  <span>Open in Separate Tab</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E1D5] bg-[#FAF8F5] py-8 text-center text-xs text-[#827668]">
        <p className="font-serif italic">Smriti • A Quiet Private Journal for Your Life Story</p>
      </footer>
    </div>
  );
};
