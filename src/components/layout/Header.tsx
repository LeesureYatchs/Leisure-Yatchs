import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ShipLoader from '@/components/ui/ShipLoader';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    if (location.pathname === path) return;
    setIsMobileMenuOpen(false);
    setIsNavigating(true);
    setTimeout(() => {
      navigate(path);
      setIsNavigating(false);
    }, 800);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/yachts', label: 'Our Yachts' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ];

  const isHomePage = location.pathname === '/';

  return (
    <>
      {isNavigating && (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center">
          <ShipLoader />
        </div>
      )}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled || !isHomePage
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div 
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <img 
                  src="/leisureyatch.png" 
                  alt="LeisureYatchs" 
                  loading="eager"
                  // @ts-expect-error fetchpriority is a valid attribute but not in React types yet
                  fetchpriority="high"
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-110" 
                />
              </div>
              <span className={cn(
                'text-2xl font-bold tracking-tight transition-colors',
                isScrolled || !isHomePage ? 'text-primary' : 'text-white'
              )}>
                LeisureYatchs
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  onClick={() => handleNavigation(link.href)}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary cursor-pointer',
                    location.pathname === link.href
                      ? isScrolled || !isHomePage ? 'text-primary' : 'text-white'
                      : isScrolled || !isHomePage ? 'text-muted-foreground' : 'text-white/80'
                  )}
                >
                  {link.label}
                </div>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="hidden md:block">
              <Button
                asChild
                className={cn(
                  'transition-all',
                  isScrolled || !isHomePage
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-white text-primary hover:bg-white/90'
                )}
              >
                <div onClick={() => handleNavigation('/yachts')} className="cursor-pointer">
                  Book Now
                </div>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className={cn(
                  'w-6 h-6',
                  isScrolled || !isHomePage ? 'text-foreground' : 'text-white'
                )} />
              ) : (
                <Menu className={cn(
                  'w-6 h-6',
                  isScrolled || !isHomePage ? 'text-foreground' : 'text-white'
                )} />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white rounded-lg shadow-lg mt-2 py-4 animate-fade-in">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <div
                    key={link.href}
                    onClick={() => handleNavigation(link.href)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary cursor-pointer',
                      location.pathname === link.href
                        ? 'text-primary bg-secondary'
                        : 'text-foreground'
                    )}
                  >
                    {link.label}
                  </div>
                ))}
                <div className="px-4 pt-2">
                  <Button asChild className="w-full">
                    <div onClick={() => handleNavigation('/yachts')} className="cursor-pointer">
                      Book Now
                    </div>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
