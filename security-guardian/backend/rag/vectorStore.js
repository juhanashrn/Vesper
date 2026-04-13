/**
 * Simple Vector Store with Cosine Similarity
 * Stores document chunks with their embeddings and performs semantic search.
 */

class VectorStore {
    constructor() {
        this.documents = []; // { text, embedding, metadata }
    }

    /**
     * Add a document chunk with its embedding
     */
    addDocument(text, embedding, metadata = {}) {
        this.documents.push({ text, embedding, metadata });
    }

    /**
     * Load documents in bulk
     */
    loadDocuments(docs) {
        this.documents = docs;
    }

    /**
     * Cosine similarity between two vectors
     */
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Search for the top-k most similar documents to the query embedding
     */
    search(queryEmbedding, topK = 5) {
        if (this.documents.length === 0) return [];

        const scored = this.documents.map((doc) => ({
            text: doc.text,
            metadata: doc.metadata,
            score: this.cosineSimilarity(queryEmbedding, doc.embedding),
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    /**
     * Get document count
     */
    size() {
        return this.documents.length;
    }

    /**
     * Clear all documents
     */
    clear() {
        this.documents = [];
    }
}

module.exports = VectorStore;
