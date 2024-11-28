# Minecraft AI游戏搭子

这是一个基于 mineflayer 的 Minecraft AI 伴侣机器人项目，能够通过自然语言与玩家互动并执行各种任务。

## 进度
目前成功从0制作一把铁镐

## 使用前准备

1. **确保已安装 Node.js**
2. **启动 Minecraft 服务器**
   - 端口设置为 25565
   - 游戏版本需要与机器人兼容

## 安装步骤

1. **克隆此仓库**
   ```bash
   git clone https://github.com/mewamew/mc_bot.git
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置 API**
   - Windows: 在 `run.bat` 中设置 API KEY 和模型
   - Mac/Linux: 在 `run.sh` 中设置 API KEY 和模型

## 启动方法

- **Windows**:
  ```bash
  ./run.bat
  ```

- **Mac/Linux**:
  ```bash
  chmod +x run.sh
  ./run.sh
  ```

## 使用示例

1. 在游戏中输入指令，机器人会自动执行相应任务
2. 示例指令：
   - "帮我制作一把铁镐"
   - "收集一些木头"
   - "帮我挖煤矿"

## 注意事项

1. 确保游戏服务器已经启动
2. 确保端口号设置正确（默认25565）
3. 确保已正确配置 API KEY
4. 建议在创造模式下测试功能


