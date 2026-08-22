'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User, LayoutDashboard, Settings, ShoppingBag, Bell, CalendarCheck, ShieldCheck, FileText, Megaphone, Crown, DollarSign, BarChart, Menu, Handshake, UserPlus } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { usePartner } from '../context/partner-context'; // Import the new context hook


const navLinks = [
  { href: '/partner/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/partner/crm', label: 'CRM Inteligente', icon: Handshake },
  { href: '/partner/services', label: 'Serviços', icon: ShoppingBag },
  { href: '/partner/bookings', label: 'Reservas', icon: CalendarCheck },
  { href: '/partner/subscription', label: 'Subscrição', icon: Crown },
  { href: '/partner/referrals', label: 'Afiliados', icon: Handshake },
];

const adminLinks = [
    { href: '/partner/admin/analytics', label: 'Análise', icon: BarChart },
    { href: '/partner/admin/announcements', label: 'Anúncios', icon: Megaphone },
    { href: '/partner/admin', label: 'Verificações', icon: ShieldCheck },
    { href: '/partner/admin/register-driver', label: 'Registar Motorista', icon: UserPlus },
    { href: '/partner/content', label: 'Conteúdo', icon: FileText },
    { href: '/partner/settings/monetization', label: 'Monetização', icon: DollarSign },
];

export function PartnerHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { isAdmin } = usePartner(); // Use the context to get isAdmin status

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const finalNavLinks = isAdmin ? [...navLinks, ...adminLinks] : navLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Logo variant="partner" />
          <nav className="hidden md:flex items-center gap-4">
            {finalNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary',
                  pathname.startsWith(link.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                     {user?.displayName?.charAt(0).toUpperCase() || 'P'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.displayName || 'Parceiro'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/partner/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil do Negócio</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                 <Link href="#">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Definições</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

           <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle className="sr-only">Partner Menu</SheetTitle>
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Logo variant="partner" />
                {finalNavLinks.map(link => (
                   <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                       pathname.startsWith(link.href) && "text-primary bg-muted"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
