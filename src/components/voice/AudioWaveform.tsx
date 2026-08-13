import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export default function AudioWaveform({ stream, isActive }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isActive || !stream) {
      // Clean up audio references and animations
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state !== 'closed') {
          void audioCtxRef.current.close();
        }
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioCtxRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; // Smaller fftSize for a smooth visualizer
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Adjust canvas resolution for high-DPI displays
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const draw = () => {
        if (!canvasRef.current || !ctx || !analyserRef.current) return;
        animationRef.current = requestAnimationFrame(draw);

        const width = rect.width;
        const height = rect.height;

        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);

        // We will draw a centered, glowing double-sine/waveform like Gemini Live or Siri
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        // Calculate average amplitude/volume from the frequency data
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const volume = total / bufferLength; // 0 to 255
        const normalizedVolume = Math.min(volume / 120, 1.5); // scale volume for visual impact

        // Draw multiple overlapping colored wave lines
        const wavesCount = 3;
        const colors = [
          'rgba(147, 51, 234, 0.75)', // Purple
          'rgba(59, 130, 246, 0.65)',  // Blue
          'rgba(192, 132, 252, 0.45)', // Pink/violet
        ];

        const time = Date.now() * 0.008;

        for (let w = 0; w < wavesCount; w++) {
          ctx.beginPath();
          const waveColor = colors[w];
          ctx.strokeStyle = waveColor;

          // Add a glow effect
          ctx.shadowBlur = 8;
          ctx.shadowColor = waveColor;

          // Draw the wave across the canvas width
          for (let x = 0; x <= width; x += 3) {
            // A sine function combined with amplitude scaling by volume and edge fading
            const xPercent = x / width;
            // Face out amplitude at both ends of the canvas so it matches a clean voice mode view
            const edgeFade = Math.sin(xPercent * Math.PI); 

            // Add phase shift and frequency multiplier per wave line
            const phase = time + w * Math.PI / 3;
            const frequency = 0.03 + w * 0.01;
            const yOffset = Math.sin(x * frequency + phase) * (15 + normalizedVolume * 30) * edgeFade;

            const y = height / 2 + yOffset;

            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      };

      draw();
    } catch (e) {
      console.error('Failed to initialize AudioContext visualizer:', e);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stream, isActive]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 h-14 bg-white/5 border border-white/10 rounded-xl overflow-hidden px-4">
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-md block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
