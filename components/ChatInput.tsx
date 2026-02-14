
import React, { useState, useRef, useEffect } from 'react';
import { ThemeMode, FileAttachment, Language } from '../types';
import { THEME_CONFIG, TRANSLATIONS } from '../constants';

interface ChatInputProps {
  onSend: (text: string, files: FileAttachment[]) => void;
  isLoading: boolean;
  theme: ThemeMode;
  language: Language;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, theme, language }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const config = THEME_CONFIG[theme];
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev.trim() + ' ' + transcript).trim());
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, [language]);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSend(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: event.target?.result as string,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
        <div className={`p-1.5 sm:p-2 rounded-[24px] sm:rounded-3xl shadow-2xl transition-all border-2 ${config.card} ${isListening ? 'border-pink-500 ring-4 ring-pink-500/20' : config.border}`}>

          {attachments.length > 0 && (
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-pink-500/10 scrollbar-hide">
              {attachments.map((file, idx) => (
                <div key={idx} className="relative group shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img src={file.data} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-1">
                        <svg className="w-6 h-6 text-pink-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[8px] text-center truncate w-full mt-1 opacity-70 px-1">{file.name}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg hover:bg-red-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-2 p-1">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 sm:p-3 rounded-xl hover:bg-pink-500/10 transition-all ${config.text} opacity-60 hover:opacity-100 active:scale-90`}
                title="Upload Files"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className={`p-2.5 sm:p-3 rounded-xl hover:bg-pink-500/10 transition-all ${config.text} opacity-60 hover:opacity-100 active:scale-90`}
                title="Open Camera"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileUpload}
              accept="*"
            />

            <input
              type="file"
              ref={cameraInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
            />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.inputPlaceholder}
              className={`flex-1 bg-transparent border-none focus:ring-0 p-2.5 sm:p-3 max-h-32 min-h-[44px] sm:min-h-[50px] resize-none overflow-y-auto text-sm sm:text-base leading-tight ${config.text} placeholder-pink-300/40`}
              rows={1}
            />

            <div className="flex items-center gap-1 sm:gap-2 pr-1">
              <button
                onClick={toggleVoice}
                className={`p-2.5 sm:p-3 rounded-xl transition-all ${isListening ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : `hover:bg-pink-500/10 ${config.text} opacity-60 hover:opacity-100`}`}
                title="Voice Input"
              >
                {isListening ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v10a3 3 0 01-3 3 3 3 0 01-3-3V3a3 3 0 013-3z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl gradient-pink text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 transform translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ChatInput;
