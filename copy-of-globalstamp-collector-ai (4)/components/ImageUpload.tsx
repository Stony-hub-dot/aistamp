import React, { useRef, useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  disabled: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`relative group cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 p-8 md:p-12 text-center
        ${isDragging ? 'border-blue-500 bg-blue-50 scale-[1.02]' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-blue-200 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-100'}`}>
          <PhotoIcon className="w-10 h-10 md:w-12 md:h-12" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium text-slate-700">Pul Fotoğrafı Yükle</p>
          <p className="text-sm text-slate-400">veya sürükleyip bırakın</p>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
