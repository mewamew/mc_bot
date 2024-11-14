const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

class Logger {
    constructor(options = {}) {
        this.logDir = options.logDir || 'logs';
        this.logFile = format(new Date(), 'yyyyMMdd') + '.txt';
        this.logPath = path.join(this.logDir, this.logFile);
        this.reportMessage = '';
        
        // 确保日志目录存在
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        // 定义日志级别对应的颜色
        const colors = {
            ERROR: '\x1b[31m', // 红色
            WARN: '\x1b[33m',  // 黄色
            INFO: '\x1b[32m',  // 绿色
            DEBUG: '\x1b[36m'  // 青色
        };
        const resetColor = '\x1b[0m'; // 重置颜色

        // 如果是写入文件，不需要颜色代码
        if (this.isWritingToFile) {
            return `[${timestamp}] [${level}]\n ${message}`;
        }
        
        // 控制台输出带颜色，整个消息都使用相同颜色
        const color = colors[level] || '';
        return `${color}[${timestamp}] [${level}]\n ${message}${resetColor}`;
    }

    writeToFile(formattedMessage) {
        // 移除 ANSI 颜色代码后再写入文件
        const cleanMessage = formattedMessage.replace(/\x1b\[[0-9;]*m/g, '');
        fs.appendFileSync(this.logPath, cleanMessage + '\n');
    }

    pure(color, message) {
        const colors = {
            RED: '\x1b[31m', // 红色
            YELLOW: '\x1b[33m',  // 黄色
            GREEN: '\x1b[32m',  // 绿色
            CYAN: '\x1b[36m',  // 青色
            BLUE: '\x1b[34m'  // 蓝色
        };
        const resetColor = '\x1b[0m'; // 重置颜色
        console.log(`${colors[color]}${message}${resetColor}`);
    }

    log(level, message) {
        this.isWritingToFile = false;
        const consoleMessage = this.formatMessage(level, message);
        
        // 控制台输出
        console.log(consoleMessage);
        
        // 写入文件
        this.isWritingToFile = true;
        const fileMessage = this.formatMessage(level, message);
        this.writeToFile(fileMessage);
    }

    info(message) {
        this.log('INFO', message);
    }

    error(message) {
        this.log('ERROR', message);
    }

    warn(message) {
        this.log('WARN', message);
    }

    debug(message) {
        this.log('DEBUG', message);
    }

    report(message,bot) {
        if (this.reportMessage != "") {
            this.reportMessage += "\n";
        }
        this.reportMessage += message;
        bot.chat(message);
        this.info(message);
    }

    getLastReport() {
        return this.reportMessage;
    }

    clearReport() {
        this.reportMessage = '';
    }
}

module.exports = new Logger(); 