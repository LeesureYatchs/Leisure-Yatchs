import { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      
      <a
        href="https://wa.me/971545706788?text=Hello!%20I%20have%20some%20questions%20about%20yacht%20bookings.%20Can%20you%20help%20me%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 group transition-all duration-300 hover:-translate-y-1"
        aria-label="Chat on WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 group-hover:opacity-40 duration-1000"></span>
        <div className="relative bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white p-3.5 rounded-full shadow-xl shadow-green-900/20 hover:shadow-2xl hover:shadow-green-900/40 transition-all duration-300 flex items-center justify-center border-2 border-white/20">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-7 h-7"
          >
            <path d="M12.004 2C6.476 2 2 6.478 2 12.007c0 1.79.475 3.498 1.353 5.013L2.25 21.75l4.897-1.28c1.458.795 3.123 1.254 4.857 1.254h.005c5.526 0 10.003-4.478 10.003-10.006A10.003 10.003 0 0012.004 2zm5.72 13.923c-.238.67-1.385 1.254-1.91 1.298-.44.037-.962.164-3.328-.77-2.613-1.03-4.288-3.71-4.42-3.89-.133-.18-1.066-1.422-1.066-2.712 0-1.29.67-1.923.908-2.185.195-.214.512-.267.818-.267.243 0 .487.013.696.023.22.01.514-.084.808.623.324.77.708 1.884.77 2.022.06.138.01.26-.03.428-.037.168-.22.29-.44.512-.178.18-.387.32-.2.637.568.966 1.506 1.77 2.67 2.277.306.134.58.05.8-.18.267-.28.918-1.065 1.164-1.432.247-.367.5-.304.836-.18.337.125 2.126 1.003 2.49 1.184.365.18.608.267.697.42.088.152.088.887-.148 1.557z" />
          </svg>
        </div>
        
        <span className="absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 whitespace-nowrap pointer-events-none before:content-[''] before:absolute before:top-1/2 before:-right-2 before:-translate-y-1/2 before:border-8 before:border-transparent before:border-l-white">
          cw with us
        </span>
      </a>
    </div>
  );
}
