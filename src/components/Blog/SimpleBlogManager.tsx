import React from 'react';
import { FileText, Plus } from 'lucide-react';

const SimpleBlogManager: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blogginnlegg</h1>
          <p className="text-gray-600">Administrer blogginnlegg fra Supabase</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus size={16} />
          Nytt Innlegg
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Totalt</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="w-4 h-4 text-green-600">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Publisert</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="w-4 h-4 text-yellow-600">✏️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Utkast</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-yellow-600">⚙️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Supabase-konfigurasjon kreves
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p className="mb-2">For å aktivere blogg-funksjonaliteten:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Opprett <code className="bg-yellow-100 px-1 rounded">.env.local</code> fil</li>
                <li>Legg til dine Supabase-detaljer</li>
                <li>Restart utviklingsserveren</li>
              </ol>
              
              <div className="mt-3 p-3 bg-yellow-100 rounded text-xs font-mono">
                VITE_SUPABASE_URL=https://din-project.supabase.co<br/>
                VITE_SUPABASE_ANON_KEY=din-anon-key
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table placeholder */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Blogginnlegg</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500 py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p>Koble til Supabase for å se dine blogginnlegg</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleBlogManager;