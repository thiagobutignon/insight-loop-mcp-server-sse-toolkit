import 'dotenv/config';
import OpenAI from 'openai';
import { AssetInfo } from '../lib/assets-discovery.js';

// Interface simples para o retorno esperado da IA
export interface DomainAssetConfig {
    tools: string[];
    prompts: string[];
    resources: string[];
    algorithms: string[];
}
export interface DomainConfig {
    domainName: string;
    description: string;
    assets: DomainAssetConfig;
}

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

function formatAssetsForAI(assets: AssetInfo[]): string {
  // Formata a lista de ativos de forma que a IA entenda
  // Incluir tipo, caminho, nome e descrição
  return assets.map(a =>
    `- Type: ${a.type}, Path: ${a.filePath}` +
    (a.name ? `, Name: ${a.name}` : '') +
    (a.description ? `, Description: ${a.description}` : '')
  ).join('\n');
}

export async function getDomainConfigurationFromAI(assets: AssetInfo[]): Promise<DomainConfig[]> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    const formattedAssets = formatAssetsForAI(assets);
    const prompt = `
You are a software architect specializing in Domain-Driven Design (DDD).
Analyze the following list of assets (tools, prompts, resources, algorithms) provided with their file paths:

${formattedAssets}

Your task is to group these assets into cohesive logical domains. Each domain should represent a specific business area or functionality.
Return the configuration as a single, valid JSON array adhering STRICTLY to the following structure:
[
  {
    "domainName": "ExampleDomainName",
    "description": "Brief description of what this domain does.",
    "assets": {
      "tools": ["path/to/relevant/tool1.ts", "path/to/relevant/tool2.ts"],
      "prompts": ["path/to/relevant/prompt1.ts"],
      "resources": [],
      "algorithms": ["path/to/relevant/algorithm1.ts"]
    }
  },
  {
    "domainName": "AnotherDomain",
    // ... other domain details
  }
  // ... more domains if necessary
]

Ensure ALL provided asset file paths are included in exactly one domain's asset list under the correct category (tools, prompts, resources, algorithms).
Do NOT include any explanation or introductory text outside the JSON array itself. The output MUST be only the JSON array.
`;

  console.log("Sending request to OpenAI for domain configuration...");
  try {
    const response = await openai.chat.completions.create({
      model: process.env.GEMINI_MODEL || "", 
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // Baixa temperatura para respostas mais determinísticas
      response_format: { type: "json_object" }, // Habilita JSON mode
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI response content is empty.");
    }

    console.log("Received raw response from OpenAI."); // Não logar o content inteiro se for grande/sensível

    // O JSON mode geralmente retorna um objeto, pode ser necessário ajustar o parse se o prompt pedir um array diretamente
    // Se o JSON mode retornar { "result": [...] }, ajuste o parse
    // Se ele retornar o array diretamente no content, o parse abaixo deve funcionar
    let parsedConfig: any;
    try {
        parsedConfig = JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse OpenAI JSON response:", content); // Logar o conteúdo se o parse falhar
        throw new Error(`Failed to parse JSON response from OpenAI: ${e}`);
    }


    // Verificação básica da estrutura (pode ser mais robusta com Zod)
    if (!Array.isArray(parsedConfig) || parsedConfig.some(d => !d.domainName || !d.assets)) {
       console.error("Invalid JSON structure received:", parsedConfig);
       throw new Error("OpenAI response does not match the expected domain configuration structure.");
    }

    console.log("Successfully parsed domain configuration from OpenAI.");
    // A asserção de tipo aqui é uma simplificação; usar Zod seria mais seguro
    return parsedConfig as DomainConfig[];

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error; // Re-lança o erro para ser tratado no index.ts
  }
}

