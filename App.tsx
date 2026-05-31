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
  { threshold: 20, description: "you take Mohini out on a date", label: "LEVEL 1" },
  { threshold: 30, description: "Mohini takes you out on a date", label: "LEVEL 2" },
  { threshold: 40, description: "Mohini makes out with you on a roof top", label: "LEVEL 3" },
  { threshold: 50, description: "You Fukckckc Mohini", label: "LEVEL 4" },
  { threshold: 60, description: "Mohini becomes your Girlfriend", label: "LEVEL 5" },
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
  
  const rotationRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gameFileInputRef = useRef<HTMLInputElement>(null);

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
    if (spinning || gameOver) return;
    setWinner(null);
    setParticles([]);
    setSpinning(true);
    const spins = 7 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = rotationRef.current + spins * 360 + extraDegrees;
    rotationRef.current = totalRotation;
    setRotation(totalRotation);
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
    } else if (win.id === 'B') {
      setHugsCount(prev => prev + 1);
    } else if (win.id === 'C' || win.id === 'D') {
      setLicksCount(prev => prev + 1);
    } else if (['E', 'F', 'G', 'H'].includes(win.id)) {
      setRejectionsCount(prev => prev + 1);
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

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 md:px-12 py-12 bg-black overflow-hidden relative">
        <div className="w-full max-w-4xl text-center mb-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-syne glitch leading-tight break-words">MOHINI<br/>SPINNER</h1>
        </div>
        <p className="font-marker text-pink-500 text-lg md:text-xl tracking-[0.2em] md:tracking-[0.3em] mb-12 uppercase animate-pulse px-4 text-center">Your Karma is in her hands</p>
        
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
          <form onSubmit={handleStart} className="space-y-6">
            <div className="punk-border p-6 bg-black">
              <label className="block text-[10px] font-black text-cyan-400 mb-2 tracking-widest uppercase italic">PLAYER IDENTIFICATION</label>
              <input autoFocus type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="w-full bg-transparent border-b-2 border-white text-xl font-bold py-1 outline-none text-white focus:border-pink-500 transition-colors uppercase" placeholder="ENTER YOUR NAME..." />
            </div>
            <div className="punk-border p-6 bg-black">
              <label className="block text-[10px] font-black text-pink-500 mb-2 tracking-widest uppercase italic">TARGET SUBJECT NAME</label>
              <input type="text" value={tempSubjectName} onChange={(e) => setTempSubjectName(e.target.value)} className="w-full bg-transparent border-b-2 border-white text-xl font-bold py-1 outline-none text-white focus:border-cyan-400 transition-colors uppercase" placeholder="NAME OF YOUR MOHINI..." />
            </div>
            <button type="submit" className="w-full btn-punk text-xl">INITIATE GAME</button>
          </form>
          <div 
            onClick={() => fileInputRef.current?.click()} 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="punk-border-cyan bg-zinc-900 flex flex-col items-center justify-center p-6 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group select-none"
          >
            <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*" />
            {mohiniFace ? (
              <div className="w-full h-40 relative">
                <img src={mohiniFace} alt="Mohini" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-bold text-center py-1 select-none pointer-events-none">DRAG & DROP TO CHANGE</div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <i className="fas fa-camera-retro text-4xl text-cyan-400 group-hover:rotate-12 transition-transform animate-pulse"></i>
                <p className="text-[10px] font-black text-white leading-tight uppercase tracking-widest">PICK YOUR MOHINI<br/><span className="text-pink-500">(DRAG & DROP / CLICK)</span></p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={shakeKey} className={`min-h-screen flex flex-col items-center px-6 md:px-12 py-8 md:py-12 relative overflow-hidden ${shakeKey > 0 ? 'animate-jarring-shake' : ''}`}>
      {Array.from({ length: confettiCount }).map((_, i) => (
        <div key={i} className="confetti-piece" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, backgroundColor: SECTORS[i % SECTORS.length].color }} />
      ))}

      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="level-card p-12 text-center transform scale-110 animate-in zoom-in duration-300">
            <h2 className="text-3xl md:text-5xl font-syne font-black text-white glitch uppercase mb-4">LEVEL UP!</h2>
            <div className="h-1 w-full bg-cyan-400 mb-6"></div>
            <p className="text-xl md:text-2xl font-marker text-pink-500 uppercase italic tracking-wider">{LEVELS[currentLevelIndex].description}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl flex flex-col lg:flex-row justify-between items-center mb-12 gap-8 z-10 px-2 md:px-0">
        <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-syne glitch break-words">MOHINI SPINNER</h1>
            <p className="font-marker text-cyan-400 text-xs md:text-sm tracking-widest mt-2 uppercase opacity-80">Your Karma is in her hands</p>
        </div>
        
        <div className="bg-white text-black p-4 punk-border flex flex-row items-center gap-6 md:gap-8 min-w-full sm:min-w-[300px]">
          <div className="flex flex-col border-r border-black/20 pr-6">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">PLAYER</span>
            <span className="text-xl md:text-2xl font-syne font-black truncate max-w-[120px] md:max-w-[150px]">{userName}</span>
          </div>
          <div className="flex flex-col flex-1 sm:flex-initial">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 text-center">KARMA LEVEL</span>
            <div className={`text-4xl md:text-5xl font-bungee leading-none text-center ${totalScore >= 0 ? 'text-green-600' : 'text-red-600'} animate-pulse`}>{totalScore}</div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start z-10">
        <div className="lg:col-span-3 space-y-6 order-3 lg:order-1">
            <div className="glass p-4 border-2 border-white/10">
              <h3 className="text-[10px] font-black text-cyan-400 mb-4 uppercase tracking-[0.2em] border-b border-cyan-400/20 pb-2">RELATIONSHIP TIERS</h3>
              <div className="space-y-3">
                {LEVELS.map((lvl, i) => {
                  const isUnlocked = currentLevelIndex >= i;
                  return (
                    <div 
                      key={i} 
                      className={`p-3 border transition-all duration-300 ${
                        isUnlocked 
                          ? 'bg-sky-950/80 border-2 border-sky-400 text-white scale-[1.02] shadow-[0_0_12px_rgba(56,189,248,0.35)]' 
                          : 'bg-zinc-900/60 border-white/15 text-white'
                      }`}
                    >
                      <div className="flex justify-between text-[9px] font-black tracking-wider mb-1">
                        <span className={isUnlocked ? 'text-sky-300 uppercase' : 'text-zinc-400 uppercase'}>
                          {lvl.label} {isUnlocked && <i className="fas fa-lock-open ml-1 text-[8px] text-sky-300"></i>}
                        </span>
                        <span className={isUnlocked ? 'text-sky-300' : 'text-zinc-400'}>
                          {lvl.threshold} PTS
                        </span>
                      </div>
                      <p className={`text-[11px] leading-tight uppercase ${isUnlocked ? 'font-extrabold text-white' : 'font-medium text-zinc-200'}`}>
                        {lvl.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
           
           <div className="glass p-4 border-2 border-white/10">
              <h3 className="text-[10px] font-black text-pink-500 mb-4 uppercase tracking-[0.2em] border-b border-pink-500/20 pb-2">KARMA LOG</h3>
              <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {history.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-[10px] font-black border-b border-white/5 pb-1">
                        <span className="text-white/80 uppercase truncate w-2/3">{formatLabel(item.label)}</span>
                        <span className={item.points >= 0 ? 'text-green-400' : 'text-red-500'}>{item.points > 0 ? '+' : ''}{item.points}</span>
                    </div>
                ))}
              </div>
           </div>
           
           {!gameOver ? (
             <button onClick={() => setGameOver(true)} disabled={spinning} className="w-full py-4 border-4 border-white font-black text-xs hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                <i className="fas fa-hand-paper text-pink-500"></i> TERMINATE SESSION
             </button>
           ) : (
             <button onClick={handleReset} className="w-full btn-punk">RESET UNIVERSE</button>
           )}
        </div>

        <div className="lg:col-span-6 flex flex-col items-center justify-center relative order-1 lg:order-2">
          <div className="relative">
            <Wheel segments={SECTORS} spinning={spinning} rotation={rotation} onSpinEnd={onSpinEnd} />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
              {particles.map(p => (
                <div
                  key={p.id}
                  className="animate-particle absolute rounded-full shadow-[0_0_10px_currentColor]"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    color: p.color,
                    '--tw-translate-x': `${p.vx}px`,
                    '--tw-translate-y': `${p.vy}px`,
                  } as any}
                />
              ))}
            </div>
          </div>
          <button onClick={handleSpin} disabled={spinning || gameOver} className="mt-12 w-full max-w-sm py-5 text-xl md:text-2xl btn-punk uppercase shadow-[0_20px_50px_rgba(255,0,255,0.2)]">
            {spinning ? 'DECIDING...' : 'SPIN FATE'}
          </button>
        </div>

        <div className="lg:col-span-3 space-y-6 order-2 lg:order-3">
          <div className="glass p-6 border-4 border-cyan-400 shadow-[20px_20px_0px_rgba(0,255,255,0.1)] relative">
            <h3 className="text-[10px] font-black text-cyan-400 mb-6 uppercase tracking-widest text-center truncate">{subjectName}</h3>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="w-full aspect-square bg-black border-2 border-white/10 overflow-hidden relative group select-none"
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
                          className="flex-1 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-black text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors"
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
                          className="flex-1 py-2 bg-pink-500 hover:bg-pink-400 text-white font-black text-[9px] uppercase tracking-wider text-center cursor-pointer transition-colors"
                        >
                          Paste URL
                        </button>
                      </div>

                      <button 
                        onClick={() => setMohiniFace(null)}
                        className="py-1 px-4 mt-2 border border-red-500/50 hover:bg-red-500/20 text-red-500 text-[9px] uppercase font-bold tracking-widest transition-colors"
                      >
                        REMOVE IMAGE
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-4">
                    {/* File Upload selection trigger */}
                    <div className="text-center w-full">
                      <button
                        onClick={() => gameFileInputRef.current?.click()}
                        className="inline-flex flex-col items-center justify-center space-y-2 hover:text-cyan-400 transition-colors group/btn cursor-pointer"
                      >
                        <i className="fas fa-camera-retro text-3xl text-cyan-400 group-hover/btn:rotate-6 transition-transform"></i>
                        <span className="text-[9px] font-black tracking-widest text-white uppercase group-hover/btn:text-cyan-400">UPLOAD DEVICE IMAGE</span>
                      </button>
                    </div>

                    <div className="w-full flex items-center justify-center gap-2 opacity-30">
                      <div className="h-[1px] bg-white flex-1"></div>
                      <span className="text-[8px] font-mono">OR</span>
                      <div className="h-[1px] bg-white flex-1"></div>
                    </div>

                    <div className="w-full space-y-1">
                      <label className="block text-[8px] font-black text-rose-500 tracking-wider text-center uppercase">LOAD FROM INTERNET URL</label>
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
                          className="flex-1 bg-zinc-900 border border-white/20 px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-cyan-400 placeholder:opacity-50"
                        />
                        <button
                          type="submit"
                          className="bg-cyan-400 hover:bg-cyan-300 text-black px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors"
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
                   <h4 className="text-[8px] font-black text-pink-500 uppercase tracking-widest mb-2">KARMA RECEIVED</h4>
                   <p className="text-base md:text-lg font-syne font-black text-white uppercase leading-tight border-y-2 border-white/10 py-4 min-h-[80px] flex items-center justify-center">{formatLabel(winner.label)}</p>
                   <div className={`mt-4 text-2xl md:text-3xl font-bungee ${winner.points >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                    {winner.points > 0 ? '+' : ''}{winner.points}
                   </div>
                 </div>
               ) : (
                 <div className="opacity-20 space-y-2">
                    <i className="fas fa-satellite-dish animate-pulse"></i>
                    <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting result...</p>
                 </div>
               )}
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-white text-black px-2 py-1 text-[8px] font-black rotate-3">SUBJECT_ID_{subjectName.slice(0,3)}</div>
          </div>
          
          <div className="glass p-4 border-2 border-dashed border-white/20">
             <h4 className="font-black text-yellow-400 text-[10px] mb-2 uppercase text-center">YOUR SCORE</h4>
             <div className="space-y-1 text-white/40 text-[8px] font-mono">
                <div className="flex justify-between items-center border-b border-white/5 py-1"><span>KISSES</span><span className="text-white font-bold">{kissesCount}</span></div>
                <div className="flex justify-between items-center border-b border-white/5 py-1"><span>HUGS</span><span className="text-white font-bold">{hugsCount}</span></div>
                <div className="flex justify-between items-center border-b border-white/5 py-1"><span>LICKS</span><span className="text-white font-bold">{licksCount}</span></div>
                <div className="flex justify-between items-center py-1"><span>REJECTION</span><span className="text-red-500 font-bold">{rejectionsCount}</span></div>
             </div>
          </div>
        </div>
      </div>

      <footer className="mt-20 py-8 border-t border-white/10 w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4 text-[8px] font-black tracking-[0.2em] md:tracking-[0.4em] text-white/10">
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