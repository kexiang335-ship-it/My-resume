export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const WORK_NAME = "trade_agent"; 
    const WORK_VERSION = "v1.0";    
    const ADMIN_IPS = ["64.23.170.38", "39.144.156.43"]; 
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    const { messages, code } = req.body; 
    const forwarded = req.headers["x-forwarded-for"];
    const userIp = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;

    let isAuthorized = false;

    // 1. 如果是你本人操作，直接放行
    if (ADMIN_IPS.includes(userIp)) {
        isAuthorized = true; 
    } 
    // 2. 如果填了体验码，走体验码核销逻辑
    else if (code && code.length === 6) {
        try {
            const codeKey = `code:${code}`;
            const checkCodeRes = await fetch(`${kvUrl}/get/${codeKey}`, { headers: { Authorization: `Bearer ${kvToken}` }});
            const codeData = await checkCodeRes.json();
            let remainingUses = codeData.result ? parseInt(codeData.result) : 0;

            if (remainingUses > 0) {
                isAuthorized = true;
                // 次数减 1
                await fetch(`${kvUrl}/set/${codeKey}/${remainingUses - 1}`, { headers: { Authorization: `Bearer ${kvToken}` }});
            } else {
                return res.status(200).json({ answer: "⚠️ [系统提示]：抱歉，该体验码无效或次数已用尽。请重新核对。" });
            }
        } catch (e) {
            console.error("KV Code Error:", e);
        }
    } 
    // 3. 没填体验码，走免费 1 次的 IP 逻辑
    else {
        try {
            const kvKey = `user:${userIp}:${WORK_NAME}:${WORK_VERSION}`;
            const checkRes = await fetch(`${kvUrl}/get/${kvKey}`, { headers: { Authorization: `Bearer ${kvToken}` }});
            const { result: hasUsed } = await checkRes.json();

            if (hasUsed) {
                // 专属拦截文案 + 联系方式
                return res.status(200).json({ 
                    answer: "🛡️ [系统提示]：您的免费体验额度已用完。\n\n感谢您对 SHAO.KX 数字化方案的认可。如需获取专属体验码或深度定制方案，请联系：\n\n📞 电话/微信：138-1463-2349\n📧 邮箱：2306367140@qq.com" 
                });
            }
            await fetch(`${kvUrl}/set/${kvKey}/true`, { headers: { Authorization: `Bearer ${kvToken}` }});
            isAuthorized = true;
        } catch (e) {
            console.error("KV IP Error:", e);
        }
    }

    // AI 生成逻辑
    const apiKey = process.env.GEMINI_API_KEY; 
    const BASE_URL = "https://hiapi.online/v1/chat/completions"; 

    try {
        const openAiMessages = messages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.parts[0].text
        }));

        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: openAiMessages, temperature: 0.7 })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        res.status(200).json({ answer: data.choices[0].message.content });

    } catch (error) {
        res.status(500).json({ answer: `AI 服务调用失败: ${error.message}` });
    }
}
