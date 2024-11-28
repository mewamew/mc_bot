@echo off
rem 设置环境变量
cls

rem 定义模型选择变量
set MODEL_CHOICE=glm-4
echo 使用 %MODEL_CHOICE% 模型运行~

if "%MODEL_CHOICE%"=="gpt4-mini" (
    echo 使用 GPT-4o-mini 模型运行~
    set LLM_API_KEY=填你的API KEY
    set LLM_API_URL=平台URL
    set EMBEDDING_API_URL=平台URL
    set LLM_MODEL=gpt-4o-mini
) else if "%MODEL_CHOICE%"=="claude-3.5" (
    echo 使用 Claude-3.5 模型运行~
    set LLM_API_KEY=填你的API KEY
    set LLM_API_URL=平台URL
    set EMBEDDING_API_URL=平台URL
    set LLM_MODEL=claude-3-5-sonnet-20241022
) else if "%MODEL_CHOICE%"=="glm-4" (
    echo 使用 GLM-4 模型运行~
    set LLM_API_KEY=填你的API KEY
    set LLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
    set LLM_MODEL=glm-4-plus
) else (
    echo 未知的模型选择，请检查 MODEL_CHOICE 设置
    pause
    exit /b 1
)

set LLM_DEBUG=true

rem 运行程序
npm start

rem 暂停以查看输出
pause 