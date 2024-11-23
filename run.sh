#!/bin/bash
# 设置环境变量
# 清屏
clear

export LLM_DEBUG=true

# 定义模型选择变量（0表示使用GPT-4o-mini，1表示使用Claude-3.5）
MODEL_CHOICE=1

if [ $MODEL_CHOICE -eq 0 ]; then
    echo "使用 GPT-4o-mini 模型运行~"
    export LLM_API_KEY="sk-fwmdZgBWQuTTCA4JL3D8ocXk1hWQJlT6hFfy7ypM9OXinCpR"
    export LLM_API_URL="https://api.302.ai/v1/chat/completions"
    export EMBEDDING_API_URL="https://api.302.ai/v1/embeddings"
    export LLM_MODEL="gpt-4o-mini"
else
    echo "使用 Claude-3.5 模型运行~"
    export LLM_API_KEY="sk-KjYoBXsO45V70PgrzNNEf1sM34EaZeVPAi3LDdEOl8C5d1WW"
    export LLM_API_URL="https://api.302.ai/v1/chat/completions"
    export EMBEDDING_API_URL="https://api.302.ai/v1/embeddings"
    export LLM_MODEL="claude-3-5-sonnet-20241022"
fi

# 运行程序
npm start

# 暂停以查看输出（可选）
read -p "按回车键继续..." 