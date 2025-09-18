import React, { useState } from 'react';
import { CheckSquare, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { beschikbareChecklists, type Checklist, type ChecklistItem } from '../data/checklists';

export default function ChecklistBeheer() {
  const [checklists, setChecklists] = useState<Checklist[]>(beschikbareChecklists);
  const [selectedChecklist, setSelectedChecklist] = useState<string>('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<ChecklistItem>>({
    vraag: '',
    categorie: 'Formele Vereisten',
    verplicht: true,
    wegingsfactor: 10,
    toelichting: '',
    voorbeelden: [],
    wetsartikel: ''
  });

  const categorieën = [
    'Formele Vereisten',
    'Geschiktheidseisen',
    'Technische Specificaties',
    'Financiële Aspecten',
    'EU-Compliance',
    'Kwaliteitseisen',
    'Duurzaamheid'
  ];

  const selectedChecklistData = checklists.find(c => c.id === selectedChecklist);

  const handleAddItem = () => {
    if (!selectedChecklistData || !newItem.vraag) return;

    const item: ChecklistItem = {
      id: `item-${Date.now()}`,
      vraag: newItem.vraag,
      categorie: newItem.categorie || 'Formele Vereisten',
      verplicht: newItem.verplicht || true,
      wegingsfactor: newItem.wegingsfactor || 10,
      toelichting: newItem.toelichting || '',
      voorbeelden: newItem.voorbeelden || [],
      wetsartikel: newItem.wetsartikel
    };

    const updatedChecklists = checklists.map(checklist => 
      checklist.id === selectedChecklist 
        ? { ...checklist, items: [...checklist.items, item] }
        : checklist
    );

    setChecklists(updatedChecklists);
    setNewItem({
      vraag: '',
      categorie: 'Formele Vereisten',
      verplicht: true,
      wegingsfactor: 10,
      toelichting: '',
      voorbeelden: [],
      wetsartikel: ''
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedChecklists = checklists.map(checklist => 
      checklist.id === selectedChecklist 
        ? { ...checklist, items: checklist.items.filter(item => item.id !== itemId) }
        : checklist
    );
    setChecklists(updatedChecklists);
  };

  const getVerplichtheidColor = (verplicht: boolean) => {
    return verplicht ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  const getCategorieColor = (categorie: string) => {
    const colors: { [key: string]: string } = {
      'Formele Vereisten': 'bg-purple-100 text-purple-800',
      'Geschiktheidseisen': 'bg-blue-100 text-blue-800',
      'Technische Specificaties': 'bg-green-100 text-green-800',
      'Financiële Aspecten': 'bg-yellow-100 text-yellow-800',
      'EU-Compliance': 'bg-red-100 text-red-800',
      'Kwaliteitseisen': 'bg-indigo-100 text-indigo-800',
      'Duurzaamheid': 'bg-emerald-100 text-emerald-800'
    };
    return colors[categorie] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Checklist Beheer</h2>
        <p className="text-gray-600">Beheer en onderhoud van aanbestedingschecklists</p>
      </div>

      {/* Checklist Selectie */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Checklist Selecteren</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {checklists.map(checklist => (
            <div
              key={checklist.id}
              onClick={() => setSelectedChecklist(checklist.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedChecklist === checklist.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-500">{checklist.items.length} items</span>
              </div>
              <h4 className="font-medium text-gray-900">{checklist.naam}</h4>
              <p className="text-sm text-gray-600 mt-1">{checklist.beschrijving}</p>
              <p className="text-xs text-gray-500 mt-2">Versie {checklist.versie}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedChecklistData && (
        <>
          {/* Checklist Overzicht */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedChecklistData.naam} - Items ({selectedChecklistData.items.length})
              </h3>
              <div className="text-sm text-gray-500">
                Laatst gewijzigd: {selectedChecklistData.laatstGewijzigd.toLocaleDateString('nl-NL')}
              </div>
            </div>

            {/* Statistieken */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600">Verplichte Items</p>
                <p className="text-xl font-bold text-red-700">
                  {selectedChecklistData.items.filter(item => item.verplicht).length}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600">Optionele Items</p>
                <p className="text-xl font-bold text-blue-700">
                  {selectedChecklistData.items.filter(item => !item.verplicht).length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-600">Categorieën</p>
                <p className="text-xl font-bold text-green-700">
                  {new Set(selectedChecklistData.items.map(item => item.categorie)).size}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-600">Totale Weging</p>
                <p className="text-xl font-bold text-purple-700">
                  {selectedChecklistData.items.reduce((sum, item) => sum + item.wegingsfactor, 0)}%
                </p>
              </div>
            </div>

            {/* Items Lijst */}
            <div className="space-y-4">
              {selectedChecklistData.items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategorieColor(item.categorie)}`}>
                          {item.categorie}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getVerplichtheidColor(item.verplicht)}`}>
                          {item.verplicht ? 'Verplicht' : 'Optioneel'}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {item.wegingsfactor}%
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{item.vraag}</h4>
                      {item.toelichting && (
                        <p className="text-sm text-gray-600 mb-2">{item.toelichting}</p>
                      )}
                      {item.wetsartikel && (
                        <p className="text-xs text-blue-600 mb-2">📖 {item.wetsartikel}</p>
                      )}
                      {item.voorbeelden.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Voorbeelden:</p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {item.voorbeelden.map((voorbeeld, idx) => (
                              <li key={idx}>{voorbeeld}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nieuw Item Toevoegen */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nieuw Checklist Item Toevoegen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vraag/Vereiste *
                </label>
                <textarea
                  value={newItem.vraag || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, vraag: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Formuleer de checklist vraag..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categorie
                </label>
                <select
                  value={newItem.categorie || 'Formele Vereisten'}
                  onChange={(e) => setNewItem(prev => ({ ...prev, categorie: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categorieën.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wegingsfactor (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newItem.wegingsfactor || 10}
                  onChange={(e) => setNewItem(prev => ({ ...prev, wegingsfactor: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wetsartikel (optioneel)
                </label>
                <input
                  type="text"
                  value={newItem.wetsartikel || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, wetsartikel: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="bijv. Art. 2.16 Aanbestedingswet"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="verplicht"
                  checked={newItem.verplicht || false}
                  onChange={(e) => setNewItem(prev => ({ ...prev, verplicht: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="verplicht" className="ml-2 text-sm text-gray-700">
                  Verplichte vereiste
                </label>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Toelichting
                </label>
                <textarea
                  value={newItem.toelichting || ''}
                  onChange={(e) => setNewItem(prev => ({ ...prev, toelichting: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Geef een toelichting op deze vereiste..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voorbeelden (één per regel)
                </label>
                <textarea
                  value={newItem.voorbeelden?.join('\n') || ''}
                  onChange={(e) => setNewItem(prev => ({ 
                    ...prev, 
                    voorbeelden: e.target.value.split('\n').filter(line => line.trim()) 
                  }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Voer voorbeelden in, één per regel..."
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleAddItem}
                disabled={!newItem.vraag}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Item Toevoegen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}