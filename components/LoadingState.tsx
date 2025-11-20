import React from 'react';

interface LoadingStateProps {
  status: 'analyzing_image' | 'searching_catalogs';
}

const LoadingState: React.FC<LoadingStateProps> = ({ status }) => {
  return (
    <div className="w-full py-12 flex flex-col items-center justify-center space-y-6 animate-pulse">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🔍</span>
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-medium text-slate-800">
          {status === 'analyzing_image' ? 'Görsel Detaylar İnceleniyor...' : 'Kataloglar Taranıyor...'}
        </h3>
        <p className="text-slate-500 text-sm max-w-md">
          {status === 'analyzing_image' 
            ? 'Yapay zeka, perfore, damga ve tasarım detaylarını analiz ediyor.' 
            : 'Scott, Michel ve Stanley Gibbons veritabanları kontrol ediliyor.'}
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
