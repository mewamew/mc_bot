const axios = require('axios');
const { API_KEY, API_URL, MODEL } = require('./config');

class LLM {
  constructor() {
    this.API_URL = API_URL;
    this.API_KEY = API_KEY;
    this.MODEL = MODEL;
  }

  async call(messages, temperature = 0.7) {
    console.log("API_KEY: ", this.API_KEY);
    try {
      const response = await axios.post(this.API_URL, {
        model: this.MODEL,
        messages: messages,
        temperature: temperature,
        top_p: 0.95,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        }
      });
      return response.data.choices[0].message.content.trim();z
    } catch (error) {
      console.error('调用GLM-4 API时出错:', error);
      throw error;
    }
  }
}

module.exports = new LLM();

