const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.logDir = options.logDir || 'logs';
        this.logFile = options.logFile || 'app.log';
        this.logPath = path.join(this.logDir, this.logFile);
        
        // 确保日志目录存在
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] ${message}`;
    }

    writeToFile(formattedMessage) {
        fs.appendFileSync(this.logPath, formattedMessage + '\n');
    }

    log(level, message) {
        const formattedMessage = this.formatMessage(level, message);
        
        // 控制台输出
        console.log(formattedMessage);
        
        // 写入文件
        this.writeToFile(formattedMessage);
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
}

module.exports = new Logger(); 