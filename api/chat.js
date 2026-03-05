export default async function handler(req, res) {
    // 1. 设置跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // --- 配置区 ---
    const WORK_NAME = "trade_agent"; 
    const WORK_VERSION = "v1.0";    
    const ADMIN_IPS = ["64.23.170.38", "39.144.156.43"]; 
    
    // 从环境变量直接读取 KV 配置
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    // --------------

    // 获取访问者 IP
    const forwarded = req.headers["x-forwarded-for"];
    const userIp = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
    const isAdmin = ADMIN_IPS.includes(userIp);

    if (!isAdmin) {
        const kvKey = `user:${userIp}:${WORK_NAME}:${WORK_VERSION}`;
        
        try {
            // 使用 REST API 检查次数（免插件写法）
            const checkRes = await fetch(`${kvUrl}/get/${kvKey}`, {
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            const { result: hasUsed } = await checkRes.json();

            if (hasUsed) {
                return res.status(200).json({ 
                    answer: "🛡️ [系统提示]：您的免费体验额度已用完。\n\n检测到您已生成过该版本的报告。如需继续使用或获取 2026 完整版方案，请私聊 SHAO.KX。" 
                });
            }

            // 标记已使用
            await fetch(`${kvUrl}/set/${kvKey}/true`, {
                headers: { Authorization: `Bearer ${kvToken}` }
            });
        } catch (kvError) {
            console.error("KV Error:", kvError);
            // 如果数据库坏了，为了不影响你使用，我们选择放行
        }
    }

    // 2. AI 生成逻辑
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; 
    const BASE_URL = "https://hiapi.online/v1/chat/completions"; 

    try {
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
                model: "gpt-4o-mini",
                messages: openAiMessages,
                temperature: 0.7
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        res.status(200).json({ answer: data.choices[0].message.content });

    } catch (error) {
        res.status(500).json({ answer: `AI 服务调用失败: ${error.message}` });
    }
}
