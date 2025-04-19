
/** Status operacional de um Filho. */
export type StatusFilho = 'pendente' | 'executando' | 'concluido' | 'falhou' | 'lisado'; // lisado = autodestruído
/**
 * Representa o estado avaliado de uma entidade candidata (um "filho"), 
 * como uma configuração de prompt e seus metadados de execução.
 */

export interface NivelEsperanca {
    /** 
     * Identificador único para esta entidade/filho. 
     * Deve ser gerenciado para garantir unicidade (talvez pela implementação do Pai ou um serviço externo).
     */
    id: number | string; // Permitir string ou number

    /** 
     * Pontuação de fitness/desempenho atual (0-100). 
     * Assume-se que uma pontuação mais alta é melhor.
     * O valor é determinado por uma avaliação externa do resultado gerado pelo 'payload'.
     */
    pontuacao: number;

    /** Status atual do ciclo de vida do Filho associado a este NivelEsperanca. */
    status: StatusFilho;


    /** 
     * A representação concreta da solução/filho e seus metadados.
     * Crucial para avaliação, mutação, clonagem e cruzamento.
     */
    payload: {
        /** O prompt do sistema que define o contexto/persona da IA. */
        systemPrompt: string;
        /** O prompt específico da tarefa submetido à IA. */
        prompt: string;
        /** 
         * Registro dos recursos do MCP Server utilizados ou disponíveis para este filho.
         * Útil para entender dependências e otimizar o uso de recursos em mutações.
         */
        mcp: {
            /** Ferramentas específicas do MCP que foram usadas/disponíveis. */
            tools: string[];
            /** Algoritmos específicos do MCP que foram usados/disponíveis. */
            algorithms: string[];
             /** Outros recursos gerais do MCP usados/disponíveis. */
            resources: string[];
             /** Prompts pré-definidos ou componentes de prompt do MCP usados/disponíveis. */
            prompts: string[]; 
        };
        /** Métricas de consumo de tokens da LLM para esta execução. */
        tokens: {
            /** Número de tokens na entrada (systemPrompt + prompt + contexto?). */
            entrada: number;
            /** Número de tokens na saída gerada pela IA. */
            saida: number;
        };
        /** (Opcional) ID(s) do(s) pai(s) que geraram este filho (para genealogia). */
        parentIds?: (number | string)[]; 
        /** (Opcional) Armazena o resultado da execução para avaliação posterior. */
        resultadoExecucao?: any;
        /** (Opcional) Armazena o motivo da falha ou lise. */
        motivoFalhaOuLise?: string;
    };
}

// --- Tipos para Genealogia ---

export interface GenealogiaNode { id: number | string; label: string; pontuacao?: number; status?: StatusFilho }

/** Representa uma aresta (ligação) no grafo de genealogia. */
export interface GenealogiaEdge {
    /** ID do nó pai. */
    source: number | string;
    /** ID do nó filho. */
    target: number | string;
    /** (Opcional) Texto na ligação (ex: 'mutação', 'cruzamento'). */
    label?: string; 
}

/** Estrutura de dados para representar a genealogia. */
export interface DadosGenealogia {
    nodes: GenealogiaNode[];
    edges: GenealogiaEdge[];
}


/**
 * Interface para a entidade "Pai" que gerencia e evolui uma coleção 
 * de Niveis de Esperança (filhos/soluções candidatas).
 */
export interface Pai {
    /** A lista atual de entidades/filhos e seus níveis de esperança/avaliação. */
    listaDeEsperanca: NivelEsperanca[];

    /** O limiar (threshold) mínimo de pontuação (fixo) para um filho sobreviver ao corte. */
    readonly threshold: number;

    /** O valor de pontuação considerado ótimo (normalmente 100 ou o máximo desejado). */
    readonly pontoOtimo: number;

    // Removido 'proximoId' conforme solicitado. A geração de ID é responsabilidade externa ou da criação do filho.

    /**
     * Avalia a lista atual e remove os filhos cuja pontuação está abaixo do threshold (Eliminação).
     * @returns {NivelEsperanca[]} Uma lista dos filhos que foram removidos (cortados/eliminados).
     */
    realizarCorte(): NivelEsperanca[];

    /**
     * Gera a próxima geração de filhos com base nos sobreviventes do corte,
     * aplicando estratégias como clonagem, mutação, cruzamento ou geração.
     * 
     * Estratégias possíveis (a implementação decidirá como e quando aplicar):
     * 1.  **Clonagem:** Se `pontuacao >= pontoOtimo`, a solução é ideal e pode ser replicada.
     * 2.  **Mutação:** 
     *     - *Leve:* Se `pontoAvaliacao <= pontuacao < pontoOtimo` (promissor). Modificações no `payload` (ex: ajustar `prompt`, trocar `tools` do `mcp`).
     *     - *Drástica:* Se `threshold <= pontuacao < pontoAvaliacao` (longe do ideal). Alterações mais significativas ou geração de novo `payload`.
     * 3.  **Cruzamento (Crossover):** Combina `payload` de dois ou mais sobreviventes para criar novos filhos.
     *     - *Elitista:* Cruza apenas os melhores sobreviventes.
     *     - *Aleatório:* Cruza sobreviventes selecionados aleatoriamente.
     *     - *Classista:* Cruza melhores com piores (ou outras classes definidas).
     * 4.  **Geração:** Cria um filho completamente novo, talvez com base em heurísticas ou aleatoriedade.
     * 
     * A implementação deve garantir a geração de IDs únicos para os novos filhos e, idealmente, 
     * registrar a filiação (ex: preenchendo `payload.parentIds`).
     * 
     * @param {NivelEsperanca[]} sobreviventes - Os filhos que passaram no `realizarCorte()`.
     * @returns {NivelEsperanca[]} A lista da nova geração de filhos.
     */
    gerarNovaGeracao(sobreviventes: NivelEsperanca[]): NivelEsperanca[];

    /**
     * Orquestra um ciclo completo de evolução:
     * 1. Garante que exista uma geração inicial (se necessário, usando `gerarFilhosIniciais`).
     * 2. Executa `realizarCorte()` para eliminar os menos aptos.
     * 3. Executa `gerarNovaGeracao()` com os sobreviventes.
     * 4. Atualiza `listaDeEsperanca` com a nova geração resultante.
     * 
     * A implementação deve conter a lógica para determinar a **convergência** 
     * (quando parar a evolução), que pode ser baseada em:
     * - Atingir o `pontoOtimo`.
     * - Número máximo de gerações.
     * - Estagnação (melhora mínima ao longo de várias gerações).
     * - Limite de tempo ou recursos.
     */
    evoluirParaProximaGeracao(): void;

    /**
     * Verifica se a população inicial precisa ser gerada.
     * @returns {boolean} Verdadeiro se `listaDeEsperanca` está vazia.
     */
    precisaGerarFilhoInicial(): boolean;

    /**
     * (Opcional) Gera a população inicial de filhos.
     * A estratégia pode variar (aleatória, baseada em um modelo inicial, etc.).
     * A implementação é responsável por criar os objetos `NivelEsperanca` iniciais, incluindo IDs e payloads.
     * @returns {NivelEsperanca[]} A lista inicial de filhos.
     */
    gerarFilhosIniciais?(): Promise<NivelEsperanca[]>;

    // Removido 'obterMelhorEsperancaAtual' conforme solicitado.

    /**
     * Coleta e estrutura os dados de todas as gerações processadas até o momento 
     * para visualização da árvore genealógica.
     * A implementação desta função precisará manter um histórico das relações pai-filho.
     * @returns {DadosGenealogia} Um objeto contendo listas de nós e arestas para construir o grafo.
     *                         Retorna null ou objeto vazio se nenhum histórico estiver disponível.
     */
    obterDadosGenealogia(): DadosGenealogia | null;
}

/**
 * Representa o resultado da execução de um Filho.
 * Estes dados são usados para calcular a 'pontuacao' do NivelEsperanca correspondente.
 */
export interface ResultadoExecucaoFilho {
    /** Indica se a execução foi concluída sem erros fatais ou lise prematura. */
    sucesso: boolean;
    /** O resultado principal da execução (ex: resposta da LLM, dados processados). */
    output?: any; 
    /** Mensagem de erro, caso 'sucesso' seja falso. */
    erro?: string;
    /** Métricas coletadas durante a execução. */
    metricas: {
        /** Tokens de entrada efetivamente usados. */
        tokensEntrada: number; 
         /** Tokens de saída efetivamente gerados. */
        tokensSaida: number;
        /** Tempo de execução em milissegundos. */
        tempoExecucaoMs?: number;
         /** Recursos específicos do MCP realmente consumidos. */
        recursosMCPUsados?: string[]; 
        /** Outras métricas relevantes... */
    };
    /** Indica se a lise foi acionada durante a execução. */
    autodestruido: boolean;
    /** Motivo da lise, se aplicável. */
    motivoLise?: string;
}

export interface Filho extends Pai {
    /** Obtém o identificador único deste Filho. */
    getId(): number | string;

    /** Obtém o estado/configuração atual (NivelEsperanca) associado a este Filho. */
    getNivelEsperanca(): NivelEsperanca;

    /**
     * Executa a tarefa principal do Filho usando seu payload e os recursos do MCP.
     * Esta função é assíncrona e deve atualizar o status e o resultadoExecucao
     * no NivelEsperanca associado upon completion or failure.
     * @param mcpInterface // Uma forma de interagir com os recursos do MCP
     * @returns {Promise<void>} Promessa resolvida quando a execução termina (sucesso ou falha).
     */
    executarTarefa(mcpInterface: any): Promise<void>; // Substitua 'any' por uma interface MCP real

    /**
     * Ativa o mecanismo de autodestruição (lise) do Filho.
     * Isso deve atualizar o status para 'lisado' e registrar o motivo.
     * Pode também liberar recursos associados.
     * @param motivo A razão pela qual a lise foi acionada.
     */
    realizarLise(motivo: string): void;

    /**
     * Verifica internamente se os critérios para lise foram atendidos
     * (ex: consumo excessivo de recursos, timeout, detecção de alucinação).
     * Se os critérios forem atendidos, deve chamar `realizarLise`.
     * Esta função pode ser chamada periodicamente ou em pontos chave da execução.
     */
    verificarCondicoesDeLise(): void;
}
