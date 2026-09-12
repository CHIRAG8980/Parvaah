'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Map,
  Bell,
  CloudRain,
  FileText,
  Database,
  UsersRound,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

// Custom perspective road icon matching the reference image
const RoadIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M4 19L9 5" />
    <path d="M20 19L15 5" />
    <path d="M12 6V8" />
    <path d="M12 12V14" />
    <path d="M12 18V20" />
  </svg>
);

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Risk Map', href: '/risk-map', icon: Map },
  { name: 'Alerts', href: '/alerts', icon: Bell, badge: 12 },
  { name: 'Road & Infrastructure', href: '/roads', icon: RoadIcon },
  { name: 'Weather & Forecast', href: '/forecast', icon: CloudRain },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Data Sources', href: '/data-sources', icon: Database },
  { name: 'Users & Access', href: '/users', icon: UsersRound },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 bg-black/35 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-280 ease-premium ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sidebar Container: Fixed left 100vh, 256px expanded / 76px collapsed */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen bg-[#F6FAFE] border-r border-[#DDE5F0] flex flex-col justify-between overflow-hidden select-none transition-all duration-280 ease-premium lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          } ${isCollapsed ? 'w-[76px]' : 'w-[256px]'}`}
      >
        {/* =========================================================================
            1. TOP BRAND HEADER & INTERACTIVE NAVIGATION AREA
            Clean, professional light background (#F6FAFE).
            Compact vertical spacing so the mountain panel has ample breathing room.
            ========================================================================= */}
        <div className="flex-shrink-0 flex flex-col bg-[#F6FAFE] z-10">
          {/* Brand Header */}
          <div
            className={`flex items-center justify-between flex-shrink-0 transition-all duration-280 ease-premium ${isCollapsed ? 'pt-4 pb-2 px-3 justify-center' : 'pt-4 pb-2.5 px-3.5'
              }`}
          >
            {/* Logo & Brand Details */}
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-95 transition-opacity min-w-0"
              title="Parvaah - Landslide Risk Monitoring"
            >
              {/* App Icon */}
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

              {/* Text label with smooth fade & slide */}
              <div
                className={`flex flex-col min-w-0 transition-all duration-200 ease-premium ${isCollapsed
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

            {/* Top-Right Action: Collapse / Expand Button */}
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

              {/* Mobile Close Button */}
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

          {/* If collapsed, show the expand toggle centered underneath logo */}
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

          {/* Navigation Items */}
          <nav
            className={`py-1 space-y-0.5 flex-shrink-0 transition-all duration-280 ease-premium ${isCollapsed ? 'px-2' : 'px-2.5'
              }`}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  title={isCollapsed ? item.name : undefined}
                  className={`group relative flex items-center h-[40px] rounded-xl text-[13px] transition-all duration-150 ease-premium motion-btn ${isCollapsed ? 'justify-center px-0 w-full' : 'justify-between px-3'
                    } ${isActive
                      ? 'bg-[#DCEBFC] text-[#1476E8] font-semibold'
                      : 'text-[#243B5B] hover:text-[#10284A] hover:bg-white/80 font-medium'
                    }`}
                >
                  {/* Active Left Indicator Bar */}
                  {isActive && (
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 bg-[#1476E8] rounded-r-[3px] transition-all duration-200 ease-premium ${isCollapsed ? 'w-[3px] h-[24px]' : 'w-[4px] h-[26px]'
                        }`}
                      aria-hidden="true"
                    />
                  )}

                  <div className="flex items-center min-w-0">
                    <Icon
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${isActive
                          ? item.name === 'Dashboard'
                            ? 'text-[#1476E8] fill-[#1476E8]'
                            : 'text-[#1476E8]'
                          : 'text-[#405875] group-hover:text-[#10284A]'
                        }`}
                    />

                    {/* Label and inline badge in expanded mode */}
                    <div
                      className={`flex items-center justify-between min-w-0 transition-all duration-200 ease-premium ${isCollapsed
                          ? 'opacity-0 max-w-0 -translate-x-1.5 pointer-events-none overflow-hidden'
                          : 'opacity-100 max-w-[180px] translate-x-0 ml-2.5 flex-1'
                        }`}
                    >
                      <span className="truncate tracking-normal whitespace-nowrap">{item.name}</span>
                    </div>
                  </div>

                  {/* Badges */}
                  {!isCollapsed && item.badge && (
                    <span className="w-5 h-5 text-[11px] font-bold rounded-full bg-[#FF3B3B] text-white flex items-center justify-center flex-shrink-0 shadow-2xs transition-all duration-180">
                      {item.badge}
                    </span>
                  )}

                  {isCollapsed && item.badge && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 text-[9px] font-bold rounded-full bg-[#FF3B3B] text-white flex items-center justify-center shadow-2xs transition-all duration-180">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* =========================================================================
            2. INTEGRATED FULL-WIDTH MOUNTAIN LANDSCAPE PANEL
            Flows directly below Settings with ample height.
            Peak tip is positioned ~16px below Settings.
            The dark atmospheric navy gradient and compact mission statement sit at
            the bottom over the dark forest, leaving the peak and valleys fully visible.
            ========================================================================= */}
        <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-end min-h-[190px]">
          {/* Realistic Himalayan Mountain Landscape */}
          <div
            className="absolute inset-x-0 -top-[52px] bottom-0 bg-cover bg-[position:center_top] bg-no-repeat transition-transform duration-280 ease-premium"
            style={{
              backgroundImage: 'url(/images/sidebar-mountain.jpg)',
            }}
          />

          {/* Top Smooth Sky Gradient: Seamlessly dissolves into the #F6FAFE navigation area */}
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#F6FAFE] via-[#F6FAFE]/40 to-transparent pointer-events-none z-1" />

          {/* Bottom Atmospheric Navy Gradient: Anchored at bottom over pine trees */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#051932]/95 via-[#051932]/60 to-transparent pointer-events-none z-1" />

          {/* Bottom Mission Message (Compact, positioned over dark base) */}
          <div
            className={`relative z-10 px-4 pb-4 pt-1 text-white mt-auto select-none transition-all duration-200 ease-premium ${isCollapsed
                ? 'opacity-0 max-h-0 pointer-events-none overflow-hidden'
                : 'opacity-100 max-h-40'
              }`}
          >
            {/* Blue horizontal accent line */}
            <div className="w-10 h-[3px] bg-[#1683FF] rounded-full mb-2 shadow-xs" />

            <h4 className="text-[15px] font-bold leading-tight tracking-tight text-white drop-shadow-sm">
              Safer Hills
            </h4>
            <h4 className="text-[15px] font-bold leading-tight tracking-tight text-white mb-1.5 drop-shadow-sm">
              Stronger Communities
            </h4>
            <p className="text-[10.5px] text-[#BFD0E6] leading-snug font-normal drop-shadow-xs">
              Early Warning. Faster Action.
            </p>
            <p className="text-[10.5px] text-[#BFD0E6] leading-snug font-normal drop-shadow-xs">
              A Safer North East.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
