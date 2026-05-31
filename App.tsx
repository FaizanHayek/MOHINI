import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Segment, HistoryItem } from './types';
import Wheel from './components/Wheel';
import { audioService } from './services/audioService';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
}

const SECTORS: Segment[] = [
  { id: 'A', label: 'SHE KISSES YOU', color: '#4d0032', points: 6 },
  { id: 'B', label: 'SHE HUGS YOU TIGHTLY', color: '#002633', points: 2 },
  { id: 'C', label: 'SHE KNEELS DOWN IN FRONT OF YOU AND LOOKS UP', color: '#382a00', points: 8 },
  { id: 'D', label: 'SHE LICKS YOU', color: '#400006', points: 15 },
  { id: 'E', label: 'SHE SLAPS YOU', color: '#13151c', points: -5 },
  { id: 'F', label: 'SHE RUNS AWAY', color: '#0d0d0d', points: -10 },
  { id: 'G', label: 'SHE HAS A BOYFRIEND', color: '#3b1900', points: -3 },
  { id: 'H', label: 'SHE SAYS, "YOUR TOY IS TOO SMALL"', color: '#1a0330', points: -20 },
];

const LEVELS = [
  { threshold: 5, description: "you take Mohini out on a date", label: "LEVEL 1" },
  { threshold: 10, description: "Mohini takes you out on a date", label: "LEVEL 2" },
  { threshold: 20, description: "Mohini makes out with you on a roof top", label: "LEVEL 3" },
  { threshold: 30, description: "You Fukckckc Mohini", label: "LEVEL 4" },
  { threshold: 40, description: "Mohini becomes your Girlfriend", label: "LEVEL 5" },
];

const App: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [subjectName, setSubjectName] = useState('MOHINI');
  const [tempName, setTempName] = useState('');
  const [tempSubjectName, setTempSubjectName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Segment | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(-1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [confettiCount, setConfettiCount] = useState(0);
  const [mohiniFace, setMohiniFace] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [kissesCount, setKissesCount] = useState(0);
  const [hugsCount, setHugsCount] = useState(0);
  const [licksCount, setLicksCount] = useState(0);
  const [rejectionsCount, setRejectionsCount] = useState(0);
  const [countdown, setCountdown] = useState<number | 'SPIN!' | null>(null);
  const [theme, setTheme] = useState<'cyber' | 'valentine'>('cyber');
  const isRomantic = theme === 'valentine';
  const [romanticHearts, setRomanticHearts] = useState<{ id: number; left: number; duration: number; twist: number; angle: number; size: number }[]>([]);
  
  const rotationRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gameFileInputRef = useRef<HTMLInputElement>(null);
  const countdownTimeoutsRef = useRef<any[]>([]);

  useEffect(() => {
    const gridEl = document.querySelector('.bg-grid');
    if (gridEl) {
      if (theme === 'valentine') {
        gridEl.setAttribute('style', 'display: none;');
      } else {
        gridEl.removeAttribute('style');
      }
    }
  }, [theme]);

  useEffect(() => {
    if (theme === 'valentine') {
      const arr = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        duration: 7 + Math.random() * 8,
        twist: -120 + Math.random() * 240,
        angle: -45 + Math.random() * 90,
        size: 14 + Math.random() * 20,
      }));
      setRomanticHearts(arr);
    } else {
      setRomanticHearts([]);
    }
  }, [theme]);

  const clearCountdownTimeouts = () => {
    countdownTimeoutsRef.current.forEach(t => clearTimeout(t));
    countdownTimeoutsRef.current = [];
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && tempSubjectName.trim()) {
      audioService.playTick(); 
      setUserName(tempName.trim().toUpperCase());
      setSubjectName(tempSubjectName.trim().toUpperCase());
      setGameStarted(true);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setMohiniFace(e.target?.result as string);
      audioService.playWin();
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSpin = () => {
    if (spinning || gameOver || countdown !== null) return;
    setWinner(null);
    setParticles([]);
    clearCountdownTimeouts();

    // Begin countdown
    setCountdown(3);
    audioService.playCountdownTick();

    const t2 = setTimeout(() => {
      setCountdown(2);
      audioService.playCountdownTick();
    }, 1000);

    const t1 = setTimeout(() => {
      setCountdown(1);
      audioService.playCountdownTick();
    }, 2000);

    const tGo = setTimeout(() => {
      setCountdown('SPIN!');
      audioService.playCountdownGo();

      // Trigger the actual physical spin!
      setSpinning(true);
      audioService.startWhirring();
      const spins = 7 + Math.random() * 5;
      const extraDegrees = Math.random() * 360;
      const totalRotation = rotationRef.current + spins * 360 + extraDegrees;
      rotationRef.current = totalRotation;
      setRotation(totalRotation);
    }, 3000);

    const tClear = setTimeout(() => {
      setCountdown(null);
    }, 4000);

    countdownTimeoutsRef.current = [t2, t1, tGo, tClear];
  };

  const spawnParticles = (color: string) => {
    const newParticles: Particle[] = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 250;
      newParticles.push({
        id: Date.now() + i,
        x: 0,
        y: 0,
        color,
        size: 4 + Math.random() * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  };

  const onSpinEnd = useCallback(() => {
    setSpinning(false);
    audioService.stopWhirring();
    const normalizedRotation = rotationRef.current % 360;
    const winningAngle = (360 - (normalizedRotation % 360)) % 360;
    const anglePerSegment = 360 / SECTORS.length;
    const winningIndex = Math.floor(winningAngle / anglePerSegment);
    
    const win = SECTORS[winningIndex];
    setWinner(win);
    spawnParticles(win.color);
    
    const newScore = totalScore + win.points;
    setTotalScore(newScore);
    setHistory(prev => [{ id: Date.now().toString(), label: win.label, points: win.points, timestamp: Date.now() }, ...prev.slice(0, 4)]);

    if (win.id === 'A') {
      setKissesCount(prev => prev + 1);
      setTimeout(() => {
        audioService.playKissVocal();
      }, 300);
    } else if (win.id === 'B') {
      setHugsCount(prev => prev + 1);
      setTimeout(() => {
        audioService.playHugVocal();
      }, 300);
    } else if (win.id === 'C' || win.id === 'D') {
      setLicksCount(prev => prev + 1);
      setTimeout(() => {
        audioService.playLickVocal();
      }, 300);
    } else if (['E', 'F', 'G', 'H'].includes(win.id)) {
      setRejectionsCount(prev => prev + 1);
      setTimeout(() => {
        audioService.playCreepVocal();
      }, 300);
    }

    if (win.points < 0) {
      setShakeKey(prev => prev + 1);
    }

    let newLevelIndex = -1;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (newScore >= LEVELS[i].threshold) {
        newLevelIndex = i;
        break;
      }
    }

    if (newLevelIndex > currentLevelIndex) {
      setCurrentLevelIndex(newLevelIndex);
      setShowLevelUp(true);
      setConfettiCount((newLevelIndex + 1) * 30);
      audioService.playLevelUp(newLevelIndex + 1);
      setTimeout(() => setShowLevelUp(false), 3000);
      setTimeout(() => setConfettiCount(0), 5000);
    } else {
      if (win.points > 0) audioService.playWin();
      else if (win.points < 0) audioService.playLose();
    }
  }, [totalScore, currentLevelIndex]);

  const handleReset = () => {
    audioService.stopWhirring();
    clearCountdownTimeouts();
    setCountdown(null);
    setUserName('');
    setSubjectName('MOHINI');
    setTempName('');
    setTempSubjectName('');
    setGameStarted(false);
    setTotalScore(0);
    setHistory([]);
    setWinner(null);
    setGameOver(false);
    setCurrentLevelIndex(-1);
    rotationRef.current = 0;
    setRotation(0);
    setParticles([]);
    setKissesCount(0);
    setHugsCount(0);
    setLicksCount(0);
    setRejectionsCount(0);
  };

  const formatLabel = (label: string) => {
    return label.replace(/^SHE\s+/i, `${subjectName} `);
  };

  const formatDescription = (desc: string) => {
    return desc.replace(/Mohini/gi, subjectName);
  };

  const renderThemeSwitcher = () => (
    <div className={`flex items-center gap-1 p-1 rounded-full text-xs font-bold select-none transition-all duration-300 z-50 mb-8 ${isRomantic ? 'bg-red-950/50 border border-rose-900/60 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'bg-black/80 border border-white/10'}`}>
      <button 
        type="button"
        onClick={() => { setTheme('cyber'); audioService.playTick(); }}
        className={`px-4 py-1.5 rounded-full uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
          theme === 'cyber' 
            ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-black shadow-md' 
            : 'text-zinc-500 hover:text-white'
        }`}
      >
        <i className="fas fa-bolt"></i> CyberPunk
      </button>
      <button 
        type="button"
        onClick={() => { setTheme('valentine'); audioService.playTick(); }}
        className={`px-4 py-1.5 rounded-full uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
          theme === 'valentine' 
            ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white font-black shadow-md shadow-rose-900/50 animate-pulse' 
            : 'text-zinc-500 hover:text-rose-400'
        }`}
      >
        <i className="fas fa-heart text-rose-500 animate-pulse"></i> Velvet Love
      </button>
    </div>
  );

  if (!gameStarted) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center px-8 md:px-12 py-12 overflow-hidden relative transition-all duration-700 ${
        isRomantic 
          ? 'bg-gradient-to-tr from-[#120002] via-[#230006] to-[#3a000e] text-[#fef08a] font-serif-elegant' 
          : 'bg-black text-white'
      }`}>
        
        {/* Floating Hearts in Valentine Mode */}
        {isRomantic && romanticHearts.map(heart => (
          <div 
            key={heart.id} 
            className="floating-heart-obj" 
            style={{ 
              left: `${heart.left}%`, 
              fontSize: `${heart.size}px`,
              '--duration': `${heart.duration}s`,
              '--twist': `${heart.twist}px`,
              '--angle': `${heart.angle}deg`
            } as any}
          >
            ♥
          </div>
        ))}

        {/* Theme Switcher */}
        {renderThemeSwitcher()}

        <div className="w-full max-w-4xl text-center mb-2 z-10">
          {isRomantic ? (
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-sans font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-300 to-red-300 leading-tight">
              MOHINI<br/>
              <span className="font-romance capitalize text-rose-500 text-6xl sm:text-7xl md:text-8xl normal-case block mt-2 drop-shadow-[0_4px_12px_rgba(190,18,60,0.4)]">Spinner</span>
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-syne glitch leading-tight break-words">MOHINI<br/>SPINNER</h1>
          )}
        </div>

        <div className="z-10 text-center mb-12">
          {isRomantic ? (
            <p className="font-romance text-rose-200 text-2xl md:text-3xl tracking-[0.05em] px-4 animate-pulse drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
              Surrender your soul to her command...
            </p>
          ) : (
            <p className="font-marker text-pink-500 text-lg md:text-xl tracking-[0.2em] md:tracking-[0.3em] uppercase animate-pulse px-4">
              Your Karma is in her hands
            </p>
          )}
        </div>
        
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
          <form onSubmit={handleStart} className="space-y-6">
            <div className={`p-6 transition-all duration-300 ${
              isRomantic 
                ? 'bg-[#1a0004]/80 border-2 border-rose-950 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] focus-within:border-amber-400/60' 
                : 'punk-border bg-black'
            }`}>
              <label className={`block text-[10px] font-black mb-2 tracking-widest uppercase italic ${isRomantic ? 'text-rose-400 font-sans' : 'text-cyan-400'}`}>
                PLAYER IDENTIFICATION
              </label>
              <input 
                autoFocus 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
                className={`w-full bg-transparent border-b-2 text-xl font-bold py-1 outline-none transition-colors uppercase ${
                  isRomantic 
                    ? 'border-rose-900 text-rose-100 focus:border-amber-400' 
                    : 'border-white text-white focus:border-pink-500'
                }`} 
                placeholder="ENTER YOUR NAME..." 
              />
            </div>

            <div className={`p-6 transition-all duration-300 ${
              isRomantic 
                ? 'bg-[#1a0004]/80 border-2 border-rose-950 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] focus-within:border-amber-400/60' 
                : 'punk-border bg-black'
            }`}>
              <label className={`block text-[10px] font-black mb-2 tracking-widest uppercase italic ${isRomantic ? 'text-amber-400 font-sans' : 'text-pink-500'}`}>
                TARGET SUBJECT NAME
              </label>
              <input 
                type="text" 
                value={tempSubjectName} 
                onChange={(e) => setTempSubjectName(e.target.value)} 
                className={`w-full bg-transparent border-b-2 text-xl font-bold py-1 outline-none transition-colors uppercase ${
                  isRomantic 
                    ? 'border-rose-900 text-rose-100 focus:border-amber-400' 
                    : 'border-white text-white focus:border-cyan-400'
                }`} 
                placeholder="NAME OF YOUR MOHINI..." 
              />
            </div>

            <button 
              type="submit" 
              className={`w-full text-xl cursor-pointer ${
                isRomantic 
                  ? 'btn-valentine' 
                  : 'btn-punk'
              }`}
            >
              INITIATE SESSION
            </button>
          </form>

          <div 
            onClick={() => fileInputRef.current?.click()} 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-6 cursor-pointer hover:scale-[1.02] transition-all duration-350 relative overflow-hidden group select-none ${
              isRomantic 
                ? 'border-2 border-rose-950 bg-[#160003]/90 rounded-2xl shadow-[0_10px_35px_rgba(190,18,60,0.15)] hover:border-amber-400/50' 
                : 'punk-border-cyan bg-zinc-900'
            }`}
          >
            <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*" />
            {mohiniFace ? (
              <div className="w-full h-40 relative">
                <img src={mohiniFace} alt="Mohini" className={`w-full h-full object-cover group-hover:grayscale-0 transition-all duration-500 ${isRomantic ? 'brightness-90 contrast-110' : 'grayscale'}`} />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold text-center py-1 select-none pointer-events-none">DRAG & DROP TO CHANGE</div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <i className={`fas fa-heart text-4xl group-hover:scale-125 transition-transform animate-pulse ${isRomantic ? 'text-rose-500' : 'text-cyan-400'}`}></i>
                <p className={`text-[10px] font-black leading-tight uppercase tracking-widest ${isRomantic ? 'text-rose-200' : 'text-white'}`}>
                  {isRomantic ? 'CHOOSE HER IMPOSING PORTRAIT' : 'PICK YOUR MOHINI'}<br/>
                  <span className={isRomantic ? 'text-amber-400' : 'text-pink-500'}>(DRAG & DROP / CLICK)</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }  return (
    <div 
      key={shakeKey} 
      className={`min-h-screen flex flex-col items-center px-6 md:px-12 py-8 md:py-12 relative overflow-hidden transition-all duration-700 ${
        isRomantic 
          ? 'bg-gradient-to-tr from-[#120002] via-[#230006] to-[#3a000e] text-[#fef08a] font-serif-elegant' 
          : 'bg-black text-white'
      } ${shakeKey > 0 ? 'animate-jarring-shake' : ''}`}
    >
      
      {/* Floating Hearts in Valentine Mode */}
      {isRomantic && romanticHearts.map(heart => (
        <div 
          key={heart.id} 
          className="floating-heart-obj" 
          style={{ 
            left: `${heart.left}%`, 
            fontSize: `${heart.size}px`,
            '--duration': `${heart.duration}s`,
            '--twist': `${heart.twist}px`,
            '--angle': `${heart.angle}deg`
          } as any}
        >
          ♥
        </div>
      ))}

      {Array.from({ length: confettiCount }).map((_, i) => (
        <div key={i} className="confetti-piece" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, backgroundColor: SECTORS[i % SECTORS.length].color }} />
      ))}

      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md">
          <div className={`p-12 text-center transform scale-110 animate-in zoom-in duration-300 ${isRomantic ? 'bg-[#1a0004] border-2 border-amber-500 rounded-3xl shadow-[0_10px_40px_rgba(239,68,68,0.5)]' : 'level-card'}`}>
            <h2 className={`text-4xl md:text-5xl font-black uppercase mb-4 ${isRomantic ? 'font-sans text-rose-200 drop-shadow-[0_2px_10px_rgba(239,68,68,0.4)]' : 'font-syne text-white glitch'}`}>LEVEL UP!</h2>
            <div className={`h-1 w-full mb-6 ${isRomantic ? 'bg-amber-400' : 'bg-cyan-400'}`}></div>
            <p className={`text-xl md:text-2xl uppercase italic tracking-wider ${isRomantic ? 'font-serif-elegant text-amber-300' : 'font-marker text-pink-500'}`}>
              {LEVELS[currentLevelIndex] ? formatDescription(LEVELS[currentLevelIndex].description) : ''}
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl flex flex-col lg:flex-row justify-between items-center mb-12 gap-8 z-10 px-2 md:px-0">
        <div className="text-center lg:text-left w-full lg:w-auto">
          {isRomantic ? (
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-sans font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-250 via-rose-300 to-red-300 leading-none">
                MOHINI SPINNER
              </h1>
              <p className="font-romance text-rose-300 text-lg tracking-wider mt-1 font-bold">Surrender your soul to her command...</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-syne glitch break-words">MOHINI SPINNER</h1>
              <p className="font-marker text-cyan-400 text-xs md:text-sm tracking-widest mt-2 uppercase opacity-80">Your Karma is in her hands</p>
            </div>
          )}
          <div className="mt-4 flex justify-center lg:justify-start">
            {renderThemeSwitcher()}
          </div>
        </div>
        
        <div className={`p-4 flex flex-row items-center gap-6 md:gap-8 min-w-full sm:min-w-[300px] transition-all duration-300 ${
          isRomantic 
            ? 'bg-gradient-to-r from-rose-950 via-[#230109] to-red-950 border-2 border-rose-900 rounded-3xl text-rose-100 shadow-[0_5px_20px_rgba(0,0,0,0.5)] font-serif-elegant' 
            : 'bg-white text-black punk-border'
        }`}>
          <div className="flex flex-col border-r border-black/20 pr-6 flex-1 lg:flex-initial">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">PLAYER</span>
            <span className={`text-xl md:text-2xl truncate max-w-[120px] md:max-w-[150px] ${isRomantic ? 'font-bold text-amber-200' : 'font-syne font-black'}`}>{userName}</span>
          </div>
          <div className="flex flex-col flex-1 sm:flex-initial">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center">KARMA LEVEL</span>
            <div className={`text-4xl md:text-5xl font-bungee leading-none text-center ${totalScore >= 0 ? (isRomantic ? 'text-[#ffb1b1]' : 'text-green-600') : 'text-red-600'} animate-pulse`}>{totalScore}</div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start z-10">
        <div className="lg:col-span-3 space-y-6 order-3 lg:order-1">
          <div className={`p-4 transition-all duration-350 ${
            isRomantic 
              ? 'bg-[#1c0004]/80 border-2 border-rose-950 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
              : 'glass border-2 border-white/10'
          }`}>
            <h3 className={`text-[10px] font-black mb-4 uppercase tracking-[0.2em] border-b pb-2 ${isRomantic ? 'text-amber-400 border-rose-950/50 font-sans' : 'text-cyan-400 border-cyan-400/20'}`}>RELATIONSHIP TIERS</h3>
            <div className="space-y-3">
              {LEVELS.map((lvl, i) => {
                const isUnlocked = currentLevelIndex >= i;
                return (
                  <div 
                    key={i} 
                    className={`p-3 border transition-all duration-300 ${
                      isUnlocked 
                        ? isRomantic 
                          ? 'bg-gradient-to-r from-rose-950/90 to-red-950/90 border-2 border-amber-400 text-amber-100 scale-[1.02] shadow-[0_2px_15px_rgba(239,68,68,0.3)] rounded-xl'
                          : 'bg-sky-950/80 border-2 border-sky-400 text-white scale-[1.02] shadow-[0_0_12px_rgba(56,189,248,0.35)]' 
                        : isRomantic
                          ? 'bg-[#0f0003]/40 border-rose-950/40 text-rose-300/40 rounded-xl'
                          : 'bg-zinc-900/60 border-white/15 text-white'
                    }`}
                  >
                    <div className="flex justify-between text-[9px] font-black tracking-wider mb-1">
                      <span className={isUnlocked ? (isRomantic ? 'text-amber-300 uppercase' : 'text-sky-300 uppercase') : 'text-zinc-500 uppercase'}>
                        {lvl.label} {isUnlocked && <i className={`fas ${isRomantic ? 'fa-heart text-rose-500' : 'fa-lock-open text-sky-300'} ml-1 text-[8px]`}></i>}
                      </span>
                      <span className={isUnlocked ? (isRomantic ? 'text-amber-300' : 'text-sky-300') : 'text-zinc-500'}>
                        {lvl.threshold} PTS
                      </span>
                    </div>
                    <p className={`text-[11px] leading-tight uppercase ${isUnlocked ? 'font-extrabold text-white' : 'font-medium text-zinc-400'}`}>
                      {formatDescription(lvl.description)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
         
          <div className={`p-4 transition-all duration-350 ${
            isRomantic 
              ? 'bg-[#1c0004]/80 border-2 border-rose-950 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
              : 'glass border-2 border-white/10'
          }`}>
            <h3 className={`text-[10px] font-black mb-4 uppercase tracking-[0.2em] border-b pb-2 ${isRomantic ? 'text-rose-400 border-rose-950/50 font-sans' : 'text-pink-500 border-pink-500/20'}`}>KARMA LOG</h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
              {history.map(item => (
                <div key={item.id} className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-1">
                  <span className={`uppercase truncate w-2/3 flex items-center gap-1 ${isRomantic ? 'text-rose-100 font-normal font-sans' : 'text-white/80 font-mono'}`}>
                    {isRomantic && <span className="text-rose-600">♥</span>}
                    {formatLabel(item.label)}
                  </span>
                  <span className={item.points >= 0 ? (isRomantic ? 'text-rose-300' : 'text-green-400') : 'text-red-500'}>
                    {item.points > 0 ? '+' : ''}{item.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {!gameOver ? (
            <button 
              onClick={() => setGameOver(true)} 
              disabled={spinning} 
              className={`w-full py-4 font-black text-xs hover:text-black hover:bg-white transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isRomantic 
                  ? 'border-2 border-rose-950 bg-[#160003]/80 text-rose-400 rounded-xl hover:bg-rose-900/20 hover:text-rose-200' 
                  : 'border-4 border-white text-white'
              }`}
            >
              <i className={`fas ${isRomantic ? 'fa-heart-broken' : 'fa-hand-paper'} text-rose-500`}></i> TERMINATE SESSION
            </button>
          ) : (
            <button 
              onClick={handleReset} 
              className={`w-full text-xl cursor-pointer ${
                isRomantic 
                  ? 'btn-valentine animate-heart-beat' 
                  : 'btn-punk'
              }`}
            >
              RESET UNIVERSE
            </button>
          )}
        </div>

        <div className="lg:col-span-6 flex flex-col items-center justify-center relative order-1 lg:order-2">
          {/* Side-by-side flex container for Wheel and the Sector Description List */}
          <div className={`w-full flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-8 p-4 border transition-all duration-350 ${
            isRomantic 
              ? 'bg-gradient-to-b from-[#1c0005]/95 to-[#0b0002] border-2 border-rose-950 rounded-3xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]' 
              : 'bg-zinc-950/40 border-white/5 rounded-2xl'
          }`}>
            {/* Wheel Container */}
            <div className="relative flex-shrink-0">
              <Wheel segments={SECTORS} spinning={spinning} rotation={rotation} onSpinEnd={onSpinEnd} theme={theme} />
              
              {/* Animated Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-30 rounded-full select-none overflow-hidden" id="countdown-overlay">
                  <div className={`absolute w-[85%] h-[85%] border-2 border-dashed ${isRomantic ? 'border-amber-400/40' : 'border-pink-500/30'} rounded-full animate-spin [animation-duration:12s]`}></div>
                  <div className={`absolute w-[75%] h-[75%] border border-dashed ${isRomantic ? 'border-rose-500/30' : 'border-cyan-400/20'} rounded-full animate-spin [animation-duration:8s] [animation-direction:reverse]`}></div>
                  <div key={countdown} className="relative z-10 flex flex-col items-center justify-center animate-countdown-pop">
                    <span className={`text-6xl md:text-7xl font-black ${isRomantic ? 'font-sans font-black tracking-widest text-shadow-all text-[#ffb1b1]' : 'font-bungee tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 drop-shadow-[0_0_25px_rgba(255,0,255,0.75)]'}`}>
                      {countdown}
                    </span>
                    <span className={`text-[10px] md:text-[11px] uppercase tracking-[0.25em] mt-2 font-bold animate-pulse ${isRomantic ? 'font-sans text-rose-300' : 'font-mono text-pink-400'}`}>
                      {countdown === 'SPIN!' ? (isRomantic ? 'EMBRACE FATE!' : 'LFG!') : (isRomantic ? 'DESIRE UNFOLDS' : 'PREPARING FATE')}
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
                {particles.map((p, pIdx) => (
                  <div
                    key={p.id}
                    className="animate-particle absolute pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      color: isRomantic ? '#f43f5e' : p.color,
                      fontSize: `${p.size * 2}px`,
                      '--tw-translate-x': `${p.vx}px`,
                      '--tw-translate-y': `${p.vy}px`,
                    } as any}
                  >
                    {isRomantic ? (
                      <span className="drop-shadow-[0_0_8px_#ef4444] text-xs">♥</span>
                    ) : (
                      <div className="rounded-full shadow-[0_0_10px_currentColor]" style={{ width: p.size, height: p.size, backgroundColor: p.color }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Segment Description List */}
            <div className="flex-1 w-full space-y-2 text-left">
              <h3 className={`text-[10px] font-black tracking-[0.2em] mb-3 uppercase border-b pb-1.5 flex items-center gap-1.5 ${isRomantic ? 'text-amber-400 border-rose-950/60 font-sans' : 'text-rose-500 border-rose-500/20'}`}>
                <i className={`fas ${isRomantic ? 'fa-heart text-rose-500 animate-pulse' : 'fa-list-ol'}`}></i> Enjoy her
              </h3>
              <div className="flex flex-col gap-1.5">
                {SECTORS.map((sector) => {
                  const isSelected = winner?.id === sector.id;
                  return (
                    <div 
                      key={sector.id} 
                      className={`flex items-start gap-2 px-2 py-1.5 rounded transition-all border ${
                        isSelected 
                          ? isRomantic
                            ? 'bg-gradient-to-r from-rose-950/90 via-red-950/90 to-amber-950/90 border-amber-400 scale-[1.02] shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                            : 'bg-rose-950/80 border-rose-500/85 scale-[1.02] shadow-[0_0_12px_rgba(244,63,94,0.35)]' 
                          : isRomantic
                            ? 'bg-[#0a0002]/60 border-rose-950/50 hover:border-rose-900/40'
                            : 'bg-black/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 flex-shrink-0 mt-0.5 rounded flex items-center justify-center font-mono text-[9px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: sector.color }}
                      >
                        {sector.id}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[9.5px] leading-tight uppercase break-words font-normal ${isSelected ? (isRomantic ? 'text-amber-250 font-bold' : 'text-pink-400') : 'text-zinc-300'}`}>
                            {formatLabel(sector.label)}
                          </span>
                          <span className={`text-[9px] font-mono whitespace-nowrap ml-1 flex-shrink-0 ${sector.points >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}`}>
                            {sector.points > 0 ? `+${sector.points}` : sector.points} PTS
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button 
            onClick={handleSpin} 
            disabled={spinning || gameOver || countdown !== null} 
            className={`mt-8 w-full max-w-sm py-5 text-xl md:text-2xl uppercase cursor-pointer ${
              isRomantic 
                ? 'btn-valentine font-sans tracking-widest shadow-[0_15px_40px_rgba(220,38,38,0.35)] animate-heart-beat' 
                : 'btn-punk shadow-[0_20px_50px_rgba(255,0,255,0.2)]'
            }`}
          >
            {countdown !== null ? 'PREPARING...' : spinning ? 'DECIDING...' : (isRomantic ? 'SPIN DESIRE ♥' : 'SPIN FATE')}
          </button>
        </div>

        <div className="lg:col-span-3 space-y-6 order-2 lg:order-3">
          <div className={`p-6 transition-all duration-350 ${
            isRomantic 
              ? 'bg-[#1c0004]/85 border-4 border-amber-400 rounded-3xl shadow-[0_8px_32px_rgba(190,18,60,0.5)] relative overflow-hidden' 
              : 'glass border-4 border-cyan-400 shadow-[20px_20px_0px_rgba(0,255,255,0.1)] relative'
          }`}>
            <h3 className={`mb-6 uppercase tracking-widest text-center truncate ${isRomantic ? 'text-xs font-bold text-amber-200' : 'text-[10px] font-black text-cyan-400'}`}>{subjectName}</h3>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`w-full aspect-square bg-black border overflow-hidden relative group select-none ${isRomantic ? 'border-amber-400/40 rounded-2xl' : 'border-white/10'}`}
            >
              {mohiniFace ? (
                <>
                  <img 
                    src={mohiniFace} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 animate-portrait-funky" 
                    alt={subjectName} 
                    referrerPolicy="no-referrer"
                  />
                  {/* Hover controls override to replace the image or URL */}
                  <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 z-20">
                    <p className="text-[10px] font-black text-rose-500 tracking-widest uppercase mb-1">REPLACE {subjectName}</p>
                    
                    <div className="flex gap-2 w-full max-w-[200px]">
                      <button 
                        onClick={() => gameFileInputRef.current?.click()}
                        className="flex-1 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors border-0"
                      >
                        Device File
                      </button>
                      <button 
                        onClick={() => {
                          const url = prompt(`Paste the image URL of any woman to represent ${subjectName}:`);
                          if (url && url.trim()) {
                            setMohiniFace(url.trim());
                            audioService.playWin();
                          }
                        }}
                        className="flex-1 py-1.5 bg-pink-500 hover:bg-pink-400 text-white font-black text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors border-0"
                      >
                        Paste URL
                      </button>
                    </div>

                    <button 
                      onClick={() => setMohiniFace(null)}
                      className="py-1 px-4 mt-2 border border-red-500/50 hover:bg-red-500/20 text-red-500 text-[9px] uppercase font-bold tracking-widest transition-colors bg-transparent rounded"
                    >
                      REMOVE IMAGE
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-1">
                  {/* File Upload selection trigger */}
                  <div className="text-center w-full">
                    <button
                      onClick={() => gameFileInputRef.current?.click()}
                      className={`inline-flex flex-col items-center justify-center space-y-2 transition-colors group/btn cursor-pointer bg-transparent border-0 ${
                        isRomantic ? 'hover:text-amber-250 text-rose-300' : 'hover:text-cyan-400 text-white'
                      }`}
                    >
                      <i className={`fas ${isRomantic ? 'fa-heart text-rose-500 scale-110' : 'fa-camera-retro text-cyan-400'} text-3xl group-hover/btn:rotate-6 transition-transform`}></i>
                      <span className="text-[9px] font-black tracking-widest uppercase">{isRomantic ? 'PORTRAIT FILE' : 'UPLOAD IMAGE'}</span>
                    </button>
                  </div>

                  <div className="w-full flex items-center justify-center gap-2 opacity-30">
                    <div className="h-[1px] bg-white flex-1"></div>
                    <span className="text-[8px] font-mono">OR</span>
                    <div className="h-[1px] bg-white flex-1"></div>
                  </div>

                  <div className="w-full space-y-1">
                    <label className={`block text-[8px] font-black tracking-wider text-center uppercase ${isRomantic ? 'text-amber-400 font-sans' : 'text-rose-500'}`}>LOAD FROM INTERNET URL</label>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const target = e.currentTarget as HTMLFormElement;
                        const input = target.elements.namedItem('urlInput') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          setMohiniFace(input.value.trim());
                          audioService.playWin();
                          input.value = '';
                        }
                      }}
                      className="flex gap-1"
                    >
                      <input
                        type="url"
                        name="urlInput"
                        placeholder="https://example.com/image.jpg"
                        className={`flex-1 px-2 py-1.5 text-[10px] focus:outline-none placeholder:opacity-50 ${
                          isRomantic 
                            ? 'bg-[#120003] border border-rose-950 text-rose-100 focus:border-amber-400 rounded-lg' 
                            : 'bg-zinc-900 border border-white/20 text-white focus:border-cyan-400'
                        }`}
                      />
                      <button
                        type="submit"
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors border-0 cursor-pointer ${
                          isRomantic 
                            ? 'bg-amber-400 hover:bg-amber-300 text-black rounded-lg' 
                            : 'bg-cyan-400 hover:bg-cyan-300 text-black'
                        }`}
                      >
                        LOAD
                      </button>
                    </form>
                  </div>
                </div>
              )}
              
              {/* Invisible input element dedicated to game screen */}
              <input 
                type="file" 
                ref={gameFileInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }} 
                className="hidden" 
                accept="image/*" 
              />
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle,transparent_20%,#000_80%)]"></div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              {winner ? (
                <div className="animate-in slide-in-from-bottom duration-500">
                  <h4 className={`text-[8px] font-black uppercase tracking-widest mb-2 ${isRomantic ? 'text-amber-400 font-sans' : 'text-pink-500'}`}>KARMA RECEIVED</h4>
                  <p className={`text-base md:text-lg leading-tight uppercase border-y py-4 min-h-[80px] flex items-center justify-center ${
                    isRomantic 
                      ? 'border-rose-950/50 font-sans font-bold text-rose-100/90 text-shadow-none' 
                      : 'border-white/10 font-syne font-black text-white'
                  }`}>{formatLabel(winner.label)}</p>
                  <div className={`mt-4 text-2xl md:text-3xl font-bungee ${winner.points >= 0 ? (isRomantic ? 'text-[#ffb1b1]' : 'text-green-400') : 'text-red-500'}`}>
                    {winner.points > 0 ? '+' : ''}{winner.points}
                  </div>
                </div>
              ) : (
                <div className="opacity-20 space-y-2">
                  <i className={`fas ${isRomantic ? 'fa-heart text-rose-500 animate-pulse' : 'fa-satellite-dish animate-pulse'}`}></i>
                  <p className="text-[10px] uppercase tracking-widest">{isRomantic ? 'Awaiting her command...' : 'Awaiting result...'}</p>
                </div>
              )}
            </div>
            
            <div className={`absolute -bottom-4 -right-4 px-2 py-1 text-[8px] font-black rotate-3 select-none ${isRomantic ? 'bg-amber-400 text-black font-sans' : 'bg-white text-black font-mono'}`}>SUBJECT_ID_{subjectName.slice(0,3)}</div>
          </div>
          
          <div className={`p-5 transition-all duration-350 ${
            isRomantic 
              ? 'bg-[#1c0004]/75 border-2 border-dashed border-rose-900/60 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.3)]' 
              : 'glass border-2 border-dashed border-white/20'
          }`}>
            <h4 className={`font-black text-[10px] mb-2 uppercase text-center ${isRomantic ? 'text-rose-400 font-sans' : 'text-yellow-400'}`}>YOUR SCORE</h4>
            <div className="space-y-1 text-[8px] font-mono text-white/50">
              <div className="flex justify-between items-center border-b border-white/5 py-1"><span>KISSES</span><span className={`font-bold ${isRomantic ? 'text-rose-200' : 'text-white'}`}>{kissesCount}</span></div>
              <div className="flex justify-between items-center border-b border-white/5 py-1"><span>HUGS</span><span className={`font-bold ${isRomantic ? 'text-rose-200' : 'text-white'}`}>{hugsCount}</span></div>
              <div className="flex justify-between items-center border-b border-white/5 py-1"><span>LICKS</span><span className={`font-bold ${isRomantic ? 'text-rose-200' : 'text-white'}`}>{licksCount}</span></div>
              <div className="flex justify-between items-center py-1"><span>REJECTION</span><span className="text-red-500 font-bold">{rejectionsCount}</span></div>
            </div>
          </div>
        </div>
      </div>

      <footer className={`mt-20 py-8 border-t w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 text-[8px] font-black tracking-[0.2em] md:tracking-[0.4em] ${
        isRomantic 
          ? 'border-rose-950/40 text-rose-800/60 font-sans' 
          : 'border-white/10 text-white/10 font-mono'
      }`}>
        <div>&copy; 2025 MOHINI SPINNER LABORATORIES</div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 uppercase">
          <span>HIGH FREQUENCY FATE</span>
          <span>NO REFUNDS</span>
          <span>GEN_Z PUNK CORP</span>
        </div>
      </footer>
    </div>
  );
};

export default App;