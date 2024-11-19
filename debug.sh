#!/bin/bash
# 设置环境变量
# 清屏
clear

export LLM_DEBUG=true

# 302
#export LLM_API_KEY="sk-KjYoBXsO45V70PgrzNNEf1sM34EaZeVPAi3LDdEOl8C5d1WW"
#export LLM_API_URL="https://api.302.ai/v1/chat/completions"
#export EMBEDDING_API_URL="https://api.302.ai/v1/embeddings"
#export LLM_MODEL="gpt-4o-mini"
# export LLM_MODEL="o1-mini"
# export LLM_MODEL="o1-preview"
# export LLM_MODEL="claude-3-5-sonnet-20241022"

# glm
export LLM_API_KEY="70e8b914a92931f33a35040f2d51bd31.lXmsLAQYvfdcCRe1"
export LLM_API_URL="https://open.bigmodel.cn/api/paas/v4/chat/completions"
export LLM_MODEL="glm-4-plus"

# deepseek
# export LLM_API_KEY="sk-30e07f23431d423cb96f0f29fb83bebf"
# export LLM_API_URL="https://api.deepseek.com/v1/chat/completions"
# export LLM_MODEL="deepseek-chat"

# 运行程序
node src/debug.js

# 暂停以查看输出（可选）
read -p "按回车键继续..." 