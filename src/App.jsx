import React, { useState, useEffect, useRef } from 'react';
import { Search, Atom, Cpu, Zap, ExternalLink, AlertCircle, ChevronRight, Telescope, FlaskConical, Binary } from 'lucide-react';

// ── Particle canvas background ──────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 90;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(110,220,200,${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(110,220,200,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex flex-col items-center gap-4 py-16">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-2 border-[#6edcc8]/20" />
      <div className="absolute inset-0 rounded-full border-t-2 border-[#6edcc8] animate-spin" />
      <div className="absolute inset-2 rounded-full border-t-2 border-[#f0c060]/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
    </div>
    <p className="text-[#6edcc8]/60 text-sm tracking-[0.2em] uppercase font-mono animate-pulse">
      Crawling the web…
    </p>
  </div>
);

// ── Domain pills ─────────────────────────────────────────────────────────────
const DOMAINS = [
  { label: 'Artificial Intelligence', icon: <Binary size={13} /> },
  { label: 'Quantum Computing', icon: <Atom size={13} /> },
  { label: 'Biotechnology', icon: <FlaskConical size={13} /> },
  { label: 'Space Science', icon: <Telescope size={13} /> },
  { label: 'Nanotechnology', icon: <Zap size={13} /> },
  { label: 'Robotics', icon: <Cpu size={13} /> },
];

// ── Result card ──────────────────────────────────────────────────────────────
const ResultCard = ({ result, index }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="group relative rounded-2xl overflow-hidden"
      style={{
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        style={{ boxShadow: '0 0 0 1px rgba(110,220,200,0.5), 0 8px 32px rgba(110,220,200,0.12)' }} />

      <div className="relative bg-[#0d1a1f]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#6edcc8]/10 border border-[#6edcc8]/20 text-[#6edcc8] text-xs font-mono font-bold">
            {String(index + 1).padStart(2, '0')}
          </span>
          <ExternalLink size={14} className="text-white/20 group-hover:text-[#6edcc8]/60 transition-colors mt-1" />
        </div>

        <h3 className="text-[15px] font-semibold text-white/90 leading-snug mb-3 line-clamp-2">
          <a href={result.link} target="_blank" rel="noopener noreferrer" className="hover:text-[#6edcc8] transition-colors">
            {result.title || result.link}
          </a>
        </h3>

        <p className="text-[13px] text-white/45 leading-relaxed line-clamp-3">
          {result.summary}
        </p>

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6edcc8]" />
          <span className="text-[11px] text-white/30 font-mono tracking-wider truncate">{result.link}</span>
        </div>
      </div>
    </div>
  );
};

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);

  const handleDomainClick = (label) => {
    setQuery(label);
    inputRef.current?.focus();
  };

const handleSearch = async (e) => {
  e?.preventDefault();

  if (!query.trim()) {
    setError('Please enter a search query.');
    return;
  }

  setIsLoading(true);
  setError(null);
  setResults([]);
  setHasSearched(true);

  try {
    const response = await fetch('https://sci-tech-crawler-backend.onrender.com/rankDocuments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error');
    }

    setResults(data.results || []);
  } catch (err) {
    console.error(err);
    setError(err.message || 'Backend connection failed. Make sure Flask server is running.');
  } finally {
    setIsLoading(false);
  }
};
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden" style={{ background: '#060e12' }}>
      <ParticleField />

      <div className="fixed top-[-20vh] left-[-10vw] w-[60vw] h-[60vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(110,220,200,0.055) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-20vh] right-[-10vw] w-[50vw] h-[50vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(240,192,96,0.04) 0%, transparent 70%)' }} />

      <main className="relative z-10 flex flex-col items-center px-4 pb-24">
{/* Header - Option 2 */}
        <header className="w-full max-w-4xl flex flex-col items-center pt-20 pb-12 text-center px-4 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6edcc8,#3a9e90)' }}>
              <Atom size={18} color="#060e12" strokeWidth={2.5} />
            </div>
            <span className="text-white/30 text-xs tracking-[0.35em] uppercase font-mono">Sci-Tech Web Crawler</span>
          </div>
          <h1 className="text-white font-black leading-tight mb-5 select-none w-full"
            style={{ fontSize: 'clamp(1rem, 2.2vw, 1.8rem)', letterSpacing: '0.08em', fontFamily: '"Outfit", sans-serif', textTransform: 'uppercase' }}>
            Deep Scan the{' '}
            <span style={{ background: 'linear-gradient(90deg,#6edcc8 0%,#f0c060 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Web
            </span>
          </h1>
          <p className="text-white/35 text-base max-w-md leading-relaxed"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Purpose-built to crawl, rank, and deliver domain-specific intelligence in milliseconds.
          </p>
        </header>
        {/* Search bar */}
        <section className="w-full max-w-2xl mb-8">
          <div
            className="relative flex items-center rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(110,220,200,0.18)',
            }}
          >
            <Search size={17} className="absolute left-5 text-[#6edcc8]/50 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search AI, quantum computing, biotech…"
              className="w-full bg-transparent text-white/85 placeholder-white/20 py-4 pl-12 pr-32 text-[15px] focus:outline-none"
              style={{ fontFamily: '"Outfit", sans-serif' }}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute right-2 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#6edcc8,#3a9e90)',
                color: '#060e12',
                fontFamily: '"Outfit", sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#060e12]/30 border-t-[#060e12] rounded-full animate-spin" />
              ) : (
                <>Search <ChevronRight size={14} /></>
              )}
            </button>
          </div>
        </section>

        {/* Domain pills */}
        {!hasSearched && (
          <section className="flex flex-wrap justify-center gap-2 mb-16 max-w-2xl">
            {DOMAINS.map((d) => (
              <button
                key={d.label}
                onClick={() => handleDomainClick(d.label)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-all duration-200 hover:border-[#6edcc8]/40 hover:text-[#6edcc8] hover:bg-[#6edcc8]/5"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: '"Outfit", sans-serif',
                  letterSpacing: '0.03em',
                }}
              >
                {d.icon} {d.label}
              </button>
            ))}
          </section>
        )}

        {/* Results */}
        <section className="w-full max-w-4xl">
          {isLoading && <Spinner />}

          {error && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/20 rounded-2xl p-5 text-red-300/80 text-sm mb-6">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && hasSearched && results.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/25 text-sm font-mono tracking-wider">NO RESULTS FOUND</p>
              <p className="text-white/15 text-xs mt-2">Try a different search term</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[#6edcc8] text-xs font-mono tracking-[0.2em] uppercase">
                  {results.length} Results
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-white/20 text-xs font-mono">Ranked by TF-IDF</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result, i) => (
                  <ResultCard key={result.link || i} result={result} index={i} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Footer */}
        {!hasSearched && (
          <footer className="mt-24 flex flex-wrap justify-center items-center gap-4 text-white/15 text-xs font-mono tracking-wider">
            <span>TF-IDF ENGINE</span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span>BEAUTIFULSOUP PARSER</span>
            <span className="w-1 h-1 rounded-full bg-white/15" />
            <span>DOMAIN-SPECIFIC CRAWL</span>
          </footer>
        )}
      </main>
    </div>
  );
}

export default App;