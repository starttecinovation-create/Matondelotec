'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

type LogoVariant = 'default' | 'partner';

interface LogoProps {
    isWhite?: boolean;
    className?: string;
    variant?: LogoVariant;
}

export function Logo({ className, variant = 'default', isWhite = false }: LogoProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  const shouldBeWhite = isHomePage || isWhite;

  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
       <svg
         viewBox="0 0 100 100"
         fill="none"
         xmlns="http://www.w3.org/2000/svg"
         className={cn("shrink-0", isHomePage ? "w-[72px] h-[72px]" : "w-12 h-12")}
       >
        <defs>
          <linearGradient id="matondelo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9A03F" />
            <stop offset="100%" stopColor="#EB4A24" />
          </linearGradient>
        </defs>
        <path 
          d="M 28 90 A 20 20 0 0 1 8 70 L 8 40 C 8 15, 34 12, 50 36 C 66 12, 92 15, 92 40 L 92 70 A 20 20 0 0 1 72 90"
          stroke={shouldBeWhite ? "white" : "url(#matondelo-gradient)"}
          strokeWidth="16"
          strokeLinecap="butt"
          strokeLinejoin="round" 
        />
        <path 
          d="M 28 62 L 50 80 L 72 62"
          stroke={shouldBeWhite ? "white" : "url(#matondelo-gradient)"}
          strokeWidth="16"
          strokeLinecap="butt"
          strokeLinejoin="round" 
        />
       </svg>
       <span className={cn("font-extrabold font-sans tracking-tight", isHomePage ? 'text-5xl' : 'text-3xl', shouldBeWhite ? 'text-white' : 'bg-gradient-to-br from-[#F9A03F] to-[#EB4A24] text-transparent bg-clip-text')}>
         {variant === 'partner' ? 'Partner' : 'Matondelo'}
       </span>
    </Link>
  );
}
