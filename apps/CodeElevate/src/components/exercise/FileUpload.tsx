import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <label className="text-text-secondary flex items-center">
        <Upload className="h-4 w-4 mr-1" />
        Upload Solution File:
      </label>
      <div className="relative">
        <input
          type="file"
          onChange={onUpload}
          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb"
        />
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm flex items-center shadow-sm transition-all duration-200">
          <Upload className="h-4 w-4 mr-1" />
          Choose File
        </button>
      </div>
    </div>
  );
};

export default FileUpload;
