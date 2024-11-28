const axios = require('axios');
const fs = require('fs');
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
          /*
          logger.error(`LLM API调用失败 (尝试 ${retries + 1}/${maxRetries + 1}):`, {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
          */
        }

        retries++;
        //logger.warn(`LLM API调用失败，${retryDelay/1000}秒后进行第${retries}次重试...`);
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


  /**
   * 处理带有函数调用功能的 LLM 请求，只返回函数调用信息
   * @param {Array} messages - 对话消息数组
   * @param {Array} tools - 可用的函数工具列表
   * @param {number} temperature - 温度参数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} retryDelay - 重试延迟时间(ms)
   * @returns {Object|null} 函数调用信息，如果没有函数调用则返回null
   */
  async callFunction(messages, tools, temperature = 0.7, maxRetries = 3, retryDelay = 1000) {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        if (LLM_DEBUG != "false") {
          logger.info("===== LLM函数调用输入 ==== ");
          logger.pure('CYAN', messages[0].content);
        }

        const response = await axios.post(this.API_URL, {
          model: this.MODEL,
          messages: messages,
          tools: tools,
          temperature: temperature,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`
          },
          timeout: 30000,
        });

        const result = response.data.choices[0];
        if (LLM_DEBUG != "false") {
          logger.info("===== LLM函数调用返回 ==== ");
          logger.pure('YELLOW', JSON.stringify(result.message.tool_calls || '无函数调用', null, 2));
        }
        return result.message.tool_calls;

      } catch (error) {
        const isRetryable = error.response?.status >= 500 || error.code === 'ECONNABORTED';
        
        if (retries === maxRetries || !isRetryable) {
          logger.error(`函数调用失败 (尝试 ${retries + 1}/${maxRetries + 1}):`, {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
          return null;
        }

        retries++;
        logger.warn(`函数调用失败，${retryDelay/1000}秒后进行第${retries}次重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

module.exports = new LLM();