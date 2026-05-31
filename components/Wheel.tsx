import React, { useRef, useEffect } from 'react';
import { Segment } from '../types';
import { audioService } from '../services/audioService';

interface WheelProps {
  segments: Segment[];
  spinning: boolean;
  rotation: number;
  onSpinEnd: () => void;
}

// Wrap text into balanced lines of sensible character limits to avoid squishing and make reading effortless.
function wrapText(text: string, maxCharsPerLine: number = 13): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

const Wheel: React.FC<WheelProps> = ({ segments, spinning, rotation, onSpinEnd }) => {
  const wheelRef = useRef<SVGSVGElement>(null);
  const lastTickRotation = useRef(0);

  const numSegments = segments.length;
  const anglePerSegment = 360 / numSegments;

  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const handleTransitionEnd = () => {
      if (spinning) {
        onSpinEnd();
      }
    };

    wheel.addEventListener('transitionend', handleTransitionEnd);
    return () => wheel.removeEventListener('transitionend', handleTransitionEnd);
  }, [spinning, onSpinEnd]);

  useEffect(() => {
    if (!spinning) return;
    
    let animationFrameId: number;
    const checkTick = () => {
      if (wheelRef.current) {
        const style = window.getComputedStyle(wheelRef.current);
        const transform = style.transform;
        if (transform && transform !== 'none') {
          const values = transform.split('(')[1].split(')')[0].split(',');
          const a = parseFloat(values[0]);
          const b = parseFloat(values[1]);
          let currentRotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
          if (currentRotation < 0) currentRotation += 360;
          
          if (Math.abs(currentRotation - lastTickRotation.current) >= anglePerSegment) {
            audioService.playTick();
            lastTickRotation.current = currentRotation;
          }
        }
      }
      animationFrameId = requestAnimationFrame(checkTick);
    };
    
    animationFrameId = requestAnimationFrame(checkTick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [spinning, anglePerSegment]);

  return (
    <div className="relative w-full max-w-[600px] aspect-square mx-auto">
      {/* Pointer Container */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-40">
        <div className={`w-10 h-14 bg-white border-4 border-black shadow-[10px_10px_0px_var(--neon-pink)] flex flex-col items-center justify-start pt-1 transition-transform duration-200 ${spinning ? 'translate-y-2' : ''}`}>
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-black"></div>
        </div>
      </div>

      {/* Outer Glow Ring */}
      <div className={`absolute inset-0 rounded-full border-[20px] border-white/5 transition-all duration-1000 ${spinning ? 'scale-110 opacity-100' : 'scale-100 opacity-20'}`} style={{ boxShadow: spinning ? '0 0 120px rgba(0,255,255,0.4)' : 'none' }}></div>

      {/* Funky Animation Wrapper */}
      <div className={`w-full h-full relative ${spinning ? 'animate-wheel-funky' : ''}`}>
        {/* The Wheel */}
        <svg
          ref={wheelRef}
          viewBox="0 0 100 100"
          className={`w-full h-full drop-shadow-[0_0_50px_rgba(255,0,255,0.2)] transition-transform duration-[6500ms] cubic-bezier(0.1, 0, 0.1, 1) ${spinning ? 'spin-blur' : ''}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <defs>
            <filter id="textShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0.15" dy="0.15" stdDeviation="0.15" floodColor="black" floodOpacity="0.95" />
            </filter>
            <radialGradient id="hubGlow">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="#00ffff" />
            </radialGradient>
          </defs>

          <circle cx="50" cy="50" r="49" fill="#111" stroke="white" strokeWidth="1.5" />
          
          {segments.map((segment, i) => {
            const startAngle = i * anglePerSegment;
            const endAngle = (i + 1) * anglePerSegment;
            
            const x1 = 50 + 48 * Math.cos((Math.PI * (startAngle - 90)) / 180);
            const y1 = 50 + 48 * Math.sin((Math.PI * (startAngle - 90)) / 180);
            const x2 = 50 + 48 * Math.cos((Math.PI * (endAngle - 90)) / 180);
            const y2 = 50 + 48 * Math.sin((Math.PI * (endAngle - 90)) / 180);

            const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 48 48 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

            const isLongText = segment.label.length > 25;
            // Wrap text strictly to 11 characters to ensure a line changes and splits into multiple lines if it approaches borders
            const labelLines = wrapText(segment.label, 11);
            const numLines = labelLines.length;

            // Positioning text closer to the circumference (radius ~32.5pt to ~34.0pt from center)
            const fontSize = isLongText ? '2.5px' : '3.6px';
            const lineHeight = isLongText ? 2.8 : 3.8;
            const centerY = isLongText ? 16.5 : 17.5;

            return (
              <g key={segment.id}>
                <path
                  d={pathData}
                  fill={segment.color}
                  stroke="black"
                  strokeWidth="0.8"
                  className="punk-sector"
                />
                <g transform={`rotate(${startAngle + anglePerSegment / 2}, 50, 50)`}>
                  {labelLines.map((line, lIdx) => {
                    const yPos = centerY - ((numLines - 1) * lineHeight) / 2 + lIdx * lineHeight;
                    return (
                      <text
                        key={lIdx}
                        x="50"
                        y={yPos}
                        className="wheel-text pointer-events-none"
                        style={{ fontSize, filter: 'url(#textShadow)' }}
                        textAnchor="middle"
                      >
                        {line}
                      </text>
                    );
                  })}
                </g>
              </g>
            );
          })}
          
          {/* Hub Decor */}
          <circle cx="50" cy="50" r="10" fill="black" stroke="white" strokeWidth="1" />
          <circle cx="50" cy="50" r="6" fill="url(#hubGlow)" stroke="black" strokeWidth="1.5" className={spinning ? 'animate-pulse' : ''} />
        </svg>
      </div>
      
      {/* Decorative Outer Rim */}
      <div className={`absolute inset-[-15px] pointer-events-none rounded-full border border-white/10 transition-transform duration-[6500ms] ${spinning ? 'rotate-[-360deg]' : ''}`}></div>
      <div className={`absolute inset-[-5px] pointer-events-none rounded-full border border-cyan-400/20 transition-transform duration-[8000ms] ${spinning ? 'rotate-[720deg]' : ''}`}></div>
    </div>
  );
};

export default Wheel;