import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  // Close mobile menu on resize to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    const scrollContainer = document.getElementById('main-content');
    if (!scrollContainer) return undefined;
    let previousScrollTop = scrollContainer.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;
      if (currentScrollTop <= 0) {
        setShowBackToTop(false);
      } else if (currentScrollTop < previousScrollTop) {
        setShowBackToTop(true);
      } else if (currentScrollTop > previousScrollTop) {
        setShowBackToTop(false);
      }
      previousScrollTop = currentScrollTop;
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* Decorative background (stays behind everything) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/10 rounded-full blur-3xl opacity-50 animate-float" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-3xl opacity-50 animate-float" style={{ animationDuration: '10s' }}></div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-[70] w-72 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar setMobileMenuOpen={setMobileMenuOpen} collapsed={false} />
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className={`hidden lg:flex lg:flex-shrink-0 z-20 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar setMobileMenuOpen={setMobileMenuOpen} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10 relative">
        <Navbar setMobileMenuOpen={setMobileMenuOpen} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Retour en haut de la page"
          title="Retour en haut"
          className="fixed bottom-6 right-6 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:scale-110 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-900"
        >
          <ArrowUpIcon className="h-5 w-5" />
        </button>
      )}

    </div>
  );
};

export default Layout;
