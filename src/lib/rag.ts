import weaviate from "weaviate-ts-client";
import { embed } from "./embeddings";

const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080"
});

export async function retrieveContext(query: string, k = 3): Promise<string> {
  try {
    const vector = await embed(query);

    const res = await client.graphql.get()
      .withClassName("LawChunk")
      .withFields("text")
      .withNearVector({ vector })
      .withLimit(k)
      .do();

    if (!res.data?.Get?.LawChunk) {
      console.warn('No LawChunk data found in Weaviate response');
      return '';
    }

    return res.data.Get.LawChunk.map((c: any) => c.text).join("\n---\n");
  } catch (error) {
    console.error('Error retrieving context from Weaviate:', error);
    return '';
  }
}

// Alternative function with more detailed response
export async function retrieveContextWithMetadata(query: string, k = 3) {
  try {
    const vector = await embed(query);

    const res = await client.graphql.get()
      .withClassName("LawChunk")
      .withFields("text source article category date _additional { certainty }")
      .withNearVector({ vector })
      .withLimit(k)
      .do();

    if (!res.data?.Get?.LawChunk) {
      return [];
    }

    return res.data.Get.LawChunk.map((chunk: any) => ({
      text: chunk.text,
      source: chunk.source,
      article: chunk.article,
      category: chunk.category,
      date: chunk.date,
      certainty: chunk._additional?.certainty || 0
    }));
  } catch (error) {
    console.error('Error retrieving context with metadata from Weaviate:', error);
    return [];
  }
}

// Function to check Weaviate connection
export async function checkWeaviateConnection(): Promise<boolean> {
  try {
    await client.misc.liveChecker().do();
    return true;
  } catch (error) {
    console.error('Weaviate connection failed:', error);
    return false;
  }
}