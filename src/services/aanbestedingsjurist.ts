import type { ChecklistItem } from '../data/checklists';

export interface JuristBeoordelingInput {
  bestekTekst: string;
  inschrijvingTekst: string;
  checklist: ChecklistItem[];
}

export interface JuristBeoordelingOutput {
  id: string;
  status: 'aanwezig' | 'ontbreekt' | 'inconsistent';
  toelichting: string;
  confidence: number;
  bronverwijzing?: string;
  pagina?: number;
  paragraaf?: string;
}

class AanbestedingsJurist {
  /**
   * Hoofdfunctie: Beoordeel inschrijving tegen bestek en checklist
   */
  async beoordeelInschrijving(input: JuristBeoordelingInput): Promise<JuristBeoordelingOutput[]> {
    const resultaten: JuristBeoordelingOutput[] = [];

    for (const checklistItem of input.checklist) {
      const beoordeling = await this.beoordeelChecklistItem(
        checklistItem,
        input.bestekTekst,
        input.inschrijvingTekst
      );
      resultaten.push(beoordeling);
    }

    return resultaten;
  }

  /**
   * Beoordeel individueel checklist item
   */
  private async beoordeelChecklistItem(
    item: ChecklistItem,
    bestek: string,
    inschrijving: string
  ): Promise<JuristBeoordelingOutput> {
    
    // Zoek relevante content in inschrijving
    const relevanteSectiesInschrijving = this.vindRelevanteSecties(inschrijving, item);
    const relevanteSectiesBestek = this.vindRelevanteSecties(bestek, item);

    // Bepaal status op basis van item type
    let status: 'aanwezig' | 'ontbreekt' | 'inconsistent';
    let toelichting: string;
    let confidence: number;
    let bronverwijzing: string | undefined;

    switch (item.id) {
      case 'UEA':
        return this.controleerUEA(inschrijving);
      
      case 'KvK':
        return this.controleerKvK(inschrijving);
      
      case 'Plan':
        return this.controleerPlanVanAanpak(inschrijving, bestek);
      
      case 'Prijsblad':
        return this.controleerPrijsblad(inschrijving);
      
      case 'Referenties':
        return this.controleerReferenties(inschrijving, bestek);
      
      default:
        return this.generiekeBeoordeling(item, inschrijving, bestek);
    }
  }

  /**
   * Controleer UEA (Uniform Europees Aanbestedingsdocument)
   */
  private controleerUEA(inschrijving: string): JuristBeoordelingOutput {
    const ueaPatterns = [
      /uniform\s+europees\s+aanbestedingsdocument/i,
      /\bUEA\b/g,
      /espd/i,
      /european\s+single\s+procurement\s+document/i
    ];

    const handtekeningPatterns = [
      /ondertekend/i,
      /handtekening/i,
      /getekend/i,
      /signature/i
    ];

    const ueaGevonden = ueaPatterns.some(pattern => pattern.test(inschrijving));
    const handtekeningGevonden = handtekeningPatterns.some(pattern => pattern.test(inschrijving));

    if (ueaGevonden && handtekeningGevonden) {
      return {
        id: 'UEA',
        status: 'aanwezig',
        toelichting: 'UEA aanwezig en ondertekend gevonden',
        confidence: 85,
        bronverwijzing: this.vindBronverwijzing(inschrijving, ueaPatterns[0])
      };
    } else if (ueaGevonden && !handtekeningGevonden) {
      return {
        id: 'UEA',
        status: 'inconsistent',
        toelichting: 'UEA gevonden maar ondertekening onduidelijk',
        confidence: 70,
        bronverwijzing: this.vindBronverwijzing(inschrijving, ueaPatterns[0])
      };
    } else {
      return {
        id: 'UEA',
        status: 'ontbreekt',
        toelichting: 'Geen UEA gevonden in inschrijving',
        confidence: 90
      };
    }
  }

  /**
   * Controleer KvK-uittreksel
   */
  private controleerKvK(inschrijving: string): JuristBeoordelingOutput {
    const kvkPatterns = [
      /kamer\s+van\s+koophandel/i,
      /\bkvk\b/gi,
      /uittreksel/i,
      /handelsregister/i,
      /kvk[\-\s]*nummer/i,
      /kvk[\-\s]*uittreksel/i
    ];

    const datumPatterns = [
      /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g,
      /\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g
    ];

    const kvkGevonden = kvkPatterns.some(pattern => pattern.test(inschrijving));
    const datumGevonden = datumPatterns.some(pattern => pattern.test(inschrijving));

    if (kvkGevonden && datumGevonden) {
      // Controleer of datum recent is (binnen 6 maanden)
      const datums = inschrijving.match(datumPatterns[0]) || inschrijving.match(datumPatterns[1]);
      const isRecent = this.controleerRecenteDatum(datums);
      
      if (isRecent) {
        return {
          id: 'KvK',
          status: 'aanwezig',
          toelichting: 'Recent KvK-uittreksel aanwezig (binnen 6 maanden)',
          confidence: 85,
          bronverwijzing: this.vindBronverwijzing(inschrijving, kvkPatterns[0])
        };
      } else {
        return {
          id: 'KvK',
          status: 'inconsistent',
          toelichting: 'KvK-uittreksel gevonden maar mogelijk te oud (>6 maanden)',
          confidence: 75,
          bronverwijzing: this.vindBronverwijzing(inschrijving, kvkPatterns[0])
        };
      }
    } else if (kvkGevonden) {
      return {
        id: 'KvK',
        status: 'inconsistent',
        toelichting: 'KvK-verwijzing gevonden maar datum onduidelijk',
        confidence: 60,
        bronverwijzing: this.vindBronverwijzing(inschrijving, kvkPatterns[0])
      };
    } else {
      return {
        id: 'KvK',
        status: 'ontbreekt',
        toelichting: 'Geen KvK-uittreksel gevonden',
        confidence: 90
      };
    }
  }

  /**
   * Controleer Plan van Aanpak
   */
  private controleerPlanVanAanpak(inschrijving: string, bestek: string): JuristBeoordelingOutput {
    const planPatterns = [
      /plan\s+van\s+aanpak/i,
      /projectplan/i,
      /uitvoeringsplan/i,
      /werkplan/i,
      /aanpak/i
    ];

    const vereistePlanElementen = [
      /tijdplanning/i,
      /planning/i,
      /fasering/i,
      /methodiek/i,
      /werkwijze/i,
      /risico/i,
      /kwaliteit/i,
      /organisatie/i
    ];

    const planGevonden = planPatterns.some(pattern => pattern.test(inschrijving));
    
    if (planGevonden) {
      const aanwezigeElementen = vereistePlanElementen.filter(element => 
        element.test(inschrijving)
      ).length;
      
      const volledigheidsPercentage = (aanwezigeElementen / vereistePlanElementen.length) * 100;
      
      if (volledigheidsPercentage >= 75) {
        return {
          id: 'Plan',
          status: 'aanwezig',
          toelichting: `Plan van aanpak aanwezig met ${aanwezigeElementen}/${vereistePlanElementen.length} vereiste elementen`,
          confidence: 80,
          bronverwijzing: this.vindBronverwijzing(inschrijving, planPatterns[0])
        };
      } else if (volledigheidsPercentage >= 40) {
        return {
          id: 'Plan',
          status: 'inconsistent',
          toelichting: `Plan van aanpak gedeeltelijk aanwezig (${aanwezigeElementen}/${vereistePlanElementen.length} elementen)`,
          confidence: 65,
          bronverwijzing: this.vindBronverwijzing(inschrijving, planPatterns[0])
        };
      } else {
        return {
          id: 'Plan',
          status: 'inconsistent',
          toelichting: 'Plan van aanpak gevonden maar onvolledig',
          confidence: 70,
          bronverwijzing: this.vindBronverwijzing(inschrijving, planPatterns[0])
        };
      }
    } else {
      return {
        id: 'Plan',
        status: 'ontbreekt',
        toelichting: 'Geen plan van aanpak gevonden',
        confidence: 85
      };
    }
  }

  /**
   * Controleer Prijsblad
   */
  private controleerPrijsblad(inschrijving: string): JuristBeoordelingOutput {
    const prijsbladPatterns = [
      /prijsblad/i,
      /prijsopgave/i,
      /offerte/i,
      /prijsformulier/i,
      /kostenoverzicht/i
    ];

    const prijsElementen = [
      /€\s*[\d.,]+/g,
      /euro/i,
      /btw/i,
      /totaal/i,
      /subtotaal/i,
      /prijs/i
    ];

    const handtekeningPatterns = [
      /ondertekend/i,
      /handtekening/i,
      /getekend/i
    ];

    const prijsbladGevonden = prijsbladPatterns.some(pattern => pattern.test(inschrijving));
    const prijzenGevonden = prijsElementen.some(pattern => pattern.test(inschrijving));
    const handtekeningGevonden = handtekeningPatterns.some(pattern => pattern.test(inschrijving));

    if (prijsbladGevonden && prijzenGevonden && handtekeningGevonden) {
      return {
        id: 'Prijsblad',
        status: 'aanwezig',
        toelichting: 'Prijsblad volledig ingevuld en ondertekend',
        confidence: 85,
        bronverwijzing: this.vindBronverwijzing(inschrijving, prijsbladPatterns[0])
      };
    } else if (prijsbladGevonden && prijzenGevonden) {
      return {
        id: 'Prijsblad',
        status: 'inconsistent',
        toelichting: 'Prijsblad met prijzen gevonden maar ondertekening onduidelijk',
        confidence: 70,
        bronverwijzing: this.vindBronverwijzing(inschrijving, prijsbladPatterns[0])
      };
    } else if (prijzenGevonden) {
      return {
        id: 'Prijsblad',
        status: 'inconsistent',
        toelichting: 'Prijsinformatie gevonden maar geen formeel prijsblad',
        confidence: 60
      };
    } else {
      return {
        id: 'Prijsblad',
        status: 'ontbreekt',
        toelichting: 'Geen prijsblad of prijsinformatie gevonden',
        confidence: 90
      };
    }
  }

  /**
   * Controleer Referenties
   */
  private controleerReferenties(inschrijving: string, bestek: string): JuristBeoordelingOutput {
    const referentiePatterns = [
      /referentie/i,
      /ervaring/i,
      /project/i,
      /opdracht/i,
      /klant/i,
      /opdrachtgever/i
    ];

    const contactPatterns = [
      /contactpersoon/i,
      /telefoon/i,
      /email/i,
      /\b\d{2,4}[-\s]?\d{6,8}\b/g, // telefoonnummers
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g // email
    ];

    const waardePatterns = [
      /€\s*[\d.,]+/g,
      /waarde/i,
      /omvang/i
    ];

    const referentiesGevonden = referentiePatterns.some(pattern => pattern.test(inschrijving));
    const contactGevonden = contactPatterns.some(pattern => pattern.test(inschrijving));
    const waardeGevonden = waardePatterns.some(pattern => pattern.test(inschrijving));

    if (referentiesGevonden && contactGevonden && waardeGevonden) {
      return {
        id: 'Referenties',
        status: 'aanwezig',
        toelichting: 'Referenties met contactgegevens en projectwaarde aanwezig',
        confidence: 85,
        bronverwijzing: this.vindBronverwijzing(inschrijving, referentiePatterns[0])
      };
    } else if (referentiesGevonden && contactGevonden) {
      return {
        id: 'Referenties',
        status: 'inconsistent',
        toelichting: 'Referenties met contactgegevens maar projectwaarde onduidelijk',
        confidence: 70,
        bronverwijzing: this.vindBronverwijzing(inschrijving, referentiePatterns[0])
      };
    } else if (referentiesGevonden) {
      return {
        id: 'Referenties',
        status: 'inconsistent',
        toelichting: 'Referenties gevonden maar contactgegevens ontbreken',
        confidence: 60,
        bronverwijzing: this.vindBronverwijzing(inschrijving, referentiePatterns[0])
      };
    } else {
      return {
        id: 'Referenties',
        status: 'ontbreekt',
        toelichting: 'Geen referenties gevonden',
        confidence: 90
      };
    }
  }

  /**
   * Generieke beoordeling voor andere checklist items
   */
  private generiekeBeoordeling(
    item: ChecklistItem,
    inschrijving: string,
    bestek: string
  ): JuristBeoordelingOutput {
    const zoekwoorden = this.extracteerZoekwoorden(item.vraag);
    const gevondenMatches = zoekwoorden.filter(woord => 
      new RegExp(woord, 'i').test(inschrijving)
    );

    const matchPercentage = (gevondenMatches.length / zoekwoorden.length) * 100;

    if (matchPercentage >= 70) {
      return {
        id: item.id,
        status: 'aanwezig',
        toelichting: `Vereiste aangetroffen (${gevondenMatches.length}/${zoekwoorden.length} kernwoorden)`,
        confidence: Math.min(matchPercentage, 85),
        bronverwijzing: this.vindBronverwijzing(inschrijving, new RegExp(gevondenMatches[0], 'i'))
      };
    } else if (matchPercentage >= 30) {
      return {
        id: item.id,
        status: 'inconsistent',
        toelichting: `Vereiste gedeeltelijk aangetroffen (${gevondenMatches.length}/${zoekwoorden.length} kernwoorden)`,
        confidence: matchPercentage,
        bronverwijzing: this.vindBronverwijzing(inschrijving, new RegExp(gevondenMatches[0], 'i'))
      };
    } else {
      return {
        id: item.id,
        status: 'ontbreekt',
        toelichting: 'Vereiste niet aangetroffen in inschrijving',
        confidence: 85
      };
    }
  }

  /**
   * Hulpfuncties
   */
  private vindRelevanteSecties(tekst: string, item: ChecklistItem): string[] {
    const zoekwoorden = this.extracteerZoekwoorden(item.vraag);
    const zinnen = tekst.split(/[.!?]+/);
    
    return zinnen.filter(zin => 
      zoekwoorden.some(woord => new RegExp(woord, 'i').test(zin))
    );
  }

  private extracteerZoekwoorden(vraag: string): string[] {
    // Verwijder stopwoorden en extracteer kernwoorden
    const stopwoorden = ['is', 'het', 'een', 'de', 'van', 'en', 'in', 'op', 'met', 'voor', 'aan', 'bij', 'te', 'zijn', 'er', 'worden', 'wordt'];
    const woorden = vraag.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(woord => woord.length > 2 && !stopwoorden.includes(woord));
    
    return woorden;
  }

  private vindBronverwijzing(tekst: string, pattern: RegExp): string | undefined {
    const match = tekst.match(pattern);
    if (!match) return undefined;

    const index = tekst.indexOf(match[0]);
    const voorafgaandeTekst = tekst.substring(0, index);
    const regels = voorafgaandeTekst.split('\n');
    
    return `Regel ${regels.length}, gevonden: "${match[0]}"`;
  }

  private controleerRecenteDatum(datums: string[] | null): boolean {
    if (!datums || datums.length === 0) return false;
    
    const nu = new Date();
    const zesmaandenGeleden = new Date();
    zesmaandenGeleden.setMonth(nu.getMonth() - 6);

    return datums.some(datumStr => {
      const datum = new Date(datumStr.replace(/[-\/]/g, '/'));
      return datum >= zesmaandenGeleden;
    });
  }
}

export const aanbestedingsJurist = new AanbestedingsJurist();