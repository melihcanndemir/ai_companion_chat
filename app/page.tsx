'use client';

import { useState, useEffect, useRef } from 'react';
import { PaperAirplaneIcon, HeartIcon, SparklesIcon, GlobeEuropeAfricaIcon, SpeakerWaveIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';

interface Message {
  id: string;
  role: string;
  content: string;
  timestamp: Date;
  isDeleted: boolean;
  isStarred: boolean;
  severity?: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isCancelledRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        try {
          const voices = window.speechSynthesis.getVoices();
          // Development ortamında console.log'ları göster
          if (process.env.NODE_ENV === 'development') {
            console.log("Mevcut sesler:", voices.map(v => `${v.name} (${v.lang})`));
          }
          
          // Önce en iyi İngilizce kadın seslerini dene
          let voice = voices.find(v => 
            (v.name.includes('Samantha') || // Mac OS kadın sesi
             v.name.includes('Microsoft Zira') || // Windows kadın sesi
             v.name.includes('Google US Female')) && // Google kadın sesi
            v.lang.includes('en')
          );
          
          // Bulunamadıysa herhangi bir İngilizce kadın sesini dene
          if (!voice) {
            voice = voices.find(v => 
              v.lang.includes('en') && 
              (v.name.toLowerCase().includes('female') || 
               v.name.toLowerCase().includes('woman') ||
               !v.name.toLowerCase().includes('male'))
            );
          }
          
          if (voice) {
            if (process.env.NODE_ENV === 'development') {
              console.log("Seçilen ses:", voice.name);
            }
            setSelectedVoice(voice);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log("Uygun İngilizce kadın sesi bulunamadı");
            }
          }
        } catch (error) {
          console.error('Ses yükleme hatası:', error);
        }
      }
    };

    if ('speechSynthesis' in window) {
      // İlk yükleme
      loadVoices();
      
      // Sesler hazır olduğunda tekrar dene
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const messages = await response.json();
        setChatHistory(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const speak = async (text: string) => {
    if (!window.speechSynthesis) return;
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentSentence = 0;
    
    const speakNextSentence = () => {
      if (currentSentence < sentences.length && !isCancelledRef.current) {
        const utterance = new SpeechSynthesisUtterance(sentences[currentSentence].trim());
        utterance.lang = 'en-US'; // İngilizce konuşma için
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          // Sesi daha genç ve kadınsı yapmak için ayarlar
          utterance.pitch = 1.32; // Daha tiz (genç kadın sesi için)
          utterance.rate = 1.0; // Biraz daha hızlı
          utterance.volume = 1.0;
        } else {
          // Eğer seçili ses yoksa, son bir deneme daha yap
          const voices = window.speechSynthesis.getVoices();
          const englishFemaleVoice = voices.find(v => 
            v.lang.includes('en') && 
            (v.name.toLowerCase().includes('female') || 
             !v.name.toLowerCase().includes('male'))
          );
          
          if (englishFemaleVoice) {
            utterance.voice = englishFemaleVoice;
            utterance.pitch = 1.3;
            utterance.rate = 1.1;
            utterance.volume = 1.0;
            setSelectedVoice(englishFemaleVoice);
          }
        }
        
        utterance.onend = () => {
          currentSentence++;
          speakNextSentence();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        setIsSpeaking(false);
      }
    };
    
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    isCancelledRef.current = false;
    speakNextSentence();
  };

  const stopSpeaking = () => {
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Component unmount olduğunda konuşmayı durdur
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleDelete = async (messageId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: messageId }),
      });

      if (response.ok) {
        setChatHistory(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const deleteAllMessages = async () => {
    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const messages = await response.json();
      setChatHistory(messages);
    } catch (error) {
      // Handle error silently or show a user-friendly message
      setIsLoading(false);
    }
  };

  const handleError = (error: Error) => {
    setIsLoading(false);
    setChatHistory(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
      timestamp: new Date(),
      isDeleted: false,
      isStarred: false,
      severity: 'error'
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Kullanıcı mesajını ekle
      const savedUserMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        isDeleted: false,
        isStarred: false
      };
      
      // Kullanıcı mesajını veritabanına kaydet
      const userMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedUserMessage)
      });

      if (!userMessageResponse.ok) {
        throw new Error('Kullanıcı mesajı kaydedilemedi');
      }
      
      setChatHistory(prev => [...prev, savedUserMessage]);

      // AI yanıtını ekle
      const aiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isDeleted: false,
        isStarred: false
      };

      setChatHistory(prev => [...prev, aiMessage]);

      // AI yanıtını al
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error('API yanıt vermedi');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Yanıt okunamadı');

      let content = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // AI yanıtını veritabanına kaydet
          const finalAiMessage = { ...aiMessage, content };
          const aiMessageResponse = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalAiMessage)
          });

          if (!aiMessageResponse.ok) {
            console.error('AI yanıtı veritabanına kaydedilemedi');
          }

          setIsLoading(false);
          break;
        }

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              content += json.message.content;
              setChatHistory(prev => 
                prev.map(msg => 
                  msg.id === aiMessage.id 
                    ? { ...msg, content } 
                    : msg
                )
              );
            }
          } catch (e) {
            console.error('JSON parse hatası:', e);
          }
        }
      }

    } catch (error) {
      console.error('Hata:', error);
      handleError(error instanceof Error ? error : new Error('Bir hata oluştu'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = (message: string) => {
    if ('speechSynthesis' in window) {
      try {
        if (isSpeaking) {
          stopSpeaking();
          return;
        }
        speak(message);
      } catch (error) {
        console.error('Error speaking message:', error);
      }
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await handleDelete(id);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const renderChatMessage = (chat: Message) => (
    <div
      key={chat.id}
      className={`flex ${
        chat.role === 'user' ? 'justify-end' : 'justify-start'
      } animate-fade-in-up group`}
    >
      <div
        className={`max-w-[80%] rounded-2xl p-4 shadow-lg relative ${
          chat.role === 'user'
            ? 'bg-gradient-to-r from-rose-400 to-sky-500 text-white'
            : 'bg-rose-100/80 dark:bg-rose-500/20 backdrop-blur-sm text-gray-800 dark:text-rose-100 border border-rose-200/50 dark:border-rose-500/30'
        } transform hover:scale-[1.02] transition-all duration-200`}
      >
        <div className="flex justify-between items-start gap-2">
          <p className="leading-relaxed whitespace-pre-wrap">{chat.content}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSpeakMessage(chat.content)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Speak message"
            >
              <SpeakerWaveIcon className="w-4 h-4" />
            </button>
            {chat.role === 'user' && (
              <button
                onClick={() => handleDeleteMessage(chat.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete message"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-800 dark:to-sky-900">
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <main className="relative min-h-screen flex flex-col p-4">
        {/* Back Button */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <Link 
            href="/profile"
            className="inline-flex items-center px-4 py-2 text-rose-600 hover:text-rose-700 transition-colors"
          >
            View Profile
          </Link>
        </div>

        <div className="container max-w-7xl mx-auto bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-rose-100/50 dark:border-sky-500/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-400 to-sky-500 p-6">
            <div className="flex items-center justify-between">
              {/* Sol taraf - Profil ve isim */}
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="relative group flex-shrink-0">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-400 to-sky-400 rounded-full opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-pulse-slow blur"></div>
                  <div className="relative">
                    <Image
                      src="/ai-avatar.jpg"
                      alt="Scarlett&apos;s Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-lg object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                  </div>
                </Link>
                <div className="text-white min-w-0">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-bold tracking-tight truncate">Scarlett</h1>
                    <SparklesIcon className="w-4 h-4 text-rose-200 animate-pulse flex-shrink-0" />
                    <GlobeEuropeAfricaIcon className="w-4 h-4 text-rose-200 flex-shrink-0" />
                  </div>
                  <p className="text-rose-100 font-medium flex items-center space-x-1 text-sm">
                    <HeartIcon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">LA's Art & Nature Enthusiast 🎨</span>
                  </p>
                </div>
              </div>

              {/* Sağ taraf - Butonlar */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={deleteAllMessages}
                  className="text-white/80 hover:text-white transition-colors flex items-center space-x-2 px-3 py-1 rounded-full hover:bg-rose-400/20"
                >
                  <XCircleIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
                <Link
                  href="/profile"
                  className="text-white/80 hover:text-white transition-colors text-sm underline-offset-4 hover:underline hidden sm:inline-block"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="h-[calc(100vh-16rem)] overflow-y-auto p-6 space-y-6">
            {chatHistory.map((chat) => (
              <div key={chat.id}>
                {renderChatMessage(chat)}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="relative border-t border-rose-200/20 dark:border-rose-500/20">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400/5 to-sky-500/5 backdrop-blur-sm" />
            <form onSubmit={handleSubmit} className="relative p-6" data-testid="chat-form">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className={`flex-1 rounded-full bg-white/80 dark:bg-gray-800/80 border-2 border-rose-200/50 dark:border-rose-500/30 
                  px-6 py-3 text-gray-800 dark:text-white placeholder-gray-400 
                  focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-500/40 
                  transition-all duration-200 shadow-lg hover:shadow-xl
                  backdrop-blur-md ${isLoading ? 'opacity-50' : ''}`}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`bg-gradient-to-r from-rose-400 to-sky-500 text-white rounded-full p-3 
                  hover:from-rose-500 hover:to-sky-600 transition-all duration-200 
                  shadow-lg hover:shadow-xl disabled:opacity-50 
                  transform hover:scale-105 hover:rotate-3
                  active:scale-95 active:-rotate-3 ${isLoading ? 'animate-pulse' : ''}`}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 