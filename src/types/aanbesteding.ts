export interface Aanbesteding {
  id: string;
  titel: string;
  beschrijving: string;
  type: 'openbaar' | 'niet-openbaar' | 'concurrentiegerichte-dialoog' | 'onderhandelingsprocedure';
  status: 'voorbereiding' | 'concept' | 'gepubliceerd' | 'actief' | 'gesloten' | 'in-beoordeling' | 'beoordeeld' | 'juridisch-getoetst' | 'gegund' | 'afgerond';
  progressPercentage: number;
  currentStep: string;
  nextStep?: string;
  drempelwaarde: number;
  geschatteWaarde: number;
  publicatieDatum?: Date;
  sluitingsDatum: Date;
  gunningsCriteria: GunningsCriterium[];
  documenten: Document[];
  inzendingen: Inzending[];
  juridischeToetsing?: JuridischeToetsing;
  createdAt: Date;
  updatedAt: Date;
}

export interface GunningsCriterium {
  id: string;
  naam: string;
  beschrijving: string;
  wegingsfactor: number;
  type: 'prijs' | 'kwaliteit' | 'technisch' | 'duurzaamheid' | 'sociaal';
}

export interface Document {
  id: string;
  naam: string;
  type: 'bestek' | 'voorwaarden' | 'bijlage' | 'offerte' | 'bewijs';
  url: string;
  uploadDatum: Date;
  grootte: number;
}

export interface Inzending {
  id: string;
  aanbestedingId: string;
  indienerNaam: string;
  indienerKvK: string;
  indienerEmail: string;
  indienerTelefoon: string;
  inzendingsDatum: Date;
  documenten: Document[];
  beoordeling?: InzendingsBeoordeling;
  status: 'ingediend' | 'in-behandeling' | 'goedgekeurd' | 'afgewezen' | 'gegund';
}

export interface InzendingsBeoordeling {
  id: string;
  beoordelaar: string;
  beoordelingsDatum: Date;
  scores: { [criteriumId: string]: number };
  totaalScore: number;
  opmerkingen: string;
  juridischeCheck: boolean;
  manualBiasCheckDeclared: boolean;
  aanbeveling: 'gunnen' | 'afwijzen' | 'nadere-beoordeling';
}

export interface JuridischeToetsing {
  id: string;
  juristNaam: string;
  toetsingsDatum: Date;
  compliance: 'compliant' | 'niet-compliant' | 'onduidelijk';
  bevindingen: JuridischeBevinding[];
  risicos: JuridischRisico[];
  actiepunten: string[];
  doorverwijzingNodig: boolean;
  doorverwijzingReden?: string;
  opmerkingen: string;
}

export interface JuridischeBevinding {
  id: string;
  wetsartikel: string;
  beschrijving: string;
  status: 'voldoet' | 'voldoet-niet' | 'onduidelijk';
  toelichting: string;
}

export interface JuridischRisico {
  id: string;
  beschrijving: string;
  impact: 'laag' | 'middel' | 'hoog' | 'kritiek';
  waarschijnlijkheid: 'laag' | 'middel' | 'hoog';
  mitigatie: string;
}