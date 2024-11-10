const { ChromaClient } = require('chromadb');
const logger = require('../logger');

class VectorDB {
    constructor() {
        // ChromaDB客户端
        this.client = new ChromaClient();
        this.collection = null;
        this.collectionName = "minecraft_skills";
    }

    /**
     * 初始化数据库连接和集合
     */
    async init() {
        try {
            // 获取或创建集合
            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: { 
                    "description": "Minecraft bot skills collection",
                    "created_at": new Date().toISOString()
                }
            });
            
            logger.info(`向量数据库初始化成功: ${this.collectionName}`);
            return true;
        } catch (error) {
            logger.error('向量数据库初始化失败:', error);
            return false;
        }
    }

    /**
     * 保存技能到数据库
     * @param {Object} skill 技能对象
     * @param {string} skill.id 技能ID
     * @param {number[]} skill.vector 向量表示
     * @param {string} skill.description 技能描述
     * @param {string} skill.code 技能代码
     * @param {Object} skill.metadata 元数据
     */
    async save(skill) {
        try {
            await this.collection.add({
                ids: [skill.id],
                embeddings: [skill.vector],
                metadatas: [{
                    description: skill.description,
                    code: skill.code,
                    ...skill.metadata
                }]
            });
            logger.info(`技能保存成功: ${skill.id}`);
            return true;
        } catch (error) {
            logger.error('技能保存失败:', error);
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
            const results = await this.collection.query({
                queryEmbeddings: [queryVector],
                nResults: options.limit,
            });

            // 处理结果
            if (!results || !results.metadatas || !results.metadatas[0]) {
                return [];
            }

            // 转换结果格式
            return results.metadatas[0].map((metadata, index) => ({
                id: results.ids[0][index],
                score: results.distances[0][index],
                description: metadata.description,
                code: metadata.code,
                metadata: metadata
            })).filter(item => item.score >= options.minScore);

        } catch (error) {
            logger.error('技能搜索失败:', error);
            return [];
        }
    }

    /**
     * 获取所有技能
     */
    async getAll() {
        try {
            const results = await this.collection.get();
            return results.metadatas.map((metadata, index) => ({
                id: results.ids[index],
                description: metadata.description,
                code: metadata.code,
                metadata: metadata
            }));
        } catch (error) {
            logger.error('获取所有技能失败:', error);
            return [];
        }
    }

    /**
     * 删除技能
     * @param {string} skillId 技能ID
     */
    async delete(skillId) {
        try {
            await this.collection.delete({
                ids: [skillId]
            });
            logger.info(`技能删除成功: ${skillId}`);
            return true;
        } catch (error) {
            logger.error('技能删除失败:', error);
            return false;
        }
    }
}

module.exports = VectorDB; 