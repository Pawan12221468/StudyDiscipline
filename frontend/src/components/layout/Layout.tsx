import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useStudyReminders } from '../../hooks/useStudyReminders';
import { X } from 'lucide-react';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useDocumentTitle();
  useStudyReminders();

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#ebe2d3] text-slate-800 antialiased overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:pl-4 lg:pr-8 pt-1 pb-5 flex flex-col min-h-0">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
        </main>

        {/* Mobile Navigation bar */}
        <MobileNav />
      </div>
    </div>
  );
};
