'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('parvaah_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('parvaah_sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage access errors
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-[#0F1F3D] flex flex-col antialiased">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content Layout - smoothly covers the sidebar area when collapsed to expand full screen */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-280 ease-premium ${isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[256px]'
          }`}
      >
        {/* Sticky Top Control Room Header */}
        <TopHeader />

        {/* Dashboard Main Workspace with subtle page-level transition */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-6 max-w-[1720px] w-full mx-auto motion-page-enter">
          {children}
        </main>
      </div>
    </div>
  );
};
