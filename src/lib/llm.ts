interface LLMInput {
  bestek: string;
  inschrijving: string;
  checklist: Array<{
    id: string;
    vraag: string;
    categorie?: string;
    verplicht?: boolean;
    wegingsfactor?: number;
    toelichting?: string;
    wetsartikel?: string;
  }>;
}

interface LLMOutput {
  id: string;
  status: 'aanwezig' | 'ontbreekt' | 'inconsistent';
  toelichting: string;
  confidence?: number;
  bronverwijzing?: string;
}

export async function callLLM(input: LLMInput): Promise<LLMOutput[]> {
  const { bestek, inschrijving, checklist } = input;
  
  // Construct the prompt for the LLM
  const prompt = `
Je bent een ervaren aanbestedingsjurist. Analyseer de volgende documenten:

BESTEK:
${bestek.substring(0, 8000)} ${bestek.length > 8000 ? '...' : ''}

INSCHRIJVING:
${inschrijving.substring(0, 8000)} ${inschrijving.length > 8000 ? '...' : ''}

CHECKLIST:
${checklist.map(item => `${item.id}: ${item.vraag}`).join('\n')}

Voor elke checklist-vraag, beoordeel of de inschrijving voldoet aan de eis uit het bestek.

Geef voor elk item:
- status: "aanwezig", "ontbreekt", of "inconsistent"
- toelichting: korte uitleg met bronverwijzing indien mogelijk

Antwoord ALLEEN met een JSON array in dit formaat:
[
  { "id": "UEA", "status": "aanwezig", "toelichting": "UEA aanwezig op pagina 2, correct ondertekend" },
  { "id": "KvK", "status": "ontbreekt", "toelichting": "Geen KvK-uittreksel gevonden in de inschrijving" }
]
`;

  try {
    // In a real implementation, you would call your preferred LLM API here
    // For example: OpenAI, Anthropic, or a local model
    
    // Mock implementation for demonstration
    const mockResponse = await simulateLLMResponse(input);
    return mockResponse;
    
    // Real implementation would look like:
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Je bent een ervaren aanbestedingsjurist gespecialiseerd in Nederlandse aanbestedingswetgeving.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result;
    */
  } catch (error) {
    console.error('LLM call failed:', error);
    throw new Error(`LLM analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Mock LLM response for demonstration purposes
async function simulateLLMResponse(input: LLMInput): Promise<LLMOutput[]> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { bestek, inschrijving, checklist } = input;
  const results: LLMOutput[] = [];
  
  for (const item of checklist) {
    let status: 'aanwezig' | 'ontbreekt' | 'inconsistent';
    let toelichting: string;
    let confidence: number;
    
    // Simple keyword-based analysis for demonstration
    const keywords = extractKeywords(item.vraag);
    const foundInInschrijving = keywords.some(keyword => 
      inschrijving.toLowerCase().includes(keyword.toLowerCase())
    );
    const foundInBestek = keywords.some(keyword => 
      bestek.toLowerCase().includes(keyword.toLowerCase())
    );
    
    switch (item.id) {
      case 'UEA':
        if (inschrijving.toLowerCase().includes('uea') || inschrijving.toLowerCase().includes('uniform europees')) {
          status = 'aanwezig';
          toelichting = 'UEA-referentie gevonden in inschrijving, ondertekening gecontroleerd';
          confidence = 85;
        } else {
          status = 'ontbreekt';
          toelichting = 'Geen UEA of Uniform Europees Aanbestedingsdocument gevonden';
          confidence = 90;
        }
        break;
        
      case 'KvK':
        if (inschrijving.toLowerCase().includes('kvk') || inschrijving.toLowerCase().includes('kamer van koophandel')) {
          status = 'aanwezig';
          toelichting = 'KvK-uittreksel referentie gevonden, datum controle uitgevoerd';
          confidence = 80;
        } else {
          status = 'ontbreekt';
          toelichting = 'Geen KvK-uittreksel of handelsregister informatie aangetroffen';
          confidence = 85;
        }
        break;
        
      case 'Plan':
        if (inschrijving.toLowerCase().includes('plan') || inschrijving.toLowerCase().includes('aanpak')) {
          status = 'aanwezig';
          toelichting = 'Plan van aanpak gevonden met tijdplanning en methodiek';
          confidence = 75;
        } else {
          status = 'inconsistent';
          toelichting = 'Projectbeschrijving aanwezig maar geen formeel plan van aanpak';
          confidence = 60;
        }
        break;
        
      case 'Prijsblad':
        if (inschrijving.includes('€') || inschrijving.toLowerCase().includes('prijs')) {
          status = 'aanwezig';
          toelichting = 'Prijsinformatie en financiële gegevens aangetroffen';
          confidence = 80;
        } else {
          status = 'ontbreekt';
          toelichting = 'Geen prijsblad of financiële specificaties gevonden';
          confidence = 85;
        }
        break;
        
      case 'Referenties':
        if (inschrijving.toLowerCase().includes('referentie') || inschrijving.toLowerCase().includes('ervaring')) {
          status = 'aanwezig';
          toelichting = 'Projectreferenties met contactgegevens aanwezig';
          confidence = 75;
        } else {
          status = 'ontbreekt';
          toelichting = 'Geen referentieprojecten of ervaringsoverzicht gevonden';
          confidence = 80;
        }
        break;
        
      default:
        if (foundInInschrijving && foundInBestek) {
          status = 'aanwezig';
          toelichting = `Vereiste elementen aangetroffen in inschrijving`;
          confidence = 70;
        } else if (foundInInschrijving) {
          status = 'inconsistent';
          toelichting = `Gedeeltelijke informatie gevonden, nadere controle vereist`;
          confidence = 50;
        } else {
          status = 'ontbreekt';
          toelichting = `Geen relevante informatie aangetroffen voor deze eis`;
          confidence = 75;
        }
    }
    
    results.push({
      id: item.id,
      status,
      toelichting,
      confidence,
      bronverwijzing: foundInInschrijving ? 'Gevonden in inschrijvingsdocument' : undefined
    });
  }
  
  return results;
}

function extractKeywords(text: string): string[] {
  const stopwords = ['is', 'het', 'een', 'de', 'van', 'en', 'in', 'op', 'met', 'voor', 'aan', 'bij'];
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.includes(word));
}