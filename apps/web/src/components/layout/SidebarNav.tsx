'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

interface SidebarNavProps {
  isCollapsed: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

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

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Risk Map', href: '/risk-map', icon: Map },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Road & Infrastructure', href: '/roads', icon: RoadIcon },
  { name: 'Weather & Forecast', href: '/forecast', icon: CloudRain },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Data Sources', href: '/data-sources', icon: Database },
  { name: 'Users & Access', href: '/users', icon: UsersRound },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ isCollapsed, onClose }) => {
  const pathname = usePathname();

  return (
    <nav
      className={`py-1 space-y-0.5 flex-shrink-0 transition-all duration-280 ease-premium ${
        isCollapsed ? 'px-2' : 'px-2.5'
      }`}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => {
              if (onClose) onClose();
            }}
            title={isCollapsed ? item.name : undefined}
            className={`group relative flex items-center h-[40px] rounded-xl text-[13px] transition-all duration-150 ease-premium motion-btn ${
              isCollapsed ? 'justify-center px-0 w-full' : 'justify-between px-3'
            } ${
              isActive
                ? 'bg-[#DCEBFC] text-[#1476E8] font-semibold'
                : 'text-[#243B5B] hover:text-[#10284A] hover:bg-white/80 font-medium'
            }`}
          >
            {isActive && (
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 bg-[#1476E8] rounded-r-[3px] transition-all duration-200 ease-premium ${
                  isCollapsed ? 'w-[3px] h-[24px]' : 'w-[4px] h-[26px]'
                }`}
                aria-hidden="true"
              />
            )}

            <div className="flex items-center min-w-0">
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${
                  isActive
                    ? item.name === 'Dashboard'
                      ? 'text-[#1476E8] fill-[#1476E8]'
                      : 'text-[#1476E8]'
                    : 'text-[#405875] group-hover:text-[#10284A]'
                }`}
              />

              <div
                className={`flex items-center justify-between min-w-0 transition-all duration-200 ease-premium ${
                  isCollapsed
                    ? 'opacity-0 max-w-0 -translate-x-1.5 pointer-events-none overflow-hidden'
                    : 'opacity-100 max-w-[180px] translate-x-0 ml-2.5 flex-1'
                }`}
              >
                <span className="truncate tracking-normal whitespace-nowrap">{item.name}</span>
              </div>
            </div>

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
  );
};
