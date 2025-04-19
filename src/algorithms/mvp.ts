import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { z } from "zod";
import { AlgorithmConfig } from "../models/algorithm-config.js";

const simpleQueryHandler: AlgorithmConfig = {
    name: "simpleQueryHandler",
    description: "Takes a user query, creates a basic plan, executes steps sequentially, and synthesizes a final answer.",
    paramsSchema: {
        userQuery: z.string().describe("The original query from the user."),
    },
    handler: async (args: { userQuery: string }, extra: RequestHandlerExtra) => {
        const { mcpServer } = extra; // Acesso ao servidor para chamar tools/prompts
        const { userQuery } = args;
        let executionResults: any = {}; // Objeto simples para guardar resultados intermediários

        console.log(`[simpleQueryHandler] Received query: "${userQuery}"`);

        try {
            // ----- PASSO 1: GERAR O PLANO (Usando um Prompt) -----
            console.log("[simpleQueryHandler] STEP 1: Generating execution plan...");
            const planPromptResult = await mcpServer.getPrompt({
                name: "planGeneratorPrompt", // Prompt que instrui o LLM a criar um plano simples
                arguments: { query: userQuery }
            });

            if (planPromptResult.isError) {
                throw new Error(`Failed to generate plan: ${JSON.stringify(planPromptResult.content)}`);
            }

            const planText = planPromptResult.messages[0]?.content?.text;
            console.log("[simpleQueryHandler] Raw plan text:", planText);

            // **Parse SIMPLES do plano (Exemplo: Assume linhas "TOOL:toolName:param=value" ou "PROMPT:promptName:arg=value")**
            // !! Em produção, usar JSON seria mais robusto, mas para MVP, string simples !!
            const planSteps = planText.split('\n').map(line => line.trim()).filter(line => line);
            console.log("[simpleQueryHandler] Parsed plan steps:", planSteps);

            if (!planSteps || planSteps.length === 0) {
                 throw new Error("Plan generation resulted in no steps.");
            }

            executionResults['generatedPlan'] = planSteps; // Guarda o plano

            // ----- PASSO 2: EXECUTAR OS PASSOS DO PLANO (Usando For Loop e If/Else) -----
            console.log("[simpleQueryHandler] STEP 2: Executing plan steps...");
            for (let i = 0; i < planSteps.length; i++) {
                const step = planSteps[i];
                const stepNumber = i + 1;
                console.log(`\n[simpleQueryHandler] Executing Step ${stepNumber}: "${step}"`);

                // Extrair tipo, nome e params/args da string do passo (lógica básica de string)
                const parts = step.split(':');
                const stepType = parts[0]?.toUpperCase();
                const stepName = parts[1];
                const stepParamsRaw = parts[2]; // Ex: "param1=value1,param2=value2"

                // Parse simples dos parâmetros/argumentos
                const stepArgs: { [key: string]: any } = {};
                if (stepParamsRaw) {
                    stepParamsRaw.split(',').forEach(p => {
                        const [key, value] = p.split('=');
                        if (key && value) {
                           // Tenta substituir valores do estado anterior se usar placeholder como {prevResult}
                           // Exemplo MUITO básico:
                           if (value === '{step1Result}') stepArgs[key.trim()] = executionResults['step1Result'];
                           else if (value === '{userQuery}') stepArgs[key.trim()] = userQuery;
                           else stepArgs[key.trim()] = value.trim();
                        }
                    });
                }
                 console.log(`[simpleQueryHandler] Step ${stepNumber} - Type: ${stepType}, Name: ${stepName}, Args:`, stepArgs);


                let stepResult: any;

                if (stepType === "TOOL" && stepName) {
                    console.log(`[simpleQueryHandler] Calling Tool: ${stepName}`);
                    stepResult = await mcpServer.callTool({ name: stepName, params: stepArgs });
                    console.log(`[simpleQueryHandler] Tool ${stepName} Result:`, stepResult);
                } else if (stepType === "PROMPT" && stepName) {
                    console.log(`[simpleQueryHandler] Getting Prompt: ${stepName}`);
                    const promptOutput = await mcpServer.getPrompt({ name: stepName, arguments: stepArgs });
                     if (promptOutput.isError) throw new Error(`Prompt ${stepName} failed: ${JSON.stringify(promptOutput.content)}`);
                    stepResult = promptOutput.messages[0]?.content?.text; // Pega só o texto por simplicidade
                    console.log(`[simpleQueryHandler] Prompt ${stepName} Result:`, stepResult);
                } else {
                    console.warn(`[simpleQueryHandler] Step ${stepNumber} format not recognized or name missing: "${step}". Skipping.`);
                    stepResult = `Error: Step format not recognized`;
                }

                // Guarda o resultado do passo para referência futura (se necessário)
                executionResults[`step${stepNumber}Result`] = stepResult;
            }

            // ----- PASSO 3: SINTETIZAR A RESPOSTA FINAL (Usando um Prompt) -----
            console.log("\n[simpleQueryHandler] STEP 3: Synthesizing final answer...");
            // Passa todos os resultados coletados para o prompt final
            const finalPromptResult = await mcpServer.getPrompt({
                name: "finalSynthesizerPrompt",
                arguments: {
                    originalQuery: userQuery,
                    plan: executionResults['generatedPlan'].join('; '), // Passa o plano
                    results: JSON.stringify(executionResults) // Passa todos os resultados
                }
            });

             if (finalPromptResult.isError) {
                throw new Error(`Failed to synthesize final answer: ${JSON.stringify(finalPromptResult.content)}`);
            }

            const finalAnswer = finalPromptResult.messages[0]?.content?.text;
            console.log("[simpleQueryHandler] Final Answer:", finalAnswer);

            return { finalAnswer: finalAnswer, executionTrace: executionResults }; // Retorna resposta e rastro

        } catch (error: any) {
            console.error("[simpleQueryHandler] Error during execution:", error);
            // Retornar um erro estruturado
            return {
                error: `Execution failed: ${error.message}`,
                executionTrace: executionResults // Retorna o que foi feito até dar erro
             };
        }
    }
};
export default simpleQueryHandler;