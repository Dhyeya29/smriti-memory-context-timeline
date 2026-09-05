import React from 'react';
import {
  BookOpen,
  PenLine,
  Sparkles,
  GitCompare,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  ExternalLink,
  Feather
} from 'lucide-react';
import type { AuthenticatedUser } from '../types';
import { isInIframe } from '../firebase';

export type ActiveTab = 'timeline' | 'record' | 'recovery' | 'then-vs-now';

interface NavbarProps {
  user: AuthenticatedUser | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSignOut: () => void;
  memoryCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSignOut,
  memoryCount
}) => {
  const inIframe = isInIframe();

  const handleOpenNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E8E2D8] bg-[#FAF8F5]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('timeline')}
            className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
            id="brand-logo-btn"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1E3A2F] text-[#FAF8F5] shadow-xs group-hover:bg-[#284C3E] transition-colors">
              <Feather className="h-5 w-5 text-[#E6C594]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-xl font-bold tracking-tight text-[#243329]">Smriti</span>
                <span className="rounded-full bg-[#EFE9DF] px-2 py-0.5 text-[10px] font-medium text-[#6A5E52] border border-[#DFD6C9]">
                  Personal Journal
                </span>
              </div>
              <p className="text-[11px] text-[#7E7468] hidden sm:block font-serif italic">Memories, Decisions & Why They Mattered</p>
            </div>
          </button>
        </div>

        {/* Authenticated navigation controls */}
        {user ? (
          <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-[#F2EDE4] p-1 rounded-2xl border border-[#E4DCD0]">
            <button
              onClick={() => setActiveTab('timeline')}
              id="nav-timeline-btn"
              className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'timeline'
                  ? 'bg-[#1E3A2F] text-[#FAF8F5] shadow-2xs font-semibold'
                  : 'text-[#64584C] hover:text-[#243329] hover:bg-[#EAE3D6]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>My Timeline</span>
              {memoryCount > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === 'timeline' ? 'bg-[#2E5444] text-[#E7DFD5]' : 'bg-[#E3D9CC] text-[#554A3E]'
                }`}>
                  {memoryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('record')}
              id="nav-record-btn"
              className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'record'
                  ? 'bg-[#A35C42] text-white shadow-2xs font-semibold'
                  : 'text-[#64584C] hover:text-[#243329] hover:bg-[#EAE3D6]'
              }`}
            >
              <PenLine className="h-3.5 w-3.5" />
              <span>Write</span>
            </button>

            <button
              onClick={() => setActiveTab('recovery')}
              id="nav-recovery-btn"
              className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'recovery'
                  ? 'bg-[#1E3A2F] text-[#FAF8F5] shadow-2xs font-semibold'
                  : 'text-[#64584C] hover:text-[#243329] hover:bg-[#EAE3D6]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#E6C594]" />
              <span>Recover Context</span>
            </button>

            <button
              onClick={() => setActiveTab('then-vs-now')}
              id="nav-compare-btn"
              className={`flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'then-vs-now'
                  ? 'bg-[#1E3A2F] text-[#FAF8F5] shadow-2xs font-semibold'
                  : 'text-[#64584C] hover:text-[#243329] hover:bg-[#EAE3D6]'
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Then & Now</span>
            </button>
          </nav>
        ) : null}

        {/* User profile & preview controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {inIframe && (
            <button
              onClick={handleOpenNewTab}
              id="navbar-open-tab-btn"
              title="Open Smriti in a separate browser tab"
              className="inline-flex items-center space-x-1.5 rounded-xl border border-[#DED6C9] bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-medium text-[#5E5244] shadow-2xs hover:bg-[#F7F3EB] hover:text-[#2B231B] transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#8C8072]" />
              <span className="hidden sm:inline">Open Tab</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-3 border-l border-[#E2D9CD] pl-3">
              <div className="hidden text-right md:block">
                <p className="text-xs font-semibold text-[#2D261F] leading-tight">
                  {user.displayName || 'Journal Keeper'}
                </p>
                <div className="flex items-center justify-end space-x-1 text-[10px] text-[#2C6E49] font-medium">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Private to you</span>
                </div>
              </div>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-8 w-8 rounded-full border border-[#D5CABA] object-cover shadow-2xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAE2D5] text-[#55493C]">
                  <UserIcon className="h-4 w-4" />
                </div>
              )}

              <button
                onClick={onSignOut}
                id="sign-out-btn"
                title="Sign out of Smriti"
                className="rounded-xl p-2 text-[#7C7063] hover:bg-[#EFE9DF] hover:text-[#2D261F] transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-xs text-[#2C6E49] font-medium bg-[#EEF5F0] px-2.5 py-1 rounded-full border border-[#D3E4D7]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Private to you</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

