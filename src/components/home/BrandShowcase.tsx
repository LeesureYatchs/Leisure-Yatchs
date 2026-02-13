import React from 'react';

export function BrandShowcase() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Premium background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-accent/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center justify-center">
          <div className="relative group max-w-xl w-full">
            {/* Elegant Logo Container */}
            <div className="relative p-1 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 rounded-[3rem] overflow-hidden">
              <div className="bg-white/90 backdrop-blur-2xl rounded-[2.9rem] p-12 md:p-20 flex flex-col items-center justify-center border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-700 group-hover:shadow-primary/20 group-hover:-translate-y-2">
                <div className="relative flex items-center justify-center">
                  {/* Decorative rotating ring */}
                  <div className="absolute -inset-8 border border-dashed border-primary/20 rounded-full animate-spin-slow group-hover:border-primary/40 transition-colors" />
                  
                  <img 
                    src="/leisureyatch.png" 
                    alt="LeisureYatchs Excellence" 
                    loading="eager"
                    // @ts-expect-error fetchpriority is a valid attribute but not in React types yet
                    fetchpriority="high"
                    className="w-40 md:w-56 h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                <div className="mt-16 text-center space-y-6">
                  <div className="inline-flex items-center gap-4">
                    <div className="h-px w-8 bg-primary/30" />
                    <span className="text-primary font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs">
                      The Gold Standard
                    </span>
                    <div className="h-px w-8 bg-primary/30" />
                  </div>
                  
                  <h3 className="text-2xl md:text-4xl font-light text-slate-800 tracking-tight leading-tight italic">
                    "Where <span className="text-primary font-medium not-italic">Excellence</span> Meets the Ocean"
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
