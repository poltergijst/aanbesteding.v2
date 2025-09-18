import { promises as fs } from 'fs';
import { embed } from '../src/lib/embeddings';
import weaviate from 'weaviate-ts-client';

const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080"
});

async function indexLegalDocuments() {
  console.log('Starting legal document indexing...');
  
  try {
    // Lees laws.json bestand
    const raw = await fs.readFile('./data/laws.json', 'utf-8');
    const docs = JSON.parse(raw);
    
    console.log(`Processing ${docs.length} legal documents...`);
    
    let successCount = 0;
    for (const doc of docs) {
      console.log(`Processing ${doc.id}: ${doc.bron} ${doc.artikel || doc.paragraaf || ''}...`);
      
      try {
        const vector = await embed(doc.text);
        
        await client.data
          .creator()
          .withClassName('LawChunk')
          .withProperties({
            text: doc.text,
            source: doc.bron,
            article: doc.artikel || doc.paragraaf || '',
            category: doc.bron.includes('ARW') ? 'ARW Regelgeving' : 'Nederlandse wetgeving',
            date: doc.bron.includes('ARW') ? '2016-07-01' : '2012-07-01'
          })
          .withVector(vector)
          .do();
        
        successCount++;
        console.log(`✓ Successfully indexed ${doc.id}`);
      } catch (error) {
        console.error(`✗ Failed to index ${doc.id}:`, error);
      }
    }
    
    console.log(`\n🎉 Successfully indexed ${successCount}/${docs.length} legal documents`);
    console.log('Legal document indexing completed');
    
  } catch (error) {
    console.error('Error indexing legal documents:', error);
  }
}

// Run the indexing
if (import.meta.url === `file://${process.argv[1]}`) {
  indexLegalDocuments()
    .then(() => {
      console.log('Legal document indexing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Legal document indexing failed:', error);
      process.exit(1);
    });
}

export { indexLegalDocuments };