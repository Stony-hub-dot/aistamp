import React from 'react';
import { GlobeAmericasIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  onNavigate: (view: 'home' | 'collection') => void;
  currentView: 'home' | 'collection';
  collectionCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, collectionCount }) => {
  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <GlobeAmericasIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-serif font-bold text-slate-900 tracking-tight">
              GlobalStamp <span className="text-blue-600">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => onNavigate('home')}
              className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Ana Sayfa
            </button>
            <button 
              onClick={() => onNavigate('collection')}
              className={`relative text-sm font-medium transition-colors ${currentView === 'collection' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Koleksiyonum
              {collectionCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {collectionCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 ring-2 ring-white shadow-sm"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};