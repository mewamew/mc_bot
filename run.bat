@echo off
rem 设置环境变量



rem 302
rem set LLM_API_KEY=sk-w0k5k6dsB9EEn2Oxk2pVSO5nBaIxvuNeSSMKcFIZ0Qv3ZEDA
rem set LLM_API_URL=https://api.302.ai/v1/chat/completions
rem gpt-4o-mini
rem o1-mini
rem o1-preview
rem set LLM_MODEL=claude-3-5-sonnet-20241022

rem glm
rem set LLM_API_KEY=70e8b914a92931f33a35040f2d51bd31.lXmsLAQYvfdcCRe1
rem set LLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
rem set LLM_MODEL=glm-4-plus

rem deepseek
set LLM_API_KEY=sk-30e07f23431d423cb96f0f29fb83bebf
set LLM_API_URL=https://api.deepseek.com/v1/chat/completions
set LLM_MODEL=deepseek-chat


rem 运行程序
npm start

rem 暂停以查看输出（可选）
pause 