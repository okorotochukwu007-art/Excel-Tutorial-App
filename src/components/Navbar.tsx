import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  PlayCircle,
  LayoutDashboard,
  Settings,
  LogOut,
  Shield,
  User,
  MessageCircle,
} from 'lucide-react';
import { Profile } from '../types/academy';
import { SupabaseBackendStatus } from '../services/academyService';

import { PWAInstallButton } from './PWAInstallButton';

export type AppView =
  | 'home'
  | 'curriculum'
  | 'dashboard'
  | 'lesson'
  | 'admin'
  | 'playground'
  | 'shortcuts';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView, sectionId?: string) => void;
  onOpenAuthModal: (initialTab: 'login' | 'register' | 'checkout') => void;
  currentUser: Profile | null;
  supabaseStatus: SupabaseBackendStatus;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuthModal,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = Boolean(currentUser && !currentUser.isDemoSession);
  const isInstructorOkoro =
    currentUser?.email?.toLowerCase() === 'okorotochukwu007@gmail.com' ||
    (currentUser?.role === 'admin' &&
      currentUser?.email?.toLowerCase() === 'okorotochukwu007@gmail.com');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (view: AppView, sectionId?: string) => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    onNavigate(view, sectionId);
  };

  const userInitials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Primary Top Bar following strict 3-Zone Top Bar Contract */}
      <header className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 h-16">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-emerald-700 cursor-pointer"
        >
          Excel to Data Analyst Academy
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 cursor-pointer ${
              currentView === 'home'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            Explore
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('curriculum')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 cursor-pointer ${
              currentView === 'curriculum'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            Curriculum
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('playground')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'playground'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            <span>Formula Playground</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('shortcuts')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
              currentView === 'shortcuts'
                ? 'border-emerald-700 text-slate-900 font-semibold'
                : 'border-transparent'
            }`}
          >
            <span>Shortcuts Coach</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Drills
            </span>
          </button>
          {isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent'
                }`}
              >
                My Learning
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('lesson')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 cursor-pointer ${
                  currentView === 'lesson'
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent'
                }`}
              >
                Classroom
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('admin')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'border-emerald-700 text-slate-900 font-semibold'
                    : 'border-transparent'
                }`}
              >
                <Shield className={`w-3.5 h-3.5 ${isInstructorOkoro ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>Instructor Admin</span>
                {isInstructorOkoro && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Okoro T.
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNavClick('home', 'how-it-works')}
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 border-transparent cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('home', 'project-showcase')}
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 border-transparent cursor-pointer"
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('home', 'about-academy')}
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-5 border-b-2 border-transparent cursor-pointer"
              >
                About
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: User Account Dropdown or Primary Auth CTA */}
        <div className="flex items-center gap-3 shrink-0" ref={dropdownRef}>
          <PWAInstallButton variant="navbar" className="hidden lg:flex" />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/2347080145682?text=Hello%20Lead%20Instructor%20Okoro,%20I%20have%20a%20question%20about%20the%20Excel%20Academy."
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                title="Speak to Lead Instructor Okoro Tochuwku on WhatsApp (07080145682)"
              >
                <MessageCircle className="w-3 h-3 fill-current text-white shrink-0" />
                <span className="hidden sm:inline">Speak to the Instructor</span>
                <span className="sm:hidden font-mono text-[11px]">WhatsApp</span>
              </a>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {userInitials}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[130px] truncate">
                  {currentUser?.fullName}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 text-xs">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="font-bold text-slate-900 truncate">
                      {currentUser?.fullName}
                    </div>
                    <div className="text-slate-500 truncate mt-0.5">
                      {currentUser?.email}
                    </div>
                    <div className="mt-1.5 text-[11px] font-medium text-emerald-800">
                      {isInstructorOkoro
                        ? 'Data Analyst with 4 years of experience in the financial services industry'
                        : 'Enrolled Learner'}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => handleNavClick('dashboard')}
                      className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span>My Learning Dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('lesson')}
                      className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 text-slate-500" />
                      <span>Resume Classroom</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('curriculum')}
                      className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span>Course Syllabus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('admin')}
                      className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className={`w-4 h-4 ${isInstructorOkoro ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span>Instructor Admin Console</span>
                      </div>
                      {isInstructorOkoro && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Okoro T.
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-rose-700 hover:bg-rose-50 font-medium flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="hidden sm:inline-block px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Join for Free
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3">
          <PWAInstallButton variant="banner" className="mb-2" />

          {isAuthenticated && (
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  {userInitials}
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-900">{currentUser?.fullName}</div>
                  <div className="text-slate-500">{currentUser?.email}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-1 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => handleNavClick('home')}
              className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100"
            >
              Explore Academy
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('curriculum')}
              className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100"
            >
              Course Syllabus (Levels 1–6)
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('playground')}
              className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100 flex items-center justify-between"
            >
              <span>Formula Playground</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Live Evaluator
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('shortcuts')}
              className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100 flex items-center justify-between"
            >
              <span>Shortcuts Coach</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                Speed Drills
              </span>
            </button>
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100"
                >
                  My Learning Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('lesson')}
                  className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100"
                >
                  Course Classroom
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('admin')}
                  className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${isInstructorOkoro ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>Instructor Admin Console</span>
                  </div>
                  {isInstructorOkoro && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Okoro T.
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="text-left py-2.5 text-rose-700 font-semibold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNavClick('home', 'how-it-works')}
                  className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100"
                >
                  How It Works
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('home', 'project-showcase')}
                  className="text-left py-2.5 hover:text-slate-900 border-b border-slate-100"
                >
                  Portfolio Projects
                </button>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal('login');
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg text-center"
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal('register');
                    }}
                    className="flex-1 py-2.5 text-xs font-semibold text-white bg-emerald-800 rounded-lg text-center"
                  >
                    Join for Free
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
