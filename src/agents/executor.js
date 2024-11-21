const vm = require('vm');
const { GoalNear, GoalFollow, GoalXZ, GoalGetToBlock, GoalLookAtBlock } = require('mineflayer-pathfinder').goals;
const Vec3 = require('vec3').Vec3;
const logger = require('../utils/logger');
const Action = require('../skills/action');

class Executor {
    constructor(bot, world) {
        this.bot = bot;
        this.world = world;
        this._currentTask = null;
        this._currentContext = null;
    }

    get lastError() {
        return this._lastError || '没有错误';
    }

    init(){
        this.initializeDependencies();
        this._lastError = '';
    }
    reset() {
        this._lastError = '';
    }

    // 初始化基础依赖
    initializeDependencies() {
        const mcData = require('minecraft-data')(this.bot.version);
        if(!mcData){
            throw new Error('mcData 初始化失败');
        }
        const action = new Action(this.bot, logger);
        this.dependencies = {
            bot: this.bot,
            require,
            console,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            Promise,
            // Mineflayer 相关依赖
            Vec3,
            GoalNear,
            GoalFollow,
            GoalXZ,
            GoalGetToBlock,
            GoalLookAtBlock,
            mcData,
            // 工具类
            action,
            logger,
            world: this.world
        };
    }

    // 准备执行环境
    prepareContext() {
        try {
            return vm.createContext(this.dependencies);
        } catch (error) {
            console.error('创建执行上下文失败:', error);
            throw error;
        }
    }

    // 构造可执行代码
    prepareExecutableCode(code, functionName) {
        return `
            shouldStop = false;
            ${code}
            (async () => {
                await ${functionName}(bot);
            })();
        `;
    }

    // 执行代码
    async run(code, functionName) {
        try {
            const executableCode = this.prepareExecutableCode(code, functionName);
            this._lastError = '';
            const script = new vm.Script(executableCode);
            this._currentContext = this.prepareContext();
            
            // 创建超时控制
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('任务执行超时'));
                }, 30000); // 30秒超时
            });
            
            // 执行主任务
            const executionPromise = script.runInContext(this._currentContext, {
                timeout: 30000,
                filename: 'dynamic-code.js'
            });

            // 使用 Promise.race 处理超时
            this._currentTask = Promise.race([
                executionPromise,
                timeoutPromise
            ]);

            await this._currentTask;

        } catch (error) {
            this._lastError = error.message;
            logger.error('代码执行错误');
            logger.pure('RED', error);
        } finally {
            await this.cleanup();
        }
    }

    async cleanup() {
        //停止当前任务
        if (this._currentContext && !this._currentContext.hasStopped) {
            // 设置停止标志
            logger.info("强制停止任务");
            this._currentContext.shouldStop = true;
        }
        // 清空当前任务
        this._currentTask = null;
        this._currentContext = null;
    }
}

module.exports = Executor; 