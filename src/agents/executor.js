const vm = require('vm');
const { GoalNear, GoalFollow, GoalXZ, GoalGetToBlock, GoalLookAtBlock } = require('mineflayer-pathfinder').goals;
const Vec3 = require('vec3').Vec3;
const logger = require('../utils/logger');


class Executor {
    constructor(bot) {
        this.bot = bot;
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
        this.dependencies = {
            require,
            console,
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
            Promise,
            // Minecraft 相关依赖
            Vec3,
            GoalNear,
            GoalFollow,
            GoalXZ,
            GoalGetToBlock,
            GoalLookAtBlock,
            mcData,
            logger,
            bot: this.bot,
            sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
        };
    }

    // 添加额外的依赖
    addDependency(name, value) {
        this.dependencies[name] = value;
        return this;
    }

    // 添加多个依赖
    addDependencies(dependencies) {
        Object.assign(this.dependencies, dependencies);
        return this;
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
            ${code}
            (async () => {
                await ${functionName}(bot);
            })();
        `;
    }

    // 执行代码
    async run(code, functionName) {
        const executableCode = this.prepareExecutableCode(code, functionName);
        try {
            this._lastError = '';
            const script = new vm.Script(executableCode);
            const context = this.prepareContext();
            const result = await script.runInNewContext(this.dependencies, {
                timeout: 30000,
                filename: 'dynamic-code.js'
            });
            return result;
        } catch (error) {
            this._lastError = error.message;
            console.error('代码执行错误:', error);
        }
    }
}

module.exports = Executor; 