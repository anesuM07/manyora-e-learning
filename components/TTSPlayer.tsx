
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Pause, Play, Volume2, Waves } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { decodeAudio, decodeAudioData, generateTTS } from '../services/geminiService';

interface TTSPlayerProps {
  text: string;
}

const TTSPlayer: React.FC<TTSPlayerProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const handleToggle = async () => {
    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    if (!audioBuffer) {
      setIsLoading(true);
      try {
        const base64 = await generateTTS(text);
        const bytes = decodeAudio(base64);
        
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const buffer = await decodeAudioData(bytes, audioContextRef.current);
        setAudioBuffer(buffer);
        playBuffer(buffer);
      } catch (error) {
        console.error("TTS generation failed:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      playBuffer(audioBuffer);
    }
  };

  const playBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    
    sourceNodeRef.current = source;
    source.start(0);
    setIsPlaying(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center gap-8 bg-indigo-50/40 dark:bg-indigo-900/10 p-10 rounded-[32px] border border-indigo-100/50 dark:border-indigo-900/50 shadow-inner"
    >
      <motion.button
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        disabled={isLoading}
        className={`w-20 h-20 flex items-center justify-center rounded-2xl shadow-2xl transition-all disabled:opacity-50 relative overflow-hidden group ${
          isPlaying ? 'bg-indigo-900 text-white' : 'bg-indigo-600 text-white'
        }`}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {isLoading ? (
          <Loader2 className="w-10 h-10 animate-spin" strokeWidth={2.25} />
        ) : isPlaying ? (
          <Pause className="w-10 h-10 fill-current" strokeWidth={2.25} />
        ) : (
          <Play className="w-10 h-10 fill-current ml-1" strokeWidth={2.25} />
        )}
      </motion.button>
      
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
          <Waves size={20} strokeWidth={2.25} className="text-indigo-400 dark:text-indigo-500" />
          <p className="text-2xl font-black text-indigo-900 dark:text-indigo-300 tracking-tight leading-none">Smart Narration</p>
        </div>
        <p className="text-[11px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.25em] mt-2">
          {isPlaying ? "Streaming AI Logic..." : "High Fidelity AI Study Audio"}
        </p>
      </div>

      <div className="flex items-center gap-6 w-full sm:w-auto px-6">
        <div className="flex-1 sm:w-48 h-3 bg-indigo-100/60 dark:bg-indigo-900/30 rounded-full overflow-hidden relative shadow-inner">
          <AnimatePresence>
            {isPlaying && (
              <motion.div 
                initial={{ left: '-100%' }}
                animate={{ left: '0%' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 60, ease: "linear" }}
                className="absolute inset-0 bg-indigo-600 rounded-full shadow-lg" 
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-300 dark:text-indigo-600">
          <Volume2 className="w-6 h-6" strokeWidth={2.25} />
        </div>
      </div>
    </motion.div>
  );
};

export default TTSPlayer;
