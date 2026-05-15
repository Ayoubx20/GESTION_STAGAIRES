import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Close mobile menu on resize to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // 1024 is 'lg' in tailwind
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Decorative animated background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/20 dark:bg-primary-600/10 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-float" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[40%] bg-purple-400/20 dark:bg-purple-600/10 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-float" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full mix-blend-multiply blur-3xl opacity-70 animate-float" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
        
        {/* Dot grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar wrapper */}
      <div 
        className={`
          fixed lg:relative top-0 left-0 z-50 transform 
          lg:translate-x-0 lg:z-10 h-screen
          transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar setMobileMenuOpen={setMobileMenuOpen} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden z-10 relative backdrop-blur-sm">
        <Navbar setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;