function extrairJsonDeTexto(texto: string): any[] {
  let jsonStr: string | null = null;
  let origem: string = "N/A"; // Keep track of where the JSON string came from

  try {
    // Expressão regular que tenta extrair conteúdo entre ```json ... ```
    // Adicionado 'm' flag para multiline e melhorado o whitespace matching
    const regexBlocoJson = /```json\s*([\s\S]*?)\s*```/m;
    const match = texto.match(regexBlocoJson);

    if (match && match[1]) {
      // Prioritize content within ```json block
      jsonStr = match[1].trim();
      origem = "Bloco ```json";
    } else {
      // Fallback: Try to find JSON starting with [ or { in the whole text
      // This is safer than assuming the whole text is JSON
      const jsonStartIndex = texto.indexOf('[');
      const jsonObjStartIndex = texto.indexOf('{');

      let startIndex = -1;

      // Find the first occurrence of [ or {
      if (jsonStartIndex !== -1 && jsonObjStartIndex !== -1) {
          startIndex = Math.min(jsonStartIndex, jsonObjStartIndex);
      } else if (jsonStartIndex !== -1) {
          startIndex = jsonStartIndex;
      } else {
          startIndex = jsonObjStartIndex; // Might be -1 if neither is found
      }

      if (startIndex !== -1) {
         // Try parsing from the first opening bracket/brace
         // NOTE: This is still a guess and might grab too much or too little
         jsonStr = texto.substring(startIndex).trim();
         origem = "Fallback (texto a partir de '[' ou '{')";
         console.warn("Bloco ```json não encontrado, tentando extrair a partir do primeiro '[' ou '{'.");
      } else {
          // If no ```json block AND no obvious start of JSON is found
          console.warn("Nenhum bloco ```json encontrado e nenhum caractere '[' ou '{' inicial detectado no texto.");
          return []; // Nothing that looks like JSON was found
      }
    }

    if (!jsonStr) {
        // Should not happen with the logic above, but as a safeguard
        console.error("Falha inesperada: jsonStr está vazio após tentativa de extração.");
        return [];
    }

    // Tenta fazer o parse com JSON.parse (estrito)
    const parsed = JSON.parse(jsonStr);

    // Garante que seja uma lista
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      // Parsed successfully, but it's not an array
      console.warn(`JSON extraído (de ${origem}) não é uma lista (tipo: ${typeof parsed}). Retornando []. Conteúdo parseado:`, parsed);
      return []; // Return empty array as per function signature goal
    }

  } catch (err) {
    // Log detailed error information
    if(err instanceof Error) {

      console.error(`Erro ao extrair/parsear JSON (origem: ${origem}). Erro:`, err.message || err);
      // Log the actual string that failed (or a snippet if too long)
      const snippet = jsonStr ? (jsonStr.length > 500 ? jsonStr.substring(0, 500) + '...' : jsonStr) : "[jsonStr era null/vazio]";
      console.error("String que causou o erro de parse:", snippet);
    }
    return []; // Return empty array on any error during extraction or parsing
  }
}

export async function callLLM(systemPrompt: string, prompt: string): Promise<any> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-r1:14b',
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // console.log(`----- Result, ${JSON.stringify(result.response)}`)
    return extrairJsonDeTexto(result.response);
  } catch (error) {
    console.error('Falha na requisição:', error);
    throw error;
  }
}
