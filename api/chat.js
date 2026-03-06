export default async function handler(req, res) {
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { messages } = req.body; 
    const apiKey = process.env.GEMINI_API_KEY; 
    const BASE_URL = "https://hiapi.online/v1/chat/completions"; 

    try {
        // 转换前端发来的消息格式
        const openAiMessages = messages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.parts[0].text
        }));

        // 直接调用 AI，不再检查权限
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${apiKey}` 
            },
            body: JSON.stringify({ 
                model: "gpt-4o-mini", 
                messages: openAiMessages, 
                temperature: 0.7 
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);
        
        res.status(200).json({ answer: data.choices[0].message.content });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ answer: `AI 服务调用失败: ${error.message}` });
    }
}
