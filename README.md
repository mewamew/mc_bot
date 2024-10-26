# Minecraft AI 伴侣机器人

这是一个基于 mineflayer 的 Minecraft AI 伴侣机器人项目，能够通过自然语言与玩家互动并执行各种任务。

## 功能

- 移动到玩家附近 (come)
- 收集木材资源 (collect)
- 自动战斗与保护玩家 (kill)
- 自然语言交互
- 3D 可视化界面

## 依赖项

- Node.js
- mineflayer
- mineflayer-pathfinder
- mineflayer-collectblock
- mineflayer-pvp
- prismarine-viewer

## 使用方法

1. 确保已安装 Node.js
2. 克隆此仓库
3. 安装依赖：
4. 在 `key.js` 中配置你的 GLM API 密钥
5. 在 `bot.js` 中配置服务器连接信息：
   - host: Minecraft 服务器地址
   - port: 服务器端口（默认 25565）
   - username: 机器人用户名
6. 启动机器人：
node bot.js

## 使用示例

在游戏中直接用自然语言与机器人对话：

- "花花，来我这里" - 机器人会移动到你身边
- "帮我收集一些木头" - 机器人会自动收集附近的木材
- "救救我" - 机器人会攻击附近的敌对生物

## 可视化界面

机器人启动后，可以通过浏览器访问 `http://localhost:3007` 查看 3D 视角的机器人状态。
