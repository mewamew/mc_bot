const axios = require('axios');
const logger = require('./logger');
const { API_KEY, API_URL, MODEL, EMBEDDING_API_URL, LLM_DEBUG } = require('./config');

class LLM {
  constructor() {
    this.API_URL = API_URL;
    this.API_KEY = API_KEY;
    this.EMBEDDING_API_URL = EMBEDDING_API_URL;
    this.MODEL = MODEL;
  }
  

  async call(messages, temperature = 0.7, maxRetries = 3, retryDelay = 1000) {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {

        if (LLM_DEBUG != "false") {
          logger.info("===== LLM输入 ==== ");
          logger.pure('CYAN', messages[0].content);
        }

        const response = await axios.post(this.API_URL, {
          model: this.MODEL,
          messages: messages,
          temperature: temperature,
          top_p: 0.95,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`
          },
          timeout: 30000, // 设置30秒超时
        });

        if (LLM_DEBUG  != "false") {
          logger.info("===== LLM调用返回 ==== ");
          logger.pure('YELLOW', response.data.choices[0].message.content.trim());
        }
        return response.data.choices[0].message.content.trim();

      } catch (error) {
        const isRetryable = error.response?.status >= 500 || error.code === 'ECONNABORTED';
        
        if (retries === maxRetries || !isRetryable) {
          logger.error(`LLM API调用失败 (尝试 ${retries + 1}/${maxRetries + 1}):`, {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
        }

        retries++;
        logger.warn(`LLM API调用失败，${retryDelay/1000}秒后进行第${retries}次重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async getEmbedding(text, maxRetries = 3, retryDelay = 1000) {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        // 清理输入文本
        const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const response = await axios.post(
          this.EMBEDDING_API_URL,
          {
            model: 'text-embedding-ada-002',
            input: cleanText
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.API_KEY}`
            },
            timeout: 30000
          }
        );

        const embedding = response.data.data[0].embedding;
        return embedding;

      } catch (error) {
        if (retries === maxRetries) {
          logger.error(`Embedding API调用失败, 超过最大重试次数`);
          return null;
        }
        retries++;
        logger.warn(`Embedding API调用失败，${retryDelay/1000}秒后进行第${retries}次重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

module.exports = new LLM();