import React from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-100 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-graphite-900 border border-graphite-800 text-indigo-400 flex items-center justify-center mx-auto shadow-2xl">
          <Film className="w-8 h-8" />
        </div>
        <h1 className="text-6xl font-black text-white">404</h1>
        <h2 className="text-lg font-bold text-graphite-300">Party Scene Not Found</h2>
        <p className="text-xs text-graphite-500 max-w-sm">
          The room or page you are looking for does not exist or may have expired.
        </p>
        <Link
          to="/"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};
