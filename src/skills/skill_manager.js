const logger = require('../utils/logger');
const VectorDB = require('./vector_db');
const llm = require('../utils/llm');
const { v4: uuidv4 } = require('uuid');

class SkillManager {
    constructor() {
        this.vectorDB = new VectorDB();
    }

    async init() {
        await this.vectorDB.init();
    }

    async saveSkill(description, functionName) {
        const embedding = await llm.getEmbedding(description);
        const skill = {
            id: uuidv4(),
            vector: embedding,
            description: description,
            metadata: {
                functionName
            }
        }
        return await this.vectorDB.save(skill);
    }

    async getSkill(description) {
        const embedding = await llm.getEmbedding(description);
        const result = await this.vectorDB.search(embedding, {
            limit: 1,
            minScore: 0.8
        });
        return result.length > 0 ? result[0] : null;
    }
}

module.exports = SkillManager;