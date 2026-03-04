// api/chat.js - 你的后端中转站
export default async function handler(req, res) {
    // 设置跨域，方便前端调用
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: "仅支持 POST" });

    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // 这是我们要藏在 Vercel 里的秘密

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: messages,
                generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
            })
        });

        const data = await response.json();
        const aiText = data.candidates[0].content.parts[0].text;
        res.status(200).json({ answer: aiText });
    } catch (error) {
        res.status(500).json({ error: "AI 接口连接失败，请检查 API Key 状态" });
    }
}
