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
        return `[${timestamp}] [${level}]\n ${message}`;
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

    report(message,bot) {
        if (this.reportMessage != "") {
            this.reportMessage += "\n";
        }
        this.reportMessage += message;
        bot.chat(message);
    }

    getLastReport() {
        return this.reportMessage;
    }

    clearReport() {
        this.reportMessage = '';
    }
}

module.exports = new Logger(); 