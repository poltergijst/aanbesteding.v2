import weaviate, { WeaviateClient } from 'weaviate-ts-client';

// Weaviate client configuratie
const WEAVIATE_URL = import.meta.env.VITE_WEAVIATE_URL || 'http://localhost:8080';
const WEAVIATE_API_KEY = import.meta.env.VITE_WEAVIATE_API_KEY;

let client: WeaviateClient | null = null;

export function getWeaviateClient(): WeaviateClient | null {
  if (!client) {
    try {
      const config: any = {
        scheme: WEAVIATE_URL.startsWith('https') ? 'https' : 'http',
        host: WEAVIATE_URL.replace(/^https?:\/\//, ''),
      };

      if (WEAVIATE_API_KEY) {
        config.apiKey = new weaviate.ApiKey(WEAVIATE_API_KEY);
      }

      client = weaviate.client(config);
    } catch (error) {
      console.error('Failed to initialize Weaviate client:', error);
      return null;
    }
  }
  
  return client;
}

// Schema definitie voor juridische chunks
export const LAW_CHUNK_SCHEMA = {
  class: 'LawChunk',
  description: 'Chunks van juridische teksten zoals wetten en jurisprudentie',
  vectorizer: 'none', // We gebruiken onze eigen embeddings
  properties: [
    {
      name: 'text',
      dataType: ['text'],
      description: 'De tekst van de juridische chunk'
    },
    {
      name: 'source',
      dataType: ['string'],
      description: 'Bron van de tekst (bijv. Aanbestedingswet, EU-richtlijn)'
    },
    {
      name: 'article',
      dataType: ['string'],
      description: 'Artikel nummer indien van toepassing'
    },
    {
      name: 'category',
      dataType: ['string'],
      description: 'Categorie van de juridische tekst'
    },
    {
      name: 'date',
      dataType: ['date'],
      description: 'Datum van de tekst'
    }
  ],
};

// Initialiseer schema in Weaviate
export async function initializeWeaviateSchema(): Promise<boolean> {
  const weaviateClient = getWeaviateClient();
  if (!weaviateClient) return false;

  try {
    // Controleer of schema al bestaat
    const existingSchema = await weaviateClient.schema.getter().do();
    const classExists = existingSchema.classes?.some((cls: any) => cls.class === 'LawChunk');
    
    if (!classExists) {
      await weaviateClient.schema.classCreator().withClass(LAW_CHUNK_SCHEMA).do();
      console.log('LawChunk schema created in Weaviate');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Weaviate schema:', error);
    return false;
  }
}

// Zoek in Weaviate
export async function searchWeaviate(
  query: string, 
  queryVector: number[], 
  limit: number = 10
): Promise<any[]> {
  const weaviateClient = getWeaviateClient();
  if (!weaviateClient) return [];

  try {
    const result = await weaviateClient.graphql
      .get()
      .withClassName('LawChunk')
      .withFields('text source article category date _additional { certainty }')
      .withNearVector({ vector: queryVector })
      .withLimit(limit)
      .do();

    return result.data?.Get?.LawChunk || [];
  } catch (error) {
    console.error('Weaviate search failed:', error);
    return [];
  }
}

// Voeg document toe aan Weaviate
export async function addToWeaviate(
  text: string,
  vector: number[],
  metadata: {
    source: string;
    article?: string;
    category?: string;
    date?: Date;
  }
): Promise<boolean> {
  const weaviateClient = getWeaviateClient();
  if (!weaviateClient) return false;

  try {
    await weaviateClient.data
      .creator()
      .withClassName('LawChunk')
      .withProperties({
        text,
        source: metadata.source,
        article: metadata.article || '',
        category: metadata.category || '',
        date: metadata.date?.toISOString() || new Date().toISOString()
      })
      .withVector(vector)
      .do();

    return true;
  } catch (error) {
    console.error('Failed to add to Weaviate:', error);
    return false;
  }
}