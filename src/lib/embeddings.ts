// Client-side embeddings wrapper - calls server-side API
// SECURITY: API keys are now server-side only

export async function embed(text: string): Promise<number[]> {
  try {
    // Call our secure server-side API endpoint
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embeddings API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    // Fallback naar mock embeddings bij API fout
    return generateMockEmbedding(text);
  }
}

// Genereer consistente mock embeddings voor development
function generateMockEmbedding(text: string): number[] {
  // Gebruik text hash voor consistente embeddings
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Genereer 1536-dimensionale vector (OpenAI embedding size)
  const embedding = [];
  for (let i = 0; i < 1536; i++) {
    // Gebruik hash als seed voor pseudo-random maar consistente waarden
    const seed = hash + i;
    const value = (Math.sin(seed) * 10000) % 1;
    embedding.push(value);
  }
  
  return embedding;
}

export function chunkText(text: string, maxTokens: number = 500): string[] {
  // Eenvoudige chunking strategie - splits op zinnen en combineer tot max tokens
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    // Ruwe token schatting (woorden * 1.3)
    const estimatedTokens = (currentChunk + ' ' + trimmedSentence).split(/\s+/).length * 1.3;
    
    if (estimatedTokens > maxTokens && currentChunk) {
      // Voeg huidige chunk toe en start nieuwe
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      // Voeg zin toe aan huidige chunk
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    }
  }
  
  // Voeg laatste chunk toe als deze niet leeg is
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Bereken cosine similarity tussen twee vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}