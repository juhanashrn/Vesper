/**
 * RAG Pipeline — Full Retrieval-Augmented Generation Pipeline
 * 
 * Flow:
 * 1. INGEST: Load data → Chunk → Embed via Ollama → Store in vector store + Supabase
 * 2. QUERY:  Embed question → Vector search → Build augmented prompt → LLaMA 3 → Response
 */

const VectorStore = require("./vectorStore");
const Chunker = require("./chunker");
const DocumentLoader = require("./documentLoader");

const OLLAMA_BASE_URL = "http://localhost:11434";
const LLM_MODEL = "llama3";
const EMBED_MODEL = "llama3";

class RAGPipeline {
    constructor() {
        this.vectorStore = new VectorStore();
        this.chunker = new Chunker(500, 50);
        this.docLoader = new DocumentLoader();
        this.initialized = {};
    }

    /**
     * Check if Ollama is running
     */
    async checkOllama() {
        try {
            const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
            const data = await res.json();
            const models = (data.models || []).map((m) => m.name);
            console.log("Ollama is running. Available models:", models.join(", "));

            if (!models.some((m) => m.startsWith("llama3"))) {
                console.warn("⚠ llama3 model not found. Pull it with: ollama pull llama3");
                return false;
            }
            return true;
        } catch (err) {
            console.error("❌ Ollama is NOT running. Start it with: ollama serve");
            return false;
        }
    }

    /**
     * Get embedding for a text using Ollama
     * @param {string} text
     * @returns {Array<number>} embedding vector
     */
    async getEmbedding(text) {
        try {
            const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: EMBED_MODEL,
                    input: text,
                }),
            });
            const data = await res.json();
            return data.embeddings?.[0] || [];
        } catch (err) {
            console.error("Embedding error:", err.message);
            return [];
        }
    }

    /**
     * Generate a response from LLaMA 3 via Ollama
     * @param {string} prompt
     * @returns {string} generated response
     */
    async generate(prompt) {
        try {
            const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: LLM_MODEL,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        num_predict: 512,
                    },
                }),
            });
            const data = await res.json();
            return data.response || "I could not generate a response. Please try again.";
        } catch (err) {
            console.error("LLM generation error:", err.message);
            return "The local AI model is not responding. Please make sure Ollama is running with: ollama serve";
        }
    }

    /**
     * INGEST PIPELINE — Process and index all data for a security key
     * Called after onboarding or when data is updated
     * @param {string} securityKey
     */
    async ingest(securityKey) {
        console.log(`\n📥 Starting ingestion for key: ${securityKey}`);

        // Step 1: Load raw data from Supabase
        console.log("  → Loading documents from Supabase...");
        const { client, questionnaire, vulnerabilities } = await this.docLoader.loadBySecurityKey(securityKey);

        if (!client) {
            console.log("  ⚠ No client found for this key. Skipping ingestion.");
            return;
        }

        // Step 2: Chunk the documents
        console.log("  → Chunking documents...");
        const chunks = this.chunker.buildSecurityDocuments(client, questionnaire, vulnerabilities);
        console.log(`  → Created ${chunks.length} chunks.`);

        // Step 3: Generate embeddings for each chunk
        console.log("  → Generating embeddings via Ollama...");
        const embeddedChunks = [];
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await this.getEmbedding(chunks[i].text);
            embeddedChunks.push({
                text: chunks[i].text,
                embedding: embedding,
                metadata: chunks[i].metadata,
            });
            process.stdout.write(`\r  → Embedded ${i + 1}/${chunks.length} chunks`);
        }
        console.log("");

        // Step 4: Store in vector store (in-memory for fast search)
        this.vectorStore.clear();
        this.vectorStore.loadDocuments(embeddedChunks);

        // Step 5: Persist to Supabase for future loads
        console.log("  → Saving chunks to Supabase...");
        await this.docLoader.deleteChunks(securityKey);
        await this.docLoader.saveChunks(embeddedChunks);

        this.initialized[securityKey] = true;
        console.log(`✅ Ingestion complete. ${embeddedChunks.length} chunks indexed.\n`);
    }

    /**
     * Load pre-indexed chunks from Supabase into memory
     * @param {string} securityKey
     */
    async loadFromDB(securityKey) {
        if (this.initialized[securityKey]) return;

        console.log(`📂 Loading cached chunks for key: ${securityKey}...`);
        const chunks = await this.docLoader.loadChunks(securityKey);

        if (chunks.length > 0) {
            this.vectorStore.loadDocuments(chunks);
            this.initialized[securityKey] = true;
            console.log(`  → Loaded ${chunks.length} chunks from database.`);
        } else {
            console.log("  → No cached chunks found. Running fresh ingestion...");
            await this.ingest(securityKey);
        }
    }

    /**
     * QUERY PIPELINE — Answer a user question using RAG
     * @param {string} question - User's question
     * @param {string} securityKey - Client's security key
     * @param {object} dashboardContext - Current dashboard data (score, issues)
     * @returns {string} AI-generated answer
     */
    async query(question, securityKey, dashboardContext = {}) {
        // Ensure data is loaded
        await this.loadFromDB(securityKey);

        // Step 1: Embed the question
        const queryEmbedding = await this.getEmbedding(question);

        if (queryEmbedding.length === 0) {
            return "I couldn't process your question. Please ensure Ollama is running locally.";
        }

        // Step 2: Retrieve top-5 most relevant chunks
        const results = this.vectorStore.search(queryEmbedding, 5);
        const contextChunks = results.map((r) => r.text).join("\n\n");

        // Step 3: Build the augmented prompt
        const systemPrompt = `You are the AI assistant of a cybersecurity platform called 'Security Guardian'.
Your role is to help users understand and improve their system security.
Be concise, helpful, and use simple language. Always reference the user's actual data.
Give actionable suggestions. Never give overly technical jargon.`;

        const augmentedPrompt = `${systemPrompt}

### Retrieved Security Context:
${contextChunks}

### Current Dashboard Data:
${JSON.stringify(dashboardContext)}

### User Question:
${question}

### Your Response:`;

        // Step 4: Generate answer using LLaMA 3
        const answer = await this.generate(augmentedPrompt);
        return answer;
    }
}

module.exports = RAGPipeline;
