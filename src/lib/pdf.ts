import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function parsePdfToText(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    if (file.type === 'application/pdf') {
      const data = await pdfParse(uint8Array);
      return data.text;
    } else if (file.type.includes('word')) {
      const result = await mammoth.extractRawText({ buffer: uint8Array });
      return result.value;
    } else if (file.type === 'text/plain') {
      return new TextDecoder().decode(uint8Array);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractTextFromBuffer(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      if (mimeType === 'application/pdf') {
        pdfParse(buffer).then(data => resolve(data.text)).catch(reject);
      } else if (mimeType.includes('word')) {
        mammoth.extractRawText({ buffer }).then(result => resolve(result.value)).catch(reject);
      } else if (mimeType === 'text/plain') {
        resolve(new TextDecoder().decode(buffer));
      } else {
        reject(new Error(`Unsupported MIME type: ${mimeType}`));
      }
    } catch (error) {
      reject(error);
    }
  });
}