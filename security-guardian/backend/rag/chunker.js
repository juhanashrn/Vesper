/**
 * Document Chunker
 * Splits raw text documents into smaller overlapping chunks for embedding.
 */

class Chunker {
    /**
     * @param {number} chunkSize - Max characters per chunk
     * @param {number} overlap - Character overlap between chunks
     */
    constructor(chunkSize = 500, overlap = 50) {
        this.chunkSize = chunkSize;
        this.overlap = overlap;
    }

    /**
     * Split a single text into chunks
     * @param {string} text - The raw text to chunk
     * @param {object} metadata - Metadata to attach to each chunk (e.g. source, security_key)
     * @returns {Array<{text: string, metadata: object}>}
     */
    chunkText(text, metadata = {}) {
        if (!text || text.trim().length === 0) return [];

        const chunks = [];
        const sentences = text.split(/(?<=[.!?\n])\s+/);
        let currentChunk = "";

        for (const sentence of sentences) {
            if ((currentChunk + " " + sentence).length > this.chunkSize && currentChunk.length > 0) {
                chunks.push({
                    text: currentChunk.trim(),
                    metadata: { ...metadata },
                });

                // Keep overlap from the end of the current chunk
                const words = currentChunk.split(" ");
                const overlapWords = words.slice(-Math.ceil(this.overlap / 5));
                currentChunk = overlapWords.join(" ") + " " + sentence;
            } else {
                currentChunk += (currentChunk ? " " : "") + sentence;
            }
        }

        // Push the final chunk
        if (currentChunk.trim()) {
            chunks.push({
                text: currentChunk.trim(),
                metadata: { ...metadata },
            });
        }

        return chunks;
    }

    /**
     * Build structured security documents from raw client + questionnaire data
     * @param {object} clientData - From 'clients' table
     * @param {object} questionnaireData - From 'product_questionnaire' table
     * @param {Array} vulnerabilities - From 'vulnerabilities' table
     * @returns {Array<{text: string, metadata: object}>}
     */
    buildSecurityDocuments(clientData, questionnaireData, vulnerabilities = []) {
        const allChunks = [];
        const securityKey = clientData?.security_key || "UNKNOWN";

        // Client Profile Document
        if (clientData) {
            const profileDoc = [
                `Client Profile for ${clientData.company || "Unknown Company"}.`,
                `Contact: ${clientData.name || "N/A"} (${clientData.email || "N/A"}).`,
                `Product Type: ${clientData.product || "N/A"}.`,
                `Security Key: ${securityKey}.`,
            ].join("\n");

            allChunks.push(...this.chunkText(profileDoc, {
                source: "client_profile",
                security_key: securityKey,
            }));
        }

        // Architecture & Threat Model Document
        if (questionnaireData) {
            const archDoc = [
                `Security Architecture Assessment for ${clientData?.company || "the client"}.`,
                `Authentication Method: ${questionnaireData.auth_method || "Not specified"}.`,
                `API Exposure: ${questionnaireData.exposes_api || "Not specified"}. ${questionnaireData.exposes_api === "Yes" ? "Public APIs are exposed, which increases the attack surface for injection attacks, DDoS, and unauthorized access." : ""}`,
                `Deployment Environment: ${questionnaireData.deployment_env || "Not specified"}. ${questionnaireData.deployment_env?.includes("Cloud") ? "Cloud deployments require careful IAM configuration, network segmentation, and encryption at rest." : ""}`,
                `Handles Sensitive Data: ${questionnaireData.handles_sensitive_data || "Not specified"}. ${questionnaireData.handles_sensitive_data === "Yes" ? "Sensitive data handling requires encryption, access controls, audit logging, and compliance with regulations like GDPR/HIPAA." : ""}`,
                `Dependency Scanning: ${questionnaireData.dependency_scan || "Not specified"}. ${questionnaireData.dependency_scan === "Never / Not tracked" ? "WARNING: No dependency scanning detected. This is a critical gap — supply chain attacks are among the top threat vectors." : ""}`,
            ].join("\n");

            allChunks.push(...this.chunkText(archDoc, {
                source: "architecture_assessment",
                security_key: securityKey,
            }));
        }

        // Vulnerability Documents
        if (vulnerabilities && vulnerabilities.length > 0) {
            const vulnDoc = vulnerabilities.map((v, i) =>
                `Vulnerability #${i + 1}: "${v.title}" — Severity: ${v.severity}. ${v.severity === "High" ? "This is a CRITICAL issue that requires immediate remediation." : v.severity === "Medium" ? "This should be addressed in the next sprint cycle." : "Monitor and address when resources allow."}`
            ).join("\n");

            allChunks.push(...this.chunkText(vulnDoc, {
                source: "vulnerabilities",
                security_key: securityKey,
            }));
        }

        // General Security Knowledge Base
        const securityKB = [
            "Common web application attack vectors include: SQL Injection, Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), Server-Side Request Forgery (SSRF), Broken Authentication, and Insecure Direct Object References (IDOR).",
            "OWASP Top 10 security risks for 2024: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Authentication Failures, Data Integrity Failures, Logging Failures, and SSRF.",
            "Best practices for API security: Use OAuth 2.0 or JWT tokens, implement rate limiting, validate all inputs, use HTTPS everywhere, enable CORS properly, and log all access attempts.",
            "Cloud security essentials: Enable MFA for all admin accounts, use least-privilege IAM policies, encrypt data at rest and in transit, enable audit logging, segment networks with VPCs, and regularly rotate credentials.",
            "Dependency management best practices: Use tools like Snyk or Dependabot for automated vulnerability scanning, pin dependency versions, review changelogs before upgrades, and maintain a Software Bill of Materials (SBOM).",
        ].join("\n\n");

        allChunks.push(...this.chunkText(securityKB, {
            source: "security_knowledge_base",
            security_key: "GLOBAL",
        }));

        return allChunks;
    }
}

module.exports = Chunker;
