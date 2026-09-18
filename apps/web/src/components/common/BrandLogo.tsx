import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textClasses = {
    sm: 'text-[15px]',
    md: 'text-[17px]',
    lg: 'text-[19px]',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Parvaah Logo Icon */}
      <div className={`relative ${sizeClasses[size]} flex-shrink-0 rounded-xl overflow-hidden shadow-xs border border-[#DCE6F2]/60`}>
        <Image
          src="/images/logo.png"
          alt="Parvaah Logo"
          width={44}
          height={44}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`${textClasses[size]} font-bold text-[#0F2346] tracking-tight leading-tight`}>
            Parvaah
          </span>
          <span className="text-[11px] font-medium text-[#536B8F] tracking-tight leading-none mt-0.5">
            Landslide Risk Monitoring
          </span>
        </div>
      )}
    </div>
  );
};
