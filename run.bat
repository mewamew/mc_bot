@echo off
rem 设置环境变量
cls

rem 定义模型选择变量（0表示使用GPT-4o-mini，1表示使用Claude-3.5）
set MODEL_CHOICE=1

if %MODEL_CHOICE%==0 (
    echo 使用 GPT-4o-mini 模型运行~
    set LLM_API_KEY=sk-fwmdZgBWQuTTCA4JL3D8ocXk1hWQJlT6hFfy7ypM9OXinCpR
    set LLM_API_URL=https://api.302.ai/v1/chat/completions
    set EMBEDDING_API_URL=https://api.302.ai/v1/embeddings
    set LLM_MODEL=gpt-4o-mini
) else (
    echo 使用 Claude-3.5 模型运行~
    set LLM_API_KEY=sk-KjYoBXsO45V70PgrzNNEf1sM34EaZeVPAi3LDdEOl8C5d1WW
    set LLM_API_URL=https://api.302.ai/v1/chat/completions
    set EMBEDDING_API_URL=https://api.302.ai/v1/embeddings
    set LLM_MODEL=claude-3-5-sonnet-20241022
)

set LLM_DEBUG=true

rem 运行程序
npm start

rem 暂停以查看输出
pause 