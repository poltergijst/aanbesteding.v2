export interface ChecklistItem {
  id: string;
  vraag: string;
  categorie: string;
  verplicht: boolean;
  wegingsfactor: number;
  toelichting: string;
  voorbeelden: string[];
  wetsartikel?: string;
}

export interface Checklist {
  id: string;
  naam: string;
  beschrijving: string;
  versie: string;
  items: ChecklistItem[];
  laatstGewijzigd: Date;
}

// Basis aanbestedingschecklist
export const basisAanbestedingsChecklist: Checklist = {
  id: 'basis-aanbesteding',
  naam: 'Basis Aanbestedingschecklist',
  beschrijving: 'Standaard checklist voor beoordeling van aanbestedingsinzendingen',
  versie: '1.0',
  laatstGewijzigd: new Date('2024-01-15'),
  items: [
    {
      id: 'UEA',
      vraag: 'Is het Uniform Europees Aanbestedingsdocument (UEA) aanwezig en ondertekend?',
      categorie: 'Formele Vereisten',
      verplicht: true,
      wegingsfactor: 20,
      toelichting: 'Het UEA is verplicht voor alle EU-aanbestedingen boven de drempelwaarde',
      voorbeelden: [
        'Volledig ingevuld UEA-formulier',
        'Digitale handtekening van bevoegd persoon',
        'Alle secties correct beantwoord'
      ],
      wetsartikel: 'Art. 2.16 Aanbestedingswet'
    },
    {
      id: 'KvK',
      vraag: 'Is er een recent uittreksel van de Kamer van Koophandel bijgevoegd?',
      categorie: 'Geschiktheidseisen',
      verplicht: true,
      wegingsfactor: 15,
      toelichting: 'KvK-uittreksel mag niet ouder zijn dan 6 maanden',
      voorbeelden: [
        'KvK-uittreksel niet ouder dan 6 maanden',
        'Bedrijfsgegevens komen overeen met inschrijving',
        'Rechtsvorm en activiteiten zijn relevant'
      ],
      wetsartikel: 'Art. 2.21 Aanbestedingswet'
    },
    {
      id: 'Plan',
      vraag: 'Bevat de inschrijving een plan van aanpak conform de eisen in het bestek?',
      categorie: 'Technische Specificaties',
      verplicht: true,
      wegingsfactor: 25,
      toelichting: 'Plan van aanpak moet alle gevraagde onderdelen bevatten',
      voorbeelden: [
        'Projectfasering en tijdplanning',
        'Methodiek en werkwijze',
        'Risicomanagement',
        'Kwaliteitsborging'
      ]
    },
    {
      id: 'Prijsblad',
      vraag: 'Is het prijsblad volledig ingevuld en correct ondertekend?',
      categorie: 'Financiële Aspecten',
      verplicht: true,
      wegingsfactor: 20,
      toelichting: 'Prijsblad moet alle gevraagde prijscomponenten bevatten',
      voorbeelden: [
        'Alle prijsvelden ingevuld',
        'BTW correct vermeld',
        'Handtekening van bevoegd persoon',
        'Prijzen in juiste valuta'
      ]
    },
    {
      id: 'Referenties',
      vraag: 'Zijn de gevraagde referenties volledig en aantoonbaar aanwezig?',
      categorie: 'Geschiktheidseisen',
      verplicht: true,
      wegingsfactor: 20,
      toelichting: 'Referenties moeten aantoonbaar en verifieerbaar zijn',
      voorbeelden: [
        'Minimaal aantal referenties aanwezig',
        'Contactgegevens opdrachtgevers',
        'Projectomschrijving en waarde',
        'Uitvoeringsdatum binnen gestelde termijn'
      ],
      wetsartikel: 'Art. 2.21 Aanbestedingswet'
    }
  ]
};

// Uitgebreide EU-checklist
export const euAanbestedingsChecklist: Checklist = {
  id: 'eu-aanbesteding',
  naam: 'EU Aanbestedingschecklist',
  beschrijving: 'Uitgebreide checklist voor EU-aanbestedingen boven drempelwaarde',
  versie: '1.0',
  laatstGewijzigd: new Date('2024-01-15'),
  items: [
    ...basisAanbestedingsChecklist.items,
    {
      id: 'Uitsluitingsgronden',
      vraag: 'Zijn alle uitsluitingsgronden correct beantwoord in het UEA?',
      categorie: 'EU-Compliance',
      verplicht: true,
      wegingsfactor: 15,
      toelichting: 'Controle op verplichte en facultatieve uitsluitingsgronden',
      voorbeelden: [
        'Strafrechtelijke veroordelingen',
        'Belasting- en sociale premies',
        'Insolventie en liquidatie',
        'Beroepsfouten'
      ],
      wetsartikel: 'Art. 2.20 Aanbestedingswet / EU-Richtlijn 2014/24/EU Art. 57'
    },
    {
      id: 'Geschiktheidscriteria',
      vraag: 'Voldoet de inschrijver aan alle gestelde geschiktheidscriteria?',
      categorie: 'EU-Compliance',
      verplicht: true,
      wegingsfactor: 15,
      toelichting: 'Verificatie van technische en financiële geschiktheid',
      voorbeelden: [
        'Financiële draagkracht',
        'Technische capaciteit',
        'Ervaring en referenties',
        'Personele bezetting'
      ],
      wetsartikel: 'Art. 2.21 Aanbestedingswet / EU-Richtlijn 2014/24/EU Art. 58'
    }
  ]
};

export const beschikbareChecklists: Checklist[] = [
  basisAanbestedingsChecklist,
  euAanbestedingsChecklist
];