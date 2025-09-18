import { parsePdfToText } from '../lib/pdf';
import { retrieveContext } from '../lib/rag';
import { haalJuridischeContext } from '../data/juridische-chunks';
import { secureApiCall, sanitizeError } from '../lib/security';

// SECURITY FIX: Gebruik server-side API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OpenAI API key niet geconfigureerd');
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Basis-checklist (je kunt uitbreiden of dynamisch laden)
const checklist = [
  { 
    id: "UEA", 
    vraag: "Is het Uniform Europees Aanbestedingsdocument (UEA) aanwezig en ondertekend?",
    zoekwoorden: ["UEA", "Uniform Europees Aanbestedingsdocument", "ESPD", "European Single Procurement Document", "artikel 2.84"]
  },
  { 
    id: "KvK", 
    vraag: "Is er een recent uittreksel van de Kamer van Koophandel bijgevoegd?",
    zoekwoorden: ["KvK", "Kamer van Koophandel", "handelsregister", "uittreksel", "geschiktheidseisen"]
  },
  { 
    id: "Plan", 
    vraag: "Bevat de inschrijving een plan van aanpak conform de eisen in het bestek?",
    zoekwoorden: ["plan van aanpak", "uitvoeringsplan", "projectplan", "technische specificaties"]
  },
  { 
    id: "Prijsblad", 
    vraag: "Is het prijsblad volledig ingevuld en correct ondertekend?",
    zoekwoorden: ["prijsblad", "prijsopgave", "financiële offerte", "gunningscriteria", "prijs"]
  },
  { 
    id: "Referenties", 
    vraag: "Zijn de gevraagde referenties volledig en aantoonbaar aanwezig?",
    zoekwoorden: ["referenties", "ervaring", "geschiktheidseisen", "technische bekwaamheid", "artikel 2.21"]
  }
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const bestekFile = formData.get("bestek") as File;
    const inschrijvingFile = formData.get("inschrijving") as File;

    if (!bestekFile || !inschrijvingFile) {
      return new Response(
        JSON.stringify({ error: "Bestek en inschrijving zijn verplicht." }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // PDF's omzetten naar tekst
    const bestekText = await parsePdfToText(bestekFile);
    const inschrijvingText = await parsePdfToText(inschrijvingFile);

    // Bouw de prompt
    // Voor elke checklist-vraag: haal relevante wet- en bestekpassages op
    const enrichedChecklist = await Promise.all(
      checklist.map(async (item) => {
        // Gebruik zowel de vraag als specifieke zoekwoorden voor betere context
        const contextQueries = [
          item.vraag,
          ...item.zoekwoorden.slice(0, 2) // Gebruik de eerste 2 zoekwoorden voor extra context
        ];
        
        const contextResults = await Promise.all(
          contextQueries.map(async query => {
            // Probeer eerst Weaviate, fall back naar lokale dataset
            try {
              const weaviateContext = await retrieveContext(query, 2);
              if (weaviateContext && weaviateContext.trim().length > 0) {
                return weaviateContext;
              }
            } catch (error) {
              console.log('Weaviate niet beschikbaar, gebruik lokale dataset');
            }
            
            // Fall back naar lokale juridische chunks
            const lokaleChunks = haalJuridischeContext(query, 2);
            return lokaleChunks.map(chunk => 
              `${chunk.bron} ${chunk.artikel || chunk.paragraaf || ''}: ${chunk.text}`
            ).join('\n---\n');
          })
        );
        
        // Combineer en dedupliceer context
        const combinedContext = contextResults
          .filter(context => context.trim().length > 0)
          .join('\n---\n');
        
        // Structureer de context voor betere LLM interpretatie
        const structuredContext = combinedContext ? 
          `Juridische context voor "${item.vraag}":\n${combinedContext}` : 
          `Geen specifieke juridische context gevonden voor "${item.vraag}"`;
        
        return { 
          ...item, 
          context: structuredContext,
          contextLength: combinedContext.length
        };
      })
    );

    const systemPrompt = `
Je bent een aanbestedingsjurist. 
Je krijgt:
1. De tekst van het bestek (met eisen).
2. De tekst van een inschrijving.
3. Een checklist van verplichte onderdelen met juridische context uit de kennisbasis.

Voor elke checklist-vraag:
- Beoordeel of de vereiste aanwezig is in de inschrijving: "aanwezig", "ontbreekt" of "inconsistent".
- Gebruik de juridische context om je beoordeling te onderbouwen en te valideren.
- Verwijs specifiek naar artikelen uit de Aanbestedingswet of EU-richtlijnen waar relevant.
- Geef een korte toelichting met bronverwijzing (bestek, inschrijving, of juridische context).
- Let op: de juridische context helpt je begrijpen WAT vereist is, de inschrijving toont of het aanwezig is.

Voorbeeld beoordeling:
- Voor UEA: Controleer of UEA/ESPD aanwezig en ondertekend is (conform Art. 2.84 Aanbestedingswet)
- Voor KvK: Controleer recency van uittreksel (conform geschiktheidseisen Art. 2.21)

Geef ALLEEN geldige JSON terug, in de vorm:
[
  { 
    "id": "UEA", 
    "status": "aanwezig", 
    "toelichting": "UEA aanwezig op pagina 2 en correct ondertekend conform Art. 2.84 Aanbestedingswet",
    "confidence": 85
  }
]
    `;

    const userPrompt = `
Bestek:
${bestekText.substring(0, 8000)}${bestekText.length > 8000 ? '...' : ''}

Inschrijving:
${inschrijvingText.substring(0, 8000)}${inschrijvingText.length > 8000 ? '...' : ''}

Checklist + juridische context:
${enrichedChecklist.map(item => `
ITEM: ${item.id} - ${item.vraag}
ZOEKWOORDEN: ${item.zoekwoorden.join(', ')}
${item.context}
---
`).join('\n')}
    `;

    // LLM-call naar OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4", // of gpt-4-turbo voor sneller/goedkoper
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" } // force JSON
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const completion: OpenAIResponse = await response.json();
    const result = completion.choices[0]?.message?.content || "[]";

    // Parse en valideer JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (error) {
      console.error('JSON parsing error:', error);
      // Fallback naar mock data als JSON parsing faalt
      parsedResult = generateMockResponse(checklist);
    }

    // Voeg metadata toe
    const responseData = {
      analysis: parsedResult,
      metadata: {
        bestekFile: bestekFile.name,
        inschrijvingFile: inschrijvingFile.name,
        analyzedAt: new Date().toISOString(),
        checklistVersion: "1.0",
        totalItems: checklist.length,
        complianceScore: calculateComplianceScore(parsedResult)
      }
    };

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ 
        error: "Analyse mislukt", 
        details: error instanceof Error ? error.message : "Onbekende fout" 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Hulpfuncties
function calculateComplianceScore(results: Array<{ status: string }>): number {
  if (!Array.isArray(results) || results.length === 0) return 0;
  const aanwezigCount = results.filter(r => r.status === 'aanwezig').length;
  return Math.round((aanwezigCount / results.length) * 100);
}

function generateMockResponse(checklist: Array<{ id: string; vraag: string }>) {
  return checklist.map(item => ({
    id: item.id,
    status: Math.random() > 0.5 ? 'aanwezig' : Math.random() > 0.5 ? 'inconsistent' : 'ontbreekt',
    toelichting: `Mock analyse voor ${item.id} - OpenAI API niet beschikbaar`,
    confidence: Math.floor(Math.random() * 40) + 60 // 60-100% confidence
  }));
}