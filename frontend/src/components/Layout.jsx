import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
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

      <div className="z-10 relative h-full">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden z-10 relative backdrop-blur-sm">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;