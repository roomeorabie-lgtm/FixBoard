import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Smartphone, 
  Cpu, 
  Share2, 
  Zap, 
  Layers, 
  X, 
  ArrowLeft, 
  Clock, 
  Activity,
  ChevronLeft
} from 'lucide-react';
import { searchEverything } from '../lib/dbService';
import { GlobalSearchResult } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: GlobalSearchResult) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        const data = await searchEverything(searchTerm);
        setResults(data);
        setIsSearching(false);
      } else {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  if (!isOpen) return null;

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'MODEL':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'IC':
        return <Cpu className="w-4 h-4 text-violet-400" />;
      case 'NET':
        return <Share2 className="w-4 h-4 text-amber-400" />;
      case 'TEST_POINT':
        return <Activity className="w-4 h-4 text-cyan-400" />;
      default:
        return <Zap className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top search input box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-cyan-400 ml-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="ابحث عن: اسم الهاتف، رقم الموديل، كود IC، رقم المكون R/C/U، أو مسار Line Name..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-white rounded ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 mr-2"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-800/60">
          {isSearching && (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2 space-x-reverse">
              <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin ml-2" />
              <span>جارٍ البحث في قاعدة البيانات...</span>
            </div>
          )}

          {!isSearching && searchTerm.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              لم يتم العثور على أجهزة أو مكونات مطابقة لـ "{searchTerm}".
            </div>
          )}

          {!isSearching && !searchTerm && (
            <div className="p-6 text-center text-slate-500 text-xs">
              اكتب اسم الموديل (مثل S23 أو 14 Pro) أو كود المكون (مثل U1001 أو PM8150) أو مسار التغذية (مثل VBUS أو VDD).
            </div>
          )}

          {!isSearching && results.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => {
                onSelectResult(item);
                onClose();
              }}
              className="p-3 hover:bg-slate-800/70 rounded-xl cursor-pointer transition flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:border-cyan-500/50 transition">
                  {getBadgeIcon(item.type)}
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition flex items-center space-x-2 space-x-reverse">
                    <span>{item.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</div>
                </div>
              </div>

              <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
