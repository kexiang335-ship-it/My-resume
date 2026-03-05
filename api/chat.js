import { createClient } from '@vercel/kv';

export default async function handler(req, res) {
    // 1. 设置跨域头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // --- 配置区 ---
    const WORK_NAME = "trade_agent"; // 作品名称
    const WORK_VERSION = "v1.0";    // 作品版本（修改此处可重置所有人的次数）
    const ADMIN_IPS = ["64.23.170.38", "39.144.156.43"]; // 你的白名单IP
    const kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });
    // --------------

    // 获取访问者真实 IP
    const forwarded = req.headers["x-forwarded-for"];
    const userIp = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;

    // 2. 检查是否为管理员（你）
    const isAdmin = ADMIN_IPS.includes(userIp);

    if (!isAdmin) {
        // 3. 非管理员，检查 KV 数据库
        const kvKey = `user:${userIp}:${WORK_NAME}:${WORK_VERSION}`;
        const hasUsed = await kv.get(kvKey);

        if (hasUsed) {
            return res.status(403).json({ 
                answer: "🛡️ [系统提示]：SHAO.KX 数字化报告每人限领一份（当前版本）。\n\n检测到您已体验过该作品，如需深度定制或获取完整版方案，请直接私聊 SHAO.KX 解锁无限可能。" 
            });
        }

        // 标记该 IP 已使用（存入数据库）
        await kv.set(kvKey, "true");
    }

    // 4. 执行 AI 生成逻辑 (OpenAI/HiAPI 协议)
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

        if (data.error) {
            return res.status(500).json({ answer: `服务暂时繁忙: ${data.error.message}` });
        }

        const aiResponse = data.choices[0].message.content;
        res.status(200).json({ answer: aiResponse });

    } catch (error) {
        res.status(500).json({ answer: "连接 AI 服务器超时，请稍后重试。" });
    }
}
