/**
 * Document Loader
 * Fetches client data from Supabase and prepares it for the RAG pipeline.
 */

const { createClient } = require("@supabase/supabase-js");

// Use the same Supabase credentials
const supabaseUrl = "https://vxyeggmiqsiqvnbkrzpe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4eWVnZ21pcXNpcXZuYmtyenBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODMzNTgsImV4cCI6MjA5MDQ1OTM1OH0.-ptneNuhaLRb3aYy8qLbsMkMH2K3EyWG5x0JCepbcHM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class DocumentLoader {
    /**
     * Load all data for a specific security key
     * @param {string} securityKey
     * @returns {object} { client, questionnaire, vulnerabilities }
     */
    async loadBySecurityKey(securityKey) {
        const [clientRes, questRes, vulnRes] = await Promise.all([
            supabase
                .from("clients")
                .select("*")
                .eq("security_key", securityKey)
                .limit(1)
                .single(),
            supabase
                .from("product_questionnaire")
                .select("*")
                .eq("security_key", securityKey)
                .limit(1)
                .single(),
            supabase
                .from("vulnerabilities")
                .select("*")
                .eq("security_key", securityKey),
        ]);

        return {
            client: clientRes.data || null,
            questionnaire: questRes.data || null,
            vulnerabilities: vulnRes.data || [],
        };
    }

    /**
     * Save processed chunks to Supabase knowledge_chunks table
     * @param {Array} chunks - Array of {text, embedding, metadata}
     */
    async saveChunks(chunks) {
        if (!chunks || chunks.length === 0) return;

        const rows = chunks.map((c) => ({
            security_key: c.metadata.security_key || "GLOBAL",
            source: c.metadata.source || "unknown",
            chunk_text: c.text,
            embedding: c.embedding || [],
        }));

        const { error } = await supabase.from("knowledge_chunks").insert(rows);
        if (error) {
            console.error("Error saving chunks to Supabase:", error.message);
        } else {
            console.log(`Saved ${rows.length} chunks to knowledge_chunks table.`);
        }
    }

    /**
     * Load pre-embedded chunks from Supabase for a security key
     * @param {string} securityKey
     * @returns {Array}
     */
    async loadChunks(securityKey) {
        // Load client-specific chunks + global knowledge base chunks
        const { data, error } = await supabase
            .from("knowledge_chunks")
            .select("*")
            .or(`security_key.eq.${securityKey},security_key.eq.GLOBAL`);

        if (error) {
            console.error("Error loading chunks:", error.message);
            return [];
        }

        return (data || []).map((row) => ({
            text: row.chunk_text,
            embedding: row.embedding || [],
            metadata: {
                source: row.source,
                security_key: row.security_key,
            },
        }));
    }

    /**
     * Delete existing chunks for a security key (for re-indexing)
     */
    async deleteChunks(securityKey) {
        await supabase
            .from("knowledge_chunks")
            .delete()
            .eq("security_key", securityKey);
    }
}

module.exports = DocumentLoader;
