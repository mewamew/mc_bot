



module.exports = {
    /* 优先使用环境变量中的 API_KEY,如果没有则使用默认值 */
    API_KEY: process.env.LLM_API_KEY,
    API_URL: process.env.LLM_API_URL,
    MODEL: process.env.LLM_MODEL,
};
