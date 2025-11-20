import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import ImageUpload from './components/ImageUpload';
import StampCard from './components/StampCard';
import LoadingState from './components/LoadingState';
import CollectionView from './components/CollectionView';
import { AnalysisState, CollectedStamp, StampData } from './types';
import { processStampImage } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'collection'>('home');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  
  // Check for API Key on mount
  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);
  
  // Collection State (persisted in localStorage)
  const [collection, setCollection] = useState<CollectedStamp[]>(() => {
    try {
      const saved = localStorage.getItem('stampCollection');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load collection", e);
      return [];
    }
  });

  // Save collection to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('stampCollection', JSON.stringify(collection));
    } catch (e) {
      console.error("LocalStorage quota exceeded", e);
    }
  }, [collection]);

  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
  });
  
  // Temporary base64 holder for current analysis
  const [currentBase64, setCurrentBase64] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    // Create local preview for UI
    const previewUrl = URL.createObjectURL(file);
    
    // Create Base64 for storage
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    setCurrentBase64(base64);

    setState({
      status: 'analyzing_image',
      data: null,
      imagePreview: previewUrl,
    });

    try {
      const result = await processStampImage(file);
      
      setState(prev => ({
        ...prev,
        status: 'complete',
        data: result
      }));

    } catch (error) {
      console.error(error);
      setState(prev => ({
        ...prev,
        status: 'error',
        error: "Pul tanımlanamadı veya bir hata oluştu. Lütfen daha net bir fotoğraf deneyin."
      }));
    }
  };

  const handleAddToCollection = () => {
    if (!state.data || !currentBase64) return;

    const newStamp: CollectedStamp = {
      ...state.data,
      id: Date.now().toString(),
      dateAdded: Date.now(),
      imageBase64: currentBase64
    };

    setCollection(prev => [newStamp, ...prev]);
  };

  const handleRemoveFromCollection = (id: string) => {
    setCollection(prev => prev.filter(item => item.id !== id));
  };

  const reset = () => {
    setState({ status: 'idle', data: null });
    setCurrentBase64(null);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <Header 
        onNavigate={setView} 
        currentView={view} 
        collectionCount={collection.length} 
      />

      {apiKeyMissing && (
        <div className="bg-red-600 text-white px-4 py-3 text-center text-sm font-bold">
          ⚠️ UYARI: API Anahtarı Eksik. Lütfen Vercel ayarlarında "API_KEY" ekleyin.
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* COLLECTION VIEW */}
        {view === 'collection' && (
          <CollectionView 
            items={collection} 
            onRemove={handleRemoveFromCollection} 
            onNavigateHome={() => setView('home')}
          />
        )}

        {/* HOME/SCANNER VIEW */}
        {view === 'home' && (
          <>
            {/* Intro Text (Only visible when idle) */}
            {state.status === 'idle' && (
              <div className="text-center mb-12 space-y-4 animate-fade-in">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 leading-tight">
                  Nadir Pulları <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Yapay Zeka ile Keşfedin</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto font-light">
                  Fotoğrafını çekin, saniyeler içinde Scott, Michel ve diğer kataloglardan alınan verilerle değerini ve tarihini öğrenin.
                </p>
              </div>
            )}

            {/* Upload Area */}
            {state.status === 'idle' && (
              <div className="max-w-xl mx-auto mb-12 animate-fade-in-up">
                <ImageUpload onImageSelected={handleImageSelect} disabled={apiKeyMissing} />
                <div className="mt-8 flex justify-center gap-6 text-sm text-slate-400">
                  <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Scott Catalog</span>
                  <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Michel</span>
                  <span className="flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Colnect</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {(state.status === 'analyzing_image' || state.status === 'searching_catalogs') && (
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-xl">
                {state.imagePreview && (
                  <img src={state.imagePreview} alt="Analyzing" className="w-32 h-32 object-cover rounded-xl mx-auto mb-6 opacity-80" />
                )}
                <LoadingState status={state.status} />
              </div>
            )}

            {/* Error State */}
            {state.status === 'error' && (
              <div className="max-w-xl mx-auto bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                <p className="text-red-600 font-medium mb-4">{state.error}</p>
                <button 
                  onClick={reset}
                  className="bg-white border border-red-200 text-red-600 px-6 py-2 rounded-full font-medium hover:bg-red-50 transition-colors"
                >
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Result Card */}
            {state.status === 'complete' && state.data && state.imagePreview && (
              <div className="space-y-8">
                <StampCard 
                  data={state.data} 
                  imageSrc={state.imagePreview} 
                  onAddToCollection={handleAddToCollection}
                />
                
                <div className="text-center">
                  <button 
                    onClick={reset}
                    className="text-slate-500 hover:text-slate-800 font-medium transition-colors border-b border-transparent hover:border-slate-800 pb-0.5"
                  >
                    Yeni Bir Pul Tara
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default App;