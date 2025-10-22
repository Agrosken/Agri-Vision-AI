import React from 'react';
import { DroneIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <DroneIcon className="w-10 h-10 text-blue-600 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          Agri-Vision <span className="text-blue-600">AI</span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
