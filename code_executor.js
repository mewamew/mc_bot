const vm = require('vm');
const { GoalNear, GoalFollow, GoalXZ, GoalGetToBlock, GoalLookAtBlock } = require('mineflayer-pathfinder').goals;
const Vec3 = require('vec3').Vec3;

class CodeExecutor {
    constructor(bot) {
        this.bot = bot;
        // 初始化基础依赖
        this.initializeDependencies();
    }

    // 初始化基础依赖
    initializeDependencies() {
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
            // bot 实例和上下文
            bot: this.bot,
            // 工具函数
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
            
            // 包装异步执行
            (async () => {
                try {
                    await ${functionName}(bot);
                } catch (error) {
                    console.error('函数执行错误:', error);
                    throw error;
                }
            })();
        `;
    }

    // 执行代码
    async execute(code, functionName) {
        const executableCode = this.prepareExecutableCode(code, functionName);

        try {
            const context = this.prepareContext();
            const result = await vm.runInContext(executableCode, context, {
                timeout: 30000, // 30秒超时
                filename: 'dynamic-code.js'
            });
            return result;
        } catch (error) {
            if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
                console.error('代码执行超时');
                throw new Error('代码执行超时');
            }
            console.error('代码执行错误:', error);
            throw error;
        }
    }

    // 清理资源
    cleanup() {
        // 清理定时器等资源
        Object.keys(this.dependencies).forEach(key => {
            if (this.dependencies[key] && typeof this.dependencies[key].destroy === 'function') {
                this.dependencies[key].destroy();
            }
        });
    }
}

module.exports = CodeExecutor; 