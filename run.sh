#!/bin/bash
# 设置环境变量
# 清屏
clear

export LLM_DEBUG=true

# 定义模型选择变量
MODEL_CHOICE="glm-4"  # 可选: gpt4-mini, claude-3.5, glm-4

case $MODEL_CHOICE in
    "gpt4-mini")
        echo "使用 GPT-4o-mini 模型运行~"
        export LLM_API_KEY="填你的API KEY"
        export LLM_API_URL="平台URL"
        export EMBEDDING_API_URL="平台URL"
        export LLM_MODEL="gpt-4o-mini"
        ;;
    "claude-3.5")
        echo "使用 Claude-3.5 模型运行~"
        export LLM_API_KEY="填你的API KEY"
        export LLM_API_URL="平台URL"
        export EMBEDDING_API_URL="平台URL"
        export LLM_MODEL="claude-3-5-sonnet-20241022"
        ;;
    "glm-4")
        echo "使用 GLM-4 模型运行~"
        export LLM_API_KEY="填你的API KEY"
        export LLM_API_URL="https://open.bigmodel.cn/api/paas/v4/chat/completions"
        export LLM_MODEL="glm-4-plus"
        ;;
    *)
        echo "未知的模型选择，请检查 MODEL_CHOICE 设置"
        exit 1
        ;;
esac

# 运行程序
npm start

# 暂停以查看输出（可选）
read -p "按回车键继续..." 