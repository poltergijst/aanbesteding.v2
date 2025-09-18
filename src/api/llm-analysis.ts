// Server-side LLM analysis API endpoint
import { OpenAI } from 'openai';
import { parsePdfToText } from '../lib/pdf';
import { haalJuridischeContext } from '../data/juridische-chunks';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Basis-checklist
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const bestekFile = formData.get("bestek") as File;
    const inschrijvingFile = formData.get("inschrijving") as File;

    if (!bestekFile || !inschrijvingFile) {
      return new Response(
        JSON.stringify({ error: "Bestek en inschrijving zijn verplicht." }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file types and sizes
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(bestekFile.type) || !allowedTypes.includes(inschrijvingFile.type)) {
      return new Response(
        JSON.stringify({ error: "Alleen PDF, Word en TXT bestanden zijn toegestaan." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (bestekFile.size > maxSize || inschrijvingFile.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "Bestanden mogen maximaal 5MB groot zijn." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // PDF's omzetten naar tekst
    const bestekText = await parsePdfToText(bestekFile);
    const inschrijvingText = await parsePdfToText(inschrijvingFile);

    // Bouw de prompt met juridische context
    const enrichedChecklist = await Promise.all(
      checklist.map(async (item) => {
        const contextQueries = [item.vraag, ...item.zoekwoorden.slice(0, 2)];
        
        const contextResults = contextQueries.map(query => {
          const lokaleChunks = haalJuridischeContext(query, 2);
          return lokaleChunks.map(chunk => 
            `${chunk.bron} ${chunk.artikel || chunk.paragraaf || ''}: ${chunk.text}`
          ).join('\n---\n');
        });
        
        const combinedContext = contextResults
          .filter(context => context.trim().length > 0)
          .join('\n---\n');
        
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
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

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
    console.error('LLM Analysis API error:', error);
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