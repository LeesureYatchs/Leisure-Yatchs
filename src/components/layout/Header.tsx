import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/yachts', label: 'Our Yachts' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ];

  const isHomePage = location.pathname === '/';

  return (
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
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <img 
                src="/leisureyatch.png" 
                alt="LeisureYatchs" 
                loading="eager"
                fetchPriority="high"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-110" 
              />
            </div>
            <span className={cn(
              'text-2xl font-bold tracking-tight transition-colors',
              isScrolled || !isHomePage ? 'text-primary' : 'text-white'
            )}>
              LeisureYatchs
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location.pathname === link.href
                    ? isScrolled || !isHomePage ? 'text-primary' : 'text-white'
                    : isScrolled || !isHomePage ? 'text-muted-foreground' : 'text-white/80'
                )}
              >
                {link.label}
              </Link>
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
              <Link to="/yachts">Book Now</Link>
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
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary',
                    location.pathname === link.href
                      ? 'text-primary bg-secondary'
                      : 'text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-4 pt-2">
                <Button asChild className="w-full">
                  <Link to="/yachts" onClick={() => setIsMobileMenuOpen(false)}>
                    Book Now
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
