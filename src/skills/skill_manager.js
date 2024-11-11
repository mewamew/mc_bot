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
        // 保存代码到文件
        const skillDir = path.join(__dirname, 'learned');
        if (!fs.existsSync(skillDir)) {
            fs.mkdirSync(skillDir, { recursive: true });
        }
        
        const filePath = path.join(skillDir, `${functionName}.js`);
        await fs.promises.writeFile(filePath, code);
        
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
        const skillDir = path.join(__dirname, 'learned');
        const embedding = await llm.getEmbedding(description);
        const result = await this.vectorDB.search(embedding, {
            limit: 1,
            minScore: 0.8
        });
        if (result.length ==0 ) {
            logger.warn(`没有找到匹配的技能: ${description}`);
            return null;
        }
        logger.info(`找到匹配的技能: ${result[0].description}`);
        return {
            description: result[0].description,
            functionName: result[0].metadata.functionName,
            code: fs.readFileSync(path.join(skillDir, `${result[0].metadata.functionName}.js`), 'utf8')
        }
    }
}

module.exports = SkillManager;