> **Licença**: Uso não comercial apenas sob [BUSL-1.1 (Business Source License 1.1)](./LICENSE). Uso comercial proibido até 10 de Abril de 2040.

# InsightLoop: Plataforma Agentic Evolutiva com MCP/SSE

## 🚀 Visão Geral

Este projeto implementa uma **plataforma agentic avançada** baseada no **MCP (Model Context Protocol)** utilizando **SSE (Server-Sent Events)** para comunicação em tempo real. Indo além de um simples servidor MCP, o InsightLoop é projetado para **orquestração inteligente**, **evolução contínua** e **auto-correção** de agentes de IA (Inteligência Artificial).

A arquitetura centraliza-se na **"Chain of Intelligence" (Cadeia de Inteligência)**: um fluxo hierárquico (Oráculo ➔ Orquestrador ➔ Agentes Específicos/Ferramentas) que permite decomposição de tarefas complexas, enriquecimento de dados em tempo real e coordenação robusta. A plataforma suporta o carregamento dinâmico de **componentes atômicos** (ferramentas, prompts, recursos) e incorpora mecanismos planejados para resiliência (Checkpoints & Rollback), exploração estratégica (**MCTS - Monte Carlo Tree Search**), avaliação de qualidade (Self-Critique, **SVM - Support Vector Machines**) e aprendizado contínuo (**DPO - Direct Preference Optimization**).

Inclui também uma interface de linha de comando (**CLI - Command-Line Interface**) para auxiliar no desenvolvimento e um inspetor web (Frontend) para interagir e monitorar o ecossistema agentic.

## 📚 Índice

- [🚀 Visão Geral](#-visão-geral)
- [✨ Recursos Principais](#-recursos-principais)
- [🧩 Componentes Principais](#-componentes-principais)
  - [Componentes Atuais](#componentes-atuais)
  - [Componentes Planejados (Roadmap)](#componentes-planejados-roadmap)
- [⚙️ Começando](#️-começando)
  - [Pré-requisitos](#️-pré-requisitos)
  - [Instalação](#️-instalação)
  - [Configuração de Ambiente](#-configuração-de-ambiente)
  - [Executando o Projeto (Manual)](#-executando-o-projeto-manual)
  - [🐳 Configuração Docker](#-configuração-docker)
    - [Usando Docker Compose Diretamente](#usando-docker-compose-diretamente)
    - [Usando Makefile (Recomendado)](#usando-makefile-recomendado)
- [🕹️ Uso](#️-uso)
- [🗺️ Roteiro (Roadmap)](#️-roteiro-roadmap)
- [❓ FAQ (Perguntas Frequentes)](#-faq-perguntas-frequentes)
- [✨ Contribuidores](#-contribuidores)

## ✨ Recursos Principais

- **📡 Servidor MCP com Transporte SSE**: Implementa o padrão MCP usando Server-Sent Events eficientes para comunicação em tempo real.
- **🧩 Arquitetura "Chain of Intelligence"**: Orquestração hierárquica (Oráculo ➔ Orquestrador ➔ Agentes) para decomposição e controle de tarefas complexas.
- **⚛️ Registro Dinâmico e Atômico**: Descobre e registra automaticamente ferramentas (`./src/tools`), prompts (`./src/prompts`) e recursos (planejado), indexando-os atomicamente por cliente/tenant para atualizações em tempo real sem downtime.
- **⚙️ Gerenciamento Concorrente de Clientes**: Lida com múltiplas conexões de clientes simultâneas via SSE, com potencial isolamento de instâncias por conexão/tenant (suporte multi-tenant).
- **💻 CLI de Desenvolvimento**: Utilitários para simplificar o desenvolvimento:
    -   🏗️ Geração de estrutura inicial (scaffolding) para novas ferramentas e prompts.
    -   🤖 Melhoria de descrições de ferramentas via **LLM (Large Language Model)** para melhor contextualização.
    -   📝 Listagem de prompts disponíveis.
- **✨ Inspetor Web MCP**: Uma aplicação frontend (Next.js e Shadcn **UI - User Interface**) que permite:
    -   🔗 Conectar-se ao servidor MCP SSE em execução.
    -   🔍 Visualizar ferramentas, prompts e (futuramente) recursos disponíveis com seus esquemas.
    *   ⚡ Executar ferramentas e prompts fornecendo parâmetros via formulário.
    *   📊 Monitorar o status da conexão e visualizar logs de atividade em tempo real.
    *   👁️ (Futuro) Visualizar a genealogia dos agentes e o status dos mecanismos de auto-correção.
- **🔄 Mecanismo de Auto-Correção (Planejado)**: Implementação de Checkpoints e Rollback para reverter agentes ou processos que se desviam do comportamento esperado ou excedem limites de recursos.
- **🧠 Avaliação Intermediária (Self-Critique - Planejado)**: Uso de um `CriticAgent` com métricas (ex: Similaridade de Cossenos) para avaliar a qualidade das saídas *antes* da conclusão final.
- **🧭 Exploração Estratégica (MCTS - Monte Carlo Tree Search - Planejado)**: Integração de MCTS para guiar a geração de novas soluções (prompts, configurações) de forma mais inteligente que a aleatoriedade.
- **🛡️ Filtragem Robusta (SVM - Support Vector Machines - Planejado)**: Uso de um `SvmClassifierAgent` para identificar e filtrar padrões de comportamento "ruins" que métricas simples podem não capturar.
- **🌱 Aprendizado Contínuo (DPO - Direct Preference Optimization - Planejado)**: Capacidade de coletar dados de preferência (sucesso vs. falha) da genealogia e usar DPO para fazer fine-tuning offline do LLM base.
- **🏦 Gerenciamento de Recursos (Resource Bank - Planejado)**: Controle de quotas (tempo, iterações, memória, chamadas **API - Application Programming Interface**) para garantir estabilidade e prevenir loops infinitos.

![Inspetor MCP - Ferramentas](docs/mcp-inspector-front-end-tools.png)

## 🧩 Componentes Principais

### Componentes Atuais

1.  **`src/index.ts`**:
    *   Ponto de entrada principal do servidor MCP.
    *   Usa Express.js para lidar com requisições **HTTP (HyperText Transfer Protocol)** e estabelecer conexões SSE no endpoint `/sse`.
    *   Gerencia sessões de clientes e pode hospedar a lógica do **Orquestrador** principal.
    *   Orquestra o carregamento dinâmico de tools/prompts (a base para os agentes atômicos).
    *   Inclui middleware **CORS (Cross-Origin Resource Sharing)** dinâmico.

    ![Servidor MCP com SSE](docs/mcp-server-with-sse.png)

2.  **`script/cli.ts`**:
    *   Utilitário de linha de comando (CLI) para auxiliar no desenvolvimento e manutenção dos componentes atômicos (ferramentas e prompts).
    *   Menu interativo para criar novos arquivos e melhorar descrições com LLM.

    ![Exemplo de uso da CLI](docs/script-cli.png)

3.  **`mcp-inspector-frontend/`**:
    *   Aplicação Next.js standalone que serve como interface gráfica (UI) para o servidor MCP.
    *   Conecta-se ao endpoint `/sse` do servidor.
    *   Permite inspecionar capacidades (tools, prompts) e interagir com elas.

    ![Inspetor MCP - Prompts](docs/mcp-inspector-front-end-prompts.png)

### Componentes Planejados (Roadmap)

*   **`ResourceManager`**: Classe/Serviço para gerenciar e verificar quotas de recursos por tenant.
*   **`CriticAgent` / `SelfCritiqueTool`**: Ferramenta/Agente para avaliar qualidade intermediária usando métricas (Similaridade de Cossenos, Índice de Jaccard, etc.).
*   **`MctsTool`**: Implementação de MCTS para guiar a exploração na geração de novas soluções.
*   **`SvmClassifierAgent`**: Agente/Tool que usa um modelo SVM treinado para classificar trajetórias/estados como bons ou ruins.
*   **`DpoTrainerAgent`**: Agente/Tool (provavelmente executado offline/agendado) para coletar preferências e realizar fine-tuning DPO.

## ⚙️ Começando

### Pré-requisitos

*   Node.js (LTS mais recente recomendado)
*   Yarn (v1 ou superior)
*   Docker & Docker Compose
*   `make` (geralmente pré-instalado em Linux/macOS; disponível para Windows)

### Instalação

1.  **Clone o repositório (se ainda não o fez).**
2.  **Instale as dependências da raiz:**
    ```bash
    yarn install
    ```
3.  **Instale as dependências do frontend:**
    ```bash
    cd mcp-inspector-frontend
    yarn install
    cd ..
    ```

### Configuração de Ambiente

1.  **Servidor:** Copie `.env.example` para `.env` na raiz do projeto. Preencha as variáveis de ambiente necessárias (ex: chaves de API se suas ferramentas/CLI precisarem, configurações para ResourceManager, caminhos de modelos SVM/DPO, etc.).
2.  **Inspetor Frontend:** Crie um arquivo `.env.local` dentro do diretório `mcp-inspector-frontend/`. Adicione a **URL (Uniform Resource Locator)** do seu servidor MCP em execução:
    ```plaintext
    # mcp-inspector-frontend/.env.local
    NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
    ```
    Substitua `http://localhost:3001` se seu servidor rodar em porta ou host diferente. Certifique-se que esta URL é acessível de onde você executa o frontend (ex: use `http://host.docker.internal:3001` se rodar o frontend fora do Docker e o servidor dentro do Docker no Docker Desktop, ou `http://<ip-do-seu-host-docker>:3001` se acessar de outra máquina). Ao usar `make` ou `docker-compose`, os serviços podem estar acessíveis via `http://localhost:<porta>` diretamente, dependendo da configuração.

### Executando o Projeto (Manual)

Este método é útil se você não quiser usar Docker.

1.  **Compile o servidor e a CLI:**
    ```bash
    yarn build
    ```
2.  **Execute o Servidor MCP:**
    ```bash
    yarn start
    ```
    _(Alternativamente, use `yarn dev` se um script de desenvolvimento com hot-reloading estiver configurado)_
3.  **Execute o Inspetor Frontend:**
    ```bash
    cd mcp-inspector-frontend
    yarn dev
    ```
    O inspetor geralmente estará disponível em `http://localhost:3000`.
4.  **Execute a CLI Gerenciadora de Ferramentas:**
    ```bash
    yarn tool-manager
    ```
    Este comando executa `build/script/cli.js` usando `node`. Siga as instruções interativas no seu terminal.

### 🐳 Configuração Docker

Usar Docker é recomendado para ambientes consistentes e deploy mais fácil. Certifique-se de ter Docker e Docker Compose instalados.

#### Usando Docker Compose Diretamente

Você pode interagir com o Docker Compose diretamente usando os arquivos **YAML (YAML Ain't Markup Language)** fornecidos:

1.  **Para Desenvolvimento:**
    Compila e inicia os contêineres definidos em `docker-compose.dev.yml` (frequentemente com hot-reloading).
    ```bash
    docker-compose -f docker-compose.dev.yml up --build
    ```
    Para parar: `docker-compose -f docker-compose.dev.yml down`

2.  **Para Produção:**
    Compila e inicia os contêineres definidos em `docker-compose.prod.yml` (otimizado para produção).
    ```bash
    docker-compose -f docker-compose.prod.yml up --build -d # -d executa em modo detached
    ```    Para parar: `docker-compose -f docker-compose.prod.yml down`

_Nota: Pode ser necessário ajustar `NEXT_PUBLIC_MCP_SERVER_URL` em `mcp-inspector-frontend/.env.local` dependendo da sua configuração de rede Docker._

#### Usando Makefile (Recomendado)

Um `Makefile` é fornecido na raiz do projeto para simplificar operações Docker comuns. Certifique-se que `make` está instalado.

*   **Ambiente de Desenvolvimento:**
    *   `make dev-up`: Compila imagens (se necessário) e inicia contêineres de desenvolvimento.
    *   `make dev-down`: Para e remove os contêineres de desenvolvimento.
    *   `make dev-logs`: Exibe os logs dos contêineres de desenvolvimento em execução.
*   **Ambiente de Produção:**
    *   `make prod-up`: Compila imagens (se necessário) e inicia contêineres de produção em modo detached.
    *   `make prod-down`: Para e remove os contêineres de produção.
    *   `make prod-logs`: Exibe os logs dos contêineres de produção em execução.
*   **Limpeza:**
    *   `make clean`: Para todos os contêineres do projeto e remove volumes, redes e potencialmente imagens associadas (use com cautela).

**Exemplo de Fluxo de Trabalho (Desenvolvimento):**

1.  Inicie os serviços: `make dev-up`
2.  Acesse o inspetor frontend (`http://localhost:3000`) e o servidor (`http://localhost:3001`).
3.  Veja os logs: `make dev-logs`
4.  Ao terminar, pare os serviços: `make dev-down`

## 🕹️ Uso

*   **📡 Servidor MCP**: Roda em background (iniciado via `yarn start`, `make *-up`, etc.). Escuta conexões SSE na porta configurada (padrão: 3001). É aqui que a lógica do Orquestrador e a "Chain of Intelligence" operam.
*   **💻 CLI de Desenvolvimento**: Execute `yarn tool-manager` (requer build manual ou `docker exec`). Use para gerenciar os componentes atômicos (tools/prompts).
*   **✨ Inspetor MCP**: Acesse via navegador (padrão: `http://localhost:3000`). Conecte-se à URL do servidor. Use a interface para interagir, executar tarefas e monitorar a atividade dos agentes e (futuramente) visualizar aspectos da evolução e auto-correção.

## 🗺️ Roteiro (Roadmap)

*   [x] Suporte Docker (Configuração básica adicionada, Makefile fornecido)
*   [ ] Melhorar layout do Chat com LLM no Inspector
*   [ ] Exemplo de Cliente/Tool em Python
*   [ ] **Implementar `ResourceManager` e integração de quotas**
*   [ ] **Implementar `CriticAgent` com métricas de similaridade (Self-Critique)**
*   [ ] **Integrar `MctsTool` (Monte Carlo Tree Search) na geração de novas soluções**
*   [ ] **Implementar `SvmClassifierAgent` (Support Vector Machines) para filtragem robusta**
*   [ ] **Implementar `DpoTrainerAgent` (Direct Preference Optimization) e pipeline de fine-tuning offline**
*   [ ] Adicionar suporte a Recursos (Resources) no Servidor MCP (além de Tools/Prompts)
*   [ ] Servidor MCP Sampling (implementar amostragem/seleção de ferramentas/prompts)
*   [ ] Servidor MCP Roots (definir raízes de contexto ou tarefas)
*   [ ] Adicionar visualização de Genealogia e status de Rollback no Inspector
*   [ ] Como fazer deploy? (Expandir seção Docker, adicionar guias para nuvem/serverless)

## ✨ Contribuidores

*   [thiagobutignon](https://github.com/thiagobutignon)
*   [miller00315](https://github.com/miller00315) - Obrigado, Miller, por suas contribuições inestimáveis. Suas ideias inovadoras, paixão por IA, expertise em matemática e profundo entendimento de teoria dos jogos foram cruciais para o sucesso deste projeto. Nós realmente não poderíamos tê-lo completado sem você. 🚀👽🤖
*   Obrigado, Vicente, por proporcionar os dias mais felizes da minha vida ao seu lado. Sou grato pelas divertidas brincadeiras de policial e por transformar até os dias de chuva em momentos de alegria, quando, enquanto muitos se abrigam, você escolhe se molhar e fazer disso uma grande festa. 🚔👮🏼‍♂️🚨

## ❓ FAQ (Perguntas Frequentes)

<details>
<summary>1. O que é o Servidor MCP SSE do InsightLoop?</summary>
**Resposta:** É um servidor de comunicação em tempo real baseado no MCP (Model Context Protocol) que usa SSE (Server-Sent Events). Ele vai além de um servidor MCP padrão, atuando como o núcleo de uma plataforma agentic avançada, orquestrando a "Chain of Intelligence", gerenciando o ciclo de vida de agentes e suportando atualizações dinâmicas de seus componentes (ferramentas, prompts, recursos).
</details>

<details>
<summary>2. Como funciona o registro dinâmico e atômico?</summary>
**Resposta:** Ao iniciar ou receber uma nova conexão (por tenant), o servidor escaneia diretórios dedicados (`./src/tools`, `./src/prompts`, futuramente `./src/resources`). Ele registra novos componentes ou atualizações, indexando-os de forma atômica ao cliente/tenant específico. Isso permite que o ecossistema agentic se atualize em tempo real sem reinicializações.
</details>

<details>
<summary>3. O que é a "Chain of Intelligence"?</summary>
**Resposta:** É a arquitetura hierárquica central do InsightLoop: Oráculo (enriquece/planeja) ➔ Orquestrador (coordena/delega) ➔ Agentes/Ferramentas (executam tarefas atômicas). Essa estrutura permite decompor problemas complexos, controlar o fluxo de informação e implementar mecanismos avançados como auto-correção e aprendizado.
</details>

<details>
<summary>4. Como funcionará o mecanismo de Rollback e Auto-Correção?</summary>
**Resposta (Planejado):** O sistema manterá "checkpoints" de estados considerados bons. Se um agente ou processo falhar (detectado por baixa pontuação, classificação SVM negativa ou estouro de recursos via `ResourceManager`), o Orquestrador poderá reverter o sistema para o último checkpoint válido, descartando o caminho "ruim" e potencialmente tentando uma abordagem diferente.
</details>

<details>
<summary>5. Qual o papel do MCTS, SVM e DPO neste projeto?</summary>
**Resposta (Planejado):**
- **MCTS (Monte Carlo Tree Search):** Para explorar o espaço de soluções (ex: variações de prompts/configurações) de forma mais inteligente que mutações aleatórias durante a evolução dos agentes.
- **SVM (Support Vector Machines):** Para classificar trajetórias ou comportamentos como "bons" ou "ruins" com base em padrões aprendidos, atuando como um filtro de qualidade robusto.
- **DPO (Direct Preference Optimization):** Para usar os dados de sucesso e falha coletados durante a evolução (a genealogia) para fazer fine-tuning contínuo do modelo de linguagem base, melhorando sua performance especificamente para as tarefas do sistema.
</details>

<details>
<summary>6. Como adicionar novas ferramentas ou prompts?</summary>
**Resposta:** Crie novos arquivos TypeScript em `./src/tools` ou `./src/prompts`. Se estiver rodando com hot-reloading (ex: `make dev-up`), as mudanças devem ser refletidas dinamicamente. Use `yarn tool-manager` (a CLI) para auxílio na criação e descrição.
</details>

<details>
<summary>7. Este sistema já é AGI (Inteligência Artificial Geral)?</summary>
**Resposta:** Não. Embora esta arquitetura represente um avanço significativo em direção a sistemas mais adaptativos, resilientes e capazes (AGI-like), ela ainda opera com base nos LLMs atuais e em técnicas de engenharia de software. **AGI (Artificial General Intelligence)** implica em capacidades cognitivas gerais comparáveis ou superiores às humanas em *qualquer* domínio, o que ainda não alcançamos. Este projeto é um passo importante *nessa direção*, construindo uma meta-estrutura mais inteligente para *utilizar* a IA existente.
</details>

<details>
<summary>8. Como o Banco de Recursos (Resource Bank) funciona?</summary>
**Resposta (Planejado):** Um `ResourceManager` definirá quotas (tempo, iterações, memória, chamadas API) por cliente/tenant. Antes de operações custosas, o sistema verificará se há orçamento disponível. Se um limite for excedido, a operação é interrompida e um mecanismo de tratamento (ex: rollback, falha controlada) é acionado para garantir estabilidade.
</details>

<details>
<summary>9. Como posso contribuir ou obter suporte?</summary>
**Resposta:** Contribuições são bem-vindas!
- Issues/Requisições: Use o tracker de issues do GitHub.
- Pull Requests: Siga as diretrizes de contribuição (se houver).
- Comunidade: Engaje via fóruns ou canais de chat do projeto (se disponíveis).
</details>