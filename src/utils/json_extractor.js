class JsonHelper {
    extract(text) {
        try {
            // 首先尝试直接解析JSON
            return JSON.parse(text);
        } catch (error) {
            try {   
                // 直接解析失败,尝试提取代码块中的JSON
                const match = text.match(/```json\s*([\s\S]*?)\s*```/);
                if (!match || !match[1]) {
                console.error('找不到```json```代码块');
                    return null;
                }

                try {
                    // 尝试解析提取出的JSON内容
                    return JSON.parse(match[1]);
                } catch (error) {
                    console.error('JSON解析失败:', error);
                    return null;
                }
            } catch (error) {
                console.error('找不到```json```代码块');
                return null;
            }
            

        }
    }
}

module.exports = new JsonHelper(); 