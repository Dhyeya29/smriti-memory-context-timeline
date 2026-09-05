import React from 'react';

interface SmritiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  orientation?: 'horizontal' | 'vertical';
  subtitle?: string;
  className?: string;
}

/**
 * Smriti Brand Logo
 * 
 * Concept:
 * - Represents memory, journaling, reflection and a life journey.
 * - Combines an open journal folio contour with a flowing memory path and a delicate leaf sprout.
 * - Deep forest green (#1E3A2F) as primary page wing.
 * - Warm earthy brown (#684E38) as secondary page wing.
 * - Muted gold (#C5A059) flowing memory path of life chapters.
 * - Subtle dusty rose (#D48D99) heart accent node.
 */
export const SmritiLogoSymbol: React.FC<{
  sizePx?: number;
  className?: string;
}> = ({ sizePx = 40, className = '' }) => {
  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Smriti Logo Symbol"
    >
      {/* Background Soft Ambient Glow */}
      <circle cx="32" cy="32" r="30" fill="#FAF6EE" />
      <circle cx="32" cy="32" r="29.5" stroke="#EAE0D0" strokeWidth="1" />

      {/* Left Folio Page (Deep Forest Green - Represents Rooted Memories & Grounding) */}
      <path
        d="M32 50C26.5 48 18 45 15.5 32C13.5 21.5 20.5 16 28 14.5C29.8 17.5 31.2 22 32 29V50Z"
        fill="#1E3A2F"
      />

      {/* Right Folio Page (Warm Earthy Brown - Represents Lived Experience & Earth) */}
      <path
        d="M32 50C37.5 48 46 45 48.5 32C50.5 21.5 43.5 16 36 14.5C34.2 17.5 32.8 22 32 29V50Z"
        fill="#684E38"
        fillOpacity="0.9"
      />

      {/* Subtle Page Crease Highlight */}
      <path
        d="M32 14V50"
        stroke="#FDFBF7"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      {/* Flowing Memory Path (Muted Gold - Represents the Winding Journey of Time) */}
      <path
        d="M32 48C30.5 43 27 38 27.5 31C28 24 33.5 22 33 16C32.7 13 32 11 32 9"
        stroke="#C5A059"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Delicate Life Sprout / Leaf at Apex (Growth & Reflection) */}
      <path
        d="M32 9C34 6.5 37.5 6 39 8C39.5 10 38 13.5 32 15C32 12.5 32 10.5 32 9Z"
        fill="#2A5240"
      />
      <path
        d="M32 11C30.5 8.5 27.5 8 26.5 9.5C26 11 27 13.5 32 15Z"
        fill="#426F5A"
      />

      {/* Subtle Dusty Rose Heart Reflection Node */}
      <circle cx="32" cy="23" r="1.6" fill="#D48D99" />
      <circle cx="32.5" cy="15.5" r="1.2" fill="#EAD5BA" />
    </svg>
  );
};

export const SmritiLogo: React.FC<SmritiLogoProps> = ({
  size = 'md',
  showWordmark = true,
  orientation = 'horizontal',
  subtitle,
  className = ''
}) => {
  const sizeMap = {
    sm: { iconPx: 34, titleClass: 'text-lg', subClass: 'text-[10px]' },
    md: { iconPx: 42, titleClass: 'text-xl', subClass: 'text-[11px]' },
    lg: { iconPx: 54, titleClass: 'text-2xl', subClass: 'text-xs' },
    xl: { iconPx: 68, titleClass: 'text-3xl sm:text-4xl', subClass: 'text-xs sm:text-sm' }
  };

  const { iconPx, titleClass, subClass } = sizeMap[size];

  return (
    <div
      className={`flex ${
        orientation === 'vertical'
          ? 'flex-col items-center text-center'
          : 'items-center space-x-3 text-left'
      } ${className}`}
    >
      {/* Brand Icon Mark */}
      <div className="relative group flex items-center justify-center">
        <SmritiLogoSymbol sizePx={iconPx} />
      </div>

      {/* Wordmark & Subtitle */}
      {showWordmark && (
        <div className={orientation === 'vertical' ? 'mt-3' : ''}>
          <div className="flex items-center space-x-2">
            <span
              className={`font-serif font-bold tracking-tight text-[#222E26] ${titleClass}`}
            >
              Smriti
            </span>
            {subtitle ? (
              <span className="rounded-full bg-[#EFE9DF] px-2 py-0.5 text-[10px] font-medium text-[#6A5E52] border border-[#DFD6C9]">
                {subtitle}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
export default SmritiLogo;
