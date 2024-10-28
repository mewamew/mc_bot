/*
这次用到了智谱的glm-4-flash (因为免费)
可以在下面这个网址中申请
https://bigmodel.cn/
*/
module.exports = {
    /* 优先使用环境变量中的 API_KEY,如果没有则使用默认值 */
    API_KEY: process.env.GLM_API_KEY || 'c6cc39bb4b89ac96cc05604ba98eb219.wq9iMHWYCPLpmDC7',
};
