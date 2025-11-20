import React from 'react';
import { CollectedStamp, Rarity } from '../types';
import { TrashIcon, CalendarDaysIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface CollectionViewProps {
  items: CollectedStamp[];
  onRemove: (id: string) => void;
  onNavigateHome: () => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({ items, onRemove, onNavigateHome }) => {
  
  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CalendarDaysIcon className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Koleksiyonunuz Boş</h2>
        <p className="text-slate-500 mb-8">Henüz hiç pul kaydetmediniz.</p>
        <button 
          onClick={onNavigateHome}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-blue-200"
        >
          Pul Taramaya Başla
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-900">Koleksiyonum</h2>
          <p className="text-slate-500 mt-1">{items.length} adet pul kaydedildi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className="relative h-48 bg-slate-50 p-4 flex items-center justify-center">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
              <img 
                src={`data:image/jpeg;base64,${item.imageBase64}`} 
                alt={item.title}
                className="h-full w-auto object-contain shadow-lg transform hover:scale-105 transition-transform duration-300"
              />
              <span className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                item.rarity === Rarity.RARE ? 'bg-red-100 text-red-800 border-red-200' :
                item.rarity === Rarity.SCARCE ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {item.rarity}
              </span>
            </div>
            
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase">{item.country} • {item.year}</p>
                <p className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{item.catalogRef}</p>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-lg mb-3 line-clamp-1">{item.title}</h3>
              
              <div className="flex items-center text-emerald-600 font-bold mb-4">
                <BanknotesIcon className="w-4 h-4 mr-1.5" />
                {item.valueUsd}
              </div>

              <div className="border-t border-slate-100 pt-4 mt-auto flex justify-between items-center">
                <span className="text-xs text-slate-400">
                  {new Date(item.dateAdded).toLocaleDateString('tr-TR')}
                </span>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                  title="Koleksiyondan Sil"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionView;