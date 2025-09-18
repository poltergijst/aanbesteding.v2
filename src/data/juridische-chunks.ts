export interface JuridischeChunk {
  id: string;
  bron: string;
  hoofdstuk?: string;
  artikel?: string;
  paragraaf?: string;
  text: string;
  tags?: string[];
  datum?: Date;
}

// Voorbeeld dataset van Aanbestedingswet en ARW chunks
export const juridischeChunks: JuridischeChunk[] = [
  {
    id: "wet-2.84",
    bron: "Aanbestedingswet 2012",
    hoofdstuk: "Hoofdstuk 2",
    artikel: "2.84",
    text: "De aanbestedende dienst kan verlangen dat een inschrijver een Uniform Europees Aanbestedingsdocument (UEA) overlegt. Het UEA moet volledig worden ingevuld en rechtsgeldig ondertekend.",
    tags: ["UEA", "ESPD", "ondertekening", "formele vereisten"],
    datum: new Date('2012-07-01')
  },
  {
    id: "wet-2.93",
    bron: "Aanbestedingswet 2012",
    hoofdstuk: "Hoofdstuk 2",
    artikel: "2.93",
    text: "Een inschrijving die niet voldoet aan de door de aanbestedende dienst gestelde eisen wordt terzijde gelegd, tenzij het gaat om een herstelbare vormfout.",
    tags: ["inschrijving", "eisen", "vormfout", "terzijde leggen"],
    datum: new Date('2012-07-01')
  },
  {
    id: "arw-2.5.3",
    bron: "ARW 2016",
    paragraaf: "2.5.3",
    text: "De inschrijver dient een recent uittreksel uit het handelsregister (KvK) te overleggen, niet ouder dan zes maanden.",
    tags: ["KvK", "handelsregister", "uittreksel", "zes maanden", "geschiktheidseisen"],
    datum: new Date('2016-07-01')
  },
  {
    id: "arw-3.1.2",
    bron: "ARW 2016",
    paragraaf: "3.1.2",
    text: "Het plan van aanpak moet ten minste de methodiek, planning en kwaliteitsbewaking beschrijven, conform de eisen in het bestek.",
    tags: ["plan van aanpak", "methodiek", "planning", "kwaliteitsbewaking", "bestek"],
    datum: new Date('2016-07-01')
  },
  {
    id: "arw-4.2.1",
    bron: "ARW 2016",
    paragraaf: "4.2.1",
    text: "Het inschrijvingsbiljet en prijsblad moeten volledig ingevuld en door een bevoegd vertegenwoordiger ondertekend zijn.",
    tags: ["inschrijvingsbiljet", "prijsblad", "ondertekening", "bevoegd vertegenwoordiger"],
    datum: new Date('2016-07-01')
  },
  {
    id: "arw-4.3.5",
    bron: "ARW 2016",
    paragraaf: "4.3.5",
    text: "De inschrijver moet referenties overleggen die aantonen dat hij voldoet aan de gevraagde ervaringseisen.",
    tags: ["referenties", "ervaring", "ervaringseisen", "geschiktheidseisen"],
    datum: new Date('2016-07-01')
  },
  // Aanvullende chunks voor completere testing
  {
    id: "wet-2.16",
    bron: "Aanbestedingswet 2012",
    hoofdstuk: "Hoofdstuk 2",
    artikel: "2.16",
    text: "Aanbestedende diensten maken hun voornemen tot het plaatsen van een overheidsopdracht bekend door middel van een aankondiging van de opdracht in het Publicatieblad van de Europese Unie.",
    tags: ["publicatie", "aankondiging", "EU publicatieblad", "bekendmaking"],
    datum: new Date('2012-07-01')
  },
  {
    id: "wet-2.18",
    bron: "Aanbestedingswet 2012",
    hoofdstuk: "Hoofdstuk 2",
    artikel: "2.18",
    text: "Aanbestedende diensten gunnen de overheidsopdracht op basis van het criterium van de economisch meest voordelige inschrijving, bepaald op basis van prijs of kosten of op basis van de beste prijs-kwaliteitverhouding.",
    tags: ["gunningscriteria", "economisch meest voordelig", "prijs-kwaliteitverhouding"],
    datum: new Date('2012-07-01')
  },
  {
    id: "wet-2.20",
    bron: "Aanbestedingswet 2012",
    hoofdstuk: "Hoofdstuk 2",
    artikel: "2.20",
    text: "Aanbestedende diensten sluiten een ondernemer uit van deelneming aan een aanbestedingsprocedure wanneer zij er kennis van hebben dat die ondernemer bij onherroepelijk vonnis is veroordeeld wegens deelneming aan een criminele organisatie, corruptie, fraude of witwassen van geld.",
    tags: ["uitsluitingsgronden", "criminele organisatie", "corruptie", "fraude", "witwassen"],
    datum: new Date('2012-07-01')
  },
  {
    id: "wet-2.21",
    bron: "Aanbestedingswet 2012",
    hoofdstuk: "Hoofdstuk 2",
    artikel: "2.21",
    text: "Aanbestedende diensten kunnen eisen stellen betreffende de geschiktheid van ondernemers om overheidsopdrachten uit te voeren. De eisen hebben betrekking op bevoegdheid tot uitoefening van de beroepsactiviteit, economische en financiële draagkracht, en technische bekwaamheid.",
    tags: ["geschiktheidseisen", "beroepsactiviteit", "financiële draagkracht", "technische bekwaamheid"],
    datum: new Date('2012-07-01')
  }
];

// Helper functie om chunks te zoeken op basis van tags of tekst
export function zoekJuridischeChunks(query: string): JuridischeChunk[] {
  const queryLower = query.toLowerCase();
  
  return juridischeChunks.filter(chunk => 
    chunk.text.toLowerCase().includes(queryLower) ||
    chunk.tags?.some(tag => tag.toLowerCase().includes(queryLower)) ||
    chunk.artikel?.toLowerCase().includes(queryLower) ||
    chunk.paragraaf?.toLowerCase().includes(queryLower)
  );
}

// Helper functie om chunks te groeperen per bron
export function groepeerPerBron(): { [bron: string]: JuridischeChunk[] } {
  return juridischeChunks.reduce((acc, chunk) => {
    if (!acc[chunk.bron]) {
      acc[chunk.bron] = [];
    }
    acc[chunk.bron].push(chunk);
    return acc;
  }, {} as { [bron: string]: JuridischeChunk[] });
}

// Mock functie om juridische context op te halen (vervangt Weaviate voor testing)
export function haalJuridischeContext(query: string, maxResults: number = 3): JuridischeChunk[] {
  const resultaten = zoekJuridischeChunks(query);
  
  // Sorteer op relevantie (simpele keyword matching score)
  const gesorteerdeResultaten = resultaten.map(chunk => ({
    chunk,
    score: berekenRelevantieScore(chunk, query)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults)
  .map(item => item.chunk);
  
  return gesorteerdeResultaten;
}

// Helper functie om relevantie score te berekenen
function berekenRelevantieScore(chunk: JuridischeChunk, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  let score = 0;
  
  // Score voor matches in tekst
  queryWords.forEach(word => {
    if (chunk.text.toLowerCase().includes(word)) {
      score += 2;
    }
  });
  
  // Extra score voor matches in tags
  chunk.tags?.forEach(tag => {
    queryWords.forEach(word => {
      if (tag.toLowerCase().includes(word)) {
        score += 3;
      }
    });
  });
  
  // Extra score voor matches in artikel/paragraaf
  queryWords.forEach(word => {
    if (chunk.artikel?.toLowerCase().includes(word) || chunk.paragraaf?.toLowerCase().includes(word)) {
      score += 5;
    }
  });
  
  return score;
}