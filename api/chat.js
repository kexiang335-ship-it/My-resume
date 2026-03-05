export default async function handler(req, res) {
    // 1. 设置跨域头，确保前端能调通
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { messages } = req.body;
    // 这里依然读取你在 Vercel 设置的那个 GEMINI_API_KEY 变量，虽然名字没改，但里面存的是 sk- 密钥
    const apiKey = process.env.GEMINI_API_KEY; 

    // 2. 使用你提供的闲鱼中转地址 (注意：OpenAI协议需在后面补上 /chat/completions)
    const BASE_URL = "https://hiapi.online/v1/chat/completions"; 

    try {
        // 3. 将前端传来的格式转换为 OpenAI 要求的标准格式
        const openAiMessages = messages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.parts[0].text
        }));

        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // 建议用这个，又快又便宜，大部分中转Key都支持
                messages: openAiMessages,
                temperature: 0.7
            })
        });

        const data = await response.json();

        // 4. 异常处理
        if (data.error) {
            console.error("API Error:", data.error);
            return res.status(500).json({ answer: `Key或地址配置有误: ${data.error.message}` });
        }

        // 5. 提取 AI 的回答内容
        const aiResponse = data.choices[0].message.content;
        res.status(200).json({ answer: aiResponse });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ answer: "无法连接到 hiapi.online 服务器，请检查网络或稍后再试。" });
    }
}
