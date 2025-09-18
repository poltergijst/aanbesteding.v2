import React, { useState, useEffect } from 'react';
import { Shield, X, Check } from 'lucide-react';

export default function PrivacyNotice() {
  const [showNotice, setShowNotice] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('privacy-accepted');
    if (!hasAccepted) {
      setShowNotice(true);
    } else {
      setAccepted(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy-accepted', 'true');
    setAccepted(true);
    setShowNotice(false);
  };

  const handleDecline = () => {
    // In een echte implementatie zou je de gebruiker doorverwijzen
    alert('Deze applicatie vereist akkoord met de privacy voorwaarden.');
  };

  if (!showNotice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Privacy & Gegevensbescherming</h2>
          </div>
          
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              Deze aanbestedingsmanagement applicatie verwerkt persoonsgegevens conform de AVG/GDPR.
            </p>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Welke gegevens verzamelen wij?</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Bedrijfsgegevens van inschrijvers (naam, KvK, contactgegevens)</li>
                <li>Documenten geüpload voor aanbestedingsprocedures</li>
                <li>Beoordelingen en juridische analyses</li>
                <li>Technische logs voor systeembeheer</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Hoe gebruiken wij uw gegevens?</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Voor het uitvoeren van aanbestedingsprocedures</li>
                <li>Voor juridische compliance controles</li>
                <li>Voor het genereren van rapporten en analyses</li>
                <li>Voor systeembeheer en beveiliging</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Uw rechten</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Recht op inzage van uw gegevens</li>
                <li>Recht op rectificatie van onjuiste gegevens</li>
                <li>Recht op verwijdering (onder voorwaarden)</li>
                <li>Recht op dataportabiliteit</li>
                <li>Recht om bezwaar te maken tegen verwerking</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Beveiliging</h3>
              <p>
                Wij implementeren passende technische en organisatorische maatregelen 
                om uw gegevens te beschermen tegen ongeautoriseerde toegang, verlies of misbruik.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Bewaartermijn</h3>
              <p>
                Gegevens worden bewaard conform wettelijke verplichtingen voor overheidsopdrachten 
                (minimaal 7 jaar na afronding van de procedure).
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
              <p>
                Voor vragen over gegevensbescherming kunt u contact opnemen met onze 
                Functionaris Gegevensbescherming via privacy@gemeente.nl
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Weigeren
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Check className="h-4 w-4 mr-2" />
              Akkoord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}