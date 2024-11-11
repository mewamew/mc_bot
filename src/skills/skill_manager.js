const logger = require('../utils/logger');
const VectorDB = require('./vector_db');
const llm = require('../utils/llm');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class SkillManager {
    constructor() {
        this.vectorDB = new VectorDB();
    }

    async init() {
        await this.vectorDB.init();
    }

    async saveSkill(description, functionName, code) {
        const skillId = uuidv4();

        // 保存代码到文件
        const skillDir = path.join(__dirname, 'learned');
        if (!fs.existsSync(skillDir)) {
            fs.mkdirSync(skillDir, { recursive: true });
        }
        
        const filePath = path.join(skillDir, `${skillId}.js`);
        await fs.promises.writeFile(filePath, code);
        
        const embedding = await llm.getEmbedding(description);
        if (!embedding) {
            logger.error(`Embedding API调用失败: ${description}`);
            return false;
        }
        const skill = {
            id: skillId,
            vector: embedding,
            metadata: {
                description,
                functionName
            }
        }
        return await this.vectorDB.save(skill);
    }

    async getSkill(description) {
        const skillDir = path.join(__dirname, 'learned');
        const embedding = await llm.getEmbedding(description);
        const result = await this.vectorDB.search(embedding, {
            limit: 1,
            minScore: 0.7
        });
        if (result.length ==0 ) {
            logger.warn(`没有找到匹配的技能: ${description}`);
            return null;
        }
        logger.info(`找到匹配的技能: ${result[0].metadata.functionName}`);
        const code = fs.readFileSync(path.join(skillDir, `${result[0].id}.js`), 'utf8');
        return {
            description: result[0].metadata.description,
            functionName: result[0].metadata.functionName,
            code: code
        }
    }
}

module.exports = SkillManager;