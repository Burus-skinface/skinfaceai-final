
import React, { useRef } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { Upload } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <button
        onClick={triggerFileInput}
        className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200"
      >
        <Upload className="w-6 h-6" />
        Upload Photo
      </button>
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        capture="user"
        id="camera-input"
      />
      <label
        htmlFor="camera-input"
        className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-3 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-200"
      >
        <CameraIcon className="w-6 h-6" />
        Take Selfie
      </label>
    </div>
  );
};

export default ImageUploader;
