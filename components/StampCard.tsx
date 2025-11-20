import React, { useState } from 'react';
import { StampData, Rarity } from '../types';
import { BookmarkIcon, ShareIcon, ArrowTopRightOnSquareIcon, BookOpenIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline';

interface StampCardProps {
  data: StampData;
  imageSrc: string;
  onAddToCollection: () => void;
}

const RarityBadge: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
  let colorClass = "";
  switch (rarity) {
    case Rarity.RARE:
      colorClass = "bg-red-100 text-red-800 border-red-200";
      break;
    case Rarity.SCARCE:
      colorClass = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case Rarity.COMMON:
    default:
      colorClass = "bg-slate-100 text-slate-600 border-slate-200";
      break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wide ${colorClass}`}>
      {rarity}
    </span>
  );
};

const StampCard: React.FC<StampCardProps> = ({ data, imageSrc, onAddToCollection }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  // Helper to generate a smart catalog URL
  const getCatalogSearchUrl = () => {
    // Priority 1: Check if any grounding URL is a known philatelic database
    const philatelicDomains = ['colnect.com', 'stampworld.com', 'touchstamps.com', 'freestampcatalogue.com', 'findyourstampsvalue.com'];
    const directLink = data.groundingUrls.find(url => 
      philatelicDomains.some(domain => url.toLowerCase().includes(domain))
    );

    if (directLink) return directLink;

    // Priority 2: Construct a targeted Google Search
    // "Country Name" "Scott/Michel #" "Stamp Title"
    const catalogQuery = data.catalogRef && data.catalogRef !== 'Katalog bilgisi yok' ? data.catalogRef : '';
    const searchQuery = `${data.country} stamp ${catalogQuery} ${data.title}`;
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const catalogUrl = getCatalogSearchUrl();

  const handleSave = () => {
    if (isSaved) return;
    onAddToCollection();
    setIsSaved(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 md:flex animate-fade-in-up">
      
      {/* Image Section */}
      <div className="md:w-1/2 bg-slate-50 p-8 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="relative group perspective-1000">
            <img 
              src={imageSrc} 
              alt={data.title} 
              className="max-h-96 w-auto object-contain shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-sm transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1 border-4 border-white"
            />
        </div>
      </div>

      {/* Details Section */}
      <div className="md:w-1/2 p-8 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{data.country} • {data.year}</p>
            <h2 className="text-3xl font-serif font-bold text-slate-900 mt-1">{data.title}</h2>
          </div>
          <RarityBadge rarity={data.rarity} />
        </div>

        {/* Value Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Tahmini Değer</p>
              <p className="text-2xl font-bold text-emerald-600 font-sans">{data.valueUsd}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold uppercase">Katalog Ref</p>
              <p className="text-sm font-medium text-slate-700">{data.catalogRef}</p>
            </div>
          </div>
          {data.conditionNote && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-amber-600 italic">
                ⚠️ {data.conditionNote}
              </p>
            </div>
          )}
        </div>

        {/* Special Status Alert (Only if rarityReason exists) */}
        {data.rarityReason && (
          <div className="mb-6 bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
            <div className="bg-purple-100 p-1.5 rounded-full flex-shrink-0">
               <SparklesIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Özel Durum / Nadirlik Sebebi</p>
              <p className="text-sm font-medium text-purple-900 leading-snug">
                {data.rarityReason}
              </p>
            </div>
          </div>
        )}

        {/* History */}
        <div className="mb-6 flex-grow">
          <h3 className="text-sm font-bold text-slate-900 uppercase mb-2">Tarihçe & Detaylar</h3>
          <p className="text-slate-600 leading-relaxed text-sm md:text-base font-light">
            {data.description}
          </p>
        </div>

        {/* Grounding Sources */}
        {data.groundingUrls.length > 0 && (
          <div className="mb-6">
             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Kaynaklar</h4>
             <div className="flex flex-wrap gap-2">
               {data.groundingUrls.slice(0, 3).map((url, idx) => (
                 <a 
                  key={idx} 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                 >
                   <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
                   Kaynak {idx + 1}
                 </a>
               ))}
             </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-auto">
          <div className="flex gap-3">
            <button 
              onClick={handleSave}
              disabled={isSaved}
              className={`flex-1 py-3 rounded-xl font-medium transition-colors shadow-lg flex items-center justify-center
                ${isSaved 
                  ? 'bg-green-600 text-white shadow-green-200 cursor-default' 
                  : 'bg-ios-blue hover:bg-blue-600 text-white shadow-blue-200'
                }
              `}
            >
              {isSaved ? (
                <><CheckIcon className="w-5 h-5 mr-2" /> Koleksiyona Eklendi</>
              ) : (
                <><BookmarkIcon className="w-5 h-5 mr-2" /> Koleksiyona Ekle</>
              )}
            </button>
            <button className="w-14 h-14 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors">
              <ShareIcon className="w-6 h-6" />
            </button>
          </div>

          <a 
            href={catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors group"
          >
            <BookOpenIcon className="w-5 h-5 text-slate-500 group-hover:text-slate-800" />
            <span>Katalogda İncele</span>
            {data.catalogRef && data.catalogRef !== 'Katalog bilgisi yok' && (
              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600 hidden sm:inline-block">
                {data.catalogRef}
              </span>
            )}
          </a>
        </div>

      </div>
    </div>
  );
};

export default StampCard;