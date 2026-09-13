'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { SidebarNav } from './SidebarNav';
import { SidebarLandscapePanel } from './SidebarLandscapePanel';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/35 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-280 ease-premium ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen bg-[#F6FAFE] border-r border-[#DDE5F0] flex flex-col justify-between overflow-hidden select-none transition-all duration-280 ease-premium lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${isCollapsed ? 'w-[76px]' : 'w-[256px]'}`}
      >
        <div className="flex-shrink-0 flex flex-col bg-[#F6FAFE] z-10">
          <div
            className={`flex items-center justify-between flex-shrink-0 transition-all duration-280 ease-premium ${
              isCollapsed ? 'pt-4 pb-2 px-3 justify-center' : 'pt-4 pb-2.5 px-3.5'
            }`}
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-95 transition-opacity min-w-0"
              title="Parvaah - Landslide Risk Monitoring"
            >
              <div className="relative flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden border border-[#1E3A5F]/20 shadow-xs bg-white transition-transform duration-180 ease-premium hover:scale-[1.02]">
                <Image
                  src="/images/logo.png"
                  alt="Parvaah Logo"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>

              <div
                className={`flex flex-col min-w-0 transition-all duration-200 ease-premium ${
                  isCollapsed
                    ? 'opacity-0 max-w-0 -translate-x-2 pointer-events-none overflow-hidden'
                    : 'opacity-100 max-w-[170px] translate-x-0'
                }`}
              >
                <span className="text-[19px] font-bold text-[#10284A] tracking-tight leading-tight whitespace-nowrap">
                  Parvaah
                </span>
                <span className="text-[11px] font-medium text-[#6B82A3] tracking-tight leading-none mt-0.5 truncate">
                  Landslide Risk Monitoring
                </span>
              </div>
            </Link>

            <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'flex'}`}>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="w-8 h-8 rounded-lg bg-[#EFF5FC] hover:bg-[#E2EEFC] active:scale-[0.95] text-[#415A7D] hover:text-[#10284A] border border-[#D2E2F2] flex items-center justify-center transition-all duration-150 ease-premium shadow-2xs group cursor-pointer"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <ChevronsLeft className="w-4 h-4 stroke-[2.2] group-hover:-translate-x-0.5 transition-transform duration-150 ease-premium" />
                </button>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="lg:hidden p-1.5 rounded-lg text-[#536B8F] hover:bg-slate-200/60 hover:text-[#0F1F3D] active:scale-[0.95] transition-all duration-150"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {isCollapsed && onToggleCollapse && (
            <div className="flex justify-center pt-1 pb-1">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg bg-[#EFF5FC] hover:bg-[#E2EEFC] active:scale-[0.95] text-[#415A7D] hover:text-[#10284A] border border-[#D2E2F2] flex items-center justify-center transition-all duration-150 ease-premium shadow-2xs group cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronsRight className="w-4 h-4 stroke-[2.2] group-hover:translate-x-0.5 transition-transform duration-150 ease-premium" />
              </button>
            </div>
          )}

          <SidebarNav isCollapsed={isCollapsed} onClose={onClose} />
        </div>

        <SidebarLandscapePanel isCollapsed={isCollapsed} />
      </aside>
    </>
  );
};
