import { Link } from 'react-router-dom';
import { Anchor, MapPin, Phone, Mail, Instagram, Facebook, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
              <img src="/leisureyatch.png" alt="Leisure Yacht" className="h-10 w-auto object-contain" />
              <span className="text-2xl font-bold">Leisure Yacht</span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed">
              Experience luxury yacht rentals in Dubai. Discover the Arabian Gulf 
              with our premium fleet of yachts and exceptional service.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/60 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/60 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/yachts" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Our Yachts
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/70 hover:text-primary transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Contact
                </Link>
              </li>

            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              <li className="text-white/70 text-sm">Private Yacht Charters</li>
              <li className="text-white/70 text-sm">Corporate Events</li>
              <li className="text-white/70 text-sm">Sunset Cruises</li>
              <li className="text-white/70 text-sm">Fishing Trips</li>
              <li className="text-white/70 text-sm">Celebration Packages</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">
                  Dubai Marina, Dubai, UAE
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a href="tel:+971545706788" className="text-white/70 text-sm hover:text-primary transition-colors">
                  +971 54 570 6788
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a href="mailto:info.leisureyatchs@gmail.com" className="text-white/70 text-sm hover:text-primary transition-colors">
                  info.leisureyatchs@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} The Leisure Yacht. All rights reserved.
          </p>
          <p className="text-white/50 text-sm">
            Crafted with <span className="text-red-500">♥</span> by{' '}
            <a
              href="https://www.linkedin.com/in/v-manikandan1142"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-primary transition-colors"
            >
              Manikandan V
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
