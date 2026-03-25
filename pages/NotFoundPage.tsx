import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, QrCode, SearchX, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      {/* Visual Element: Glitchy QR Code Container */}
      <div className="relative mb-8 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-surface p-8 rounded-xl border border-primary/20 shadow-2xl">
          <div className="relative">
             <QrCode size={120} className="text-on-surface-secondary opacity-20" />
             <div className="absolute inset-0 flex items-center justify-center">
                <SearchX size={64} className="text-primary animate-bounce-slow" />
             </div>
             
             {/* Decorative "Scanning" Line */}
             <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_15px_rgba(var(--color-primary),0.5)] animate-scan-slow"></div>
          </div>
        </div>
        
        {/* Floating 404 Text */}
        <div className="absolute -top-6 -right-6 bg-accent text-white font-black text-2xl px-4 py-2 rounded-lg rotate-12 shadow-lg select-none">
          404
        </div>
      </div>

      <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-on-surface-secondary bg-clip-text text-transparent">
        Scan Failed!
      </h1>
      
      <p className="text-on-surface-secondary text-lg max-w-md mb-10 leading-relaxed">
        The page you're looking for has either expired, been moved, or never existed in this event loop. 
        <span className="block mt-2 italic text-primary/80">Don't worry, your tickets are safe.</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-focus text-white font-bold py-4 px-8 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25"
        >
          <Home size={20} />
          Go Home
        </button>
        
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 bg-surface hover:bg-background text-on-surface font-bold py-4 px-8 rounded-full border border-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={20} />
          Go Back
        </button>
      </div>

      {/* Background Decorative Circles */}
      <div className="fixed top-1/4 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default NotFoundPage;
