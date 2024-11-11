const fs = require('fs/promises');
const path = require('path');
const logger = require('../utils/logger');

class VectorDB {
    constructor() {
        // JSON文件存储路径，改为相对于当前文件的路径
        this.dbPath = path.dirname(__filename); // 获取当前文件所在目录
        this.dbFile = path.join(this.dbPath, "db.json");
        // 内存中的数据
        this.data = [];
    }

    /**
     * 初始化数据库
     */
    async init() {
        try {
            // 确保目录存在
            await fs.mkdir(this.dbPath, { recursive: true });
            
            try {
                // 尝试读取现有数据
                const content = await fs.readFile(this.dbFile, 'utf-8');
                this.data = JSON.parse(content);
                logger.info(`成功加载数据文件: ${this.dbFile}`);
            } catch (error) {
                // 文件不存在时创建空数据文件
                this.data = [];
                await this.saveToFile();
                logger.info(`创建新的数据文件: ${this.dbFile}`);
            }
            return true;
        } catch (error) {
            logger.error('向量数据库初始化失败:', {
                message: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * 将数据保存到文件
     */
    async saveToFile() {
        try {
            await fs.writeFile(this.dbFile, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            logger.error('保存数据文件失败:', error);
            return false;
        }
    }

    /**
     * 计算余弦相似度
     */
    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * 保存技能到数据库
     * @param {Object} skill 技能对象
     * @param {string} skill.id 技能ID
     * @param {number[]} skill.vector 向量表示
     * @param {string} skill.description 技能描述
     * @param {Object} skill.metadata 元数据
     */
    async save(skill) {
        try {
            // 检查是否已存在相同ID的技能
            const index = this.data.findIndex(item => item.id === skill.id);
            if (index !== -1) {
                this.data[index] = {
                    ...skill,
                    created_at: new Date().toISOString()
                };
            } else {
                this.data.push({
                    ...skill,
                    created_at: new Date().toISOString()
                });
            }
            await this.saveToFile();
            logger.info(`技能保存成功: ${skill.id}`);
            return true;
        } catch (error) {
            logger.error('技能保存失败:', {
                message: error.message,
                skillId: skill.id
            });
            return false;
        }
    }

    /**
     * 搜索相似技能
     * @param {number[]} queryVector 查询向量
     * @param {Object} options 查询选项
     * @param {number} options.limit 返回结果数量
     * @param {number} options.minScore 最小相似度分数
     */
    async search(queryVector, options = { limit: 5, minScore: 0.8 }) {
        try {
            if (this.data.length === 0) {
                logger.info('数据为空，无法执行搜索');
                return [];
            }

            if (!Array.isArray(queryVector) || queryVector.length !== 1536) {
                logger.error('无效的查询向量格式或维度');
                return [];
            }

            // TODO 效率低下,计算所有向量的相似度并排序
            const results = this.data
                .map(item => ({
                    ...item,
                    score: this.cosineSimilarity(queryVector, item.vector)
                }))
                .filter(item => item.score >= options.minScore)
                .sort((a, b) => b.score - a.score)
                .slice(0, options.limit)
                .map(({ id, score, description, metadata }) => ({
                    id, score, description, metadata
                }));

            return results;
        } catch (error) {
            logger.error('搜索失败:', error);
            return [];
        }
    }

    /**
     * 获取所有技能
     */
    async getAll() {
        return this.data.map(({ id, description, metadata }) => ({
            id, description, metadata
        }));
    }

    /**
     * 删除技能
     * @param {string} skillId 技能ID
     */
    async delete(skillId) {
        try {
            const initialLength = this.data.length;
            this.data = this.data.filter(item => item.id !== skillId);
            
            if (this.data.length === initialLength) {
                logger.warn(`未找到要删除的技能: ${skillId}`);
                return false;
            }

            await this.saveToFile();
            logger.info(`技能删除成功: ${skillId}`);
            return true;
        } catch (error) {
            logger.error('技能删除失败:', {
                message: error.message,
                skillId: skillId
            });
            return false;
        }
    }
}

module.exports = VectorDB; 