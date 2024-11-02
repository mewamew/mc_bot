class JsonHelper {
    extract(text) {
        // 匹配 ```json 和 ``` 之间的内容
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (!match || !match[1]) {
            return null;
        }
        
        try {
            // 尝试解析JSON
            const jsonContent = JSON.parse(match[1]);
            return jsonContent;
        } catch (error) {
            console.error('JSON解析失败:', error);
            return null;
        }
    }
}

module.exports = new JsonHelper(); 