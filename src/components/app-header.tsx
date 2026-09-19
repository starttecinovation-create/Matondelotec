'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CircleUser, LogOut, User, Bell, ShoppingCart, Menu, CalendarDays, Home, Briefcase, Map, Truck, Car, HeartHandshake, BrainCircuit, Search, ChevronDown, ShoppingBag } from 'lucide-react';

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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth, useUser } from '@/firebase/provider';
import { signOut } from 'firebase/auth';
import { useCart } from '@/context/cart-context';


const navLinks = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/services', label: 'Serviços', icon: Briefcase },
  { href: '/bookings', label: 'Reservas', icon: CalendarDays },
  { href: '/orders', label: 'Encomendas', icon: ShoppingCart },
  { href: '/map', label: 'Tudo Aqui', icon: Search },
  { href: '/taxi', label: 'Táxi', icon: Car },
  { href: '/express', label: 'Deliver', icon: Truck },
  { href: '/kids', label: 'Kids', icon: BrainCircuit },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user } = useUser();
  const { cart, setIsSheetOpen } = useCart();
  const avatarImage = PlaceHolderImages.find(img => img.id === 'avatar-1');

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/');
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary whitespace-nowrap',
                  pathname.startsWith(link.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Dropdown de Produtos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary whitespace-nowrap flex items-center gap-1 focus:outline-none cursor-pointer',
                    pathname.startsWith('/products') ? 'text-primary' : 'text-muted-foreground'
                  )}
                  id="menu-products-trigger"
                >
                  Produtos
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-white border border-neutral-200 shadow-xl rounded-xl p-1.5" align="start">
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-neutral-50 p-2 text-sm text-neutral-700 hover:text-blue-600 transition">
                  <Link href="/products/physical" className="w-full flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                    <span>Físicos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg hover:bg-neutral-50 p-2 text-sm text-neutral-700 hover:text-blue-600 transition">
                  <Link href="/products/digital" className="w-full flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-teal-500" />
                    <span>Digitais</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden sm:flex border-amber-500/30 bg-amber-500/5 text-[#d47a24] hover:bg-amber-500/10 hover:text-[#b4651a] font-bold text-xs gap-1.5 h-9 px-3" asChild>
                <Link href={user ? "/partner/dashboard" : "/login"}>
                    <Briefcase className="h-4 w-4" />
                    Painel Corporativo
                </Link>
            </Button>
           <Button variant="ghost" asChild>
                <Link href="/donations">
                    <HeartHandshake className="mr-2 h-5 w-5" />
                    Doar
                </Link>
            </Button>
           <Button variant="ghost" className="relative h-14 w-14 rounded-full" onClick={() => setIsSheetOpen(true)}>
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
               <span className="sr-only">Abrir carrinho</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    {avatarImage && <AvatarImage src={user?.photoURL || avatarImage.imageUrl} alt="User Avatar" data-ai-hint={avatarImage?.imageHint} />}
                    <AvatarFallback>
                       {user?.displayName?.charAt(0).toUpperCase() || <CircleUser className="h-6 w-6"/>}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName || 'Utilizador'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'utilizador@email.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/partner/dashboard">
                    <Briefcase className="mr-2 h-4 w-4 text-[#d47a24]" />
                    <span className="text-[#d47a24] font-semibold">Painel Corporativo</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link href="/bookings">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span>Minhas Reservas</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                   <Link href="/orders">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    <span>Minhas Encomendas</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                   <Link href="/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notificações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" className="bg-[#F6780A] hover:bg-[#D45500] text-white" asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          )}

           <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col justify-between">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Logo />
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                         pathname.startsWith(link.href) && "text-primary bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
                
                <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                  <div className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Produtos
                  </div>
                  <Link
                    href="/products/physical"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-base",
                      pathname === "/products/physical" && "text-primary bg-muted"
                    )}
                  >
                    <ShoppingBag className="h-5 w-5 text-blue-500" />
                    Físicos
                  </Link>
                  <Link
                    href="/products/digital"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-base",
                      pathname === "/products/digital" && "text-primary bg-muted"
                    )}
                  >
                    <BrainCircuit className="h-5 w-5 text-teal-500" />
                    Digitais
                  </Link>
                </div>
                <div className="border-t border-border pt-4">
                  <Link
                    href={user ? "/partner/dashboard" : "/login"}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[#d47a24] font-semibold transition-all hover:text-[#b4651a] hover:bg-amber-500/5 text-base"
                  >
                    <Briefcase className="h-5 w-5" />
                    Painel Corporativo
                  </Link>
                </div>
              </nav>
              {!user && (
                <div className="flex flex-col gap-2 mt-auto pb-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Entrar</Link>
                  </Button>
                  <Button className="w-full bg-[#F6780A] hover:bg-[#D45500] text-white" asChild>
                    <Link href="/cadastro">Cadastrar</Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Menu horizontal deslizante para ecrãs móveis (mobile scrollable sub-header) */}
      <div className="md:hidden border-t bg-card/95 backdrop-blur-xs overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-2 px-4 flex items-center gap-3 border-b">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-all whitespace-nowrap border',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted bg-muted/40 border-neutral-200'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Barra de Navegação Inferior Fixa para Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-card/95 backdrop-blur-md pb-safe md:hidden flex justify-around items-center px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {[
          { href: '/dashboard', label: 'Início', icon: Home },
          { href: '/services', label: 'Serviços', icon: Briefcase },
          { href: '/taxi', label: 'Táxi', icon: Car },
          { href: '/bookings', label: 'Reservas', icon: CalendarDays },
          { href: '/profile', label: 'Perfil', icon: User },
        ].map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors gap-1',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110 text-primary')} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
