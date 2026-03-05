export default async function handler(req, res) {
    const ADMIN_IPS = ["64.23.170.38", "39.144.156.43"]; // 你的白名单
    const forwarded = req.headers["x-forwarded-for"];
    const userIp = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
    
    // 检查是不是老板的 IP
    const isAdmin = ADMIN_IPS.includes(userIp);

    // 网页加载时调用的接口，告诉前端要不要显示右上角的按钮
    if (req.method === 'GET') {
        return res.status(200).json({ isAdmin });
    }

    // 点击“生成新码”时调用的接口
    if (req.method === 'POST') {
        if (!isAdmin) {
            return res.status(403).json({ error: "非法入侵：无权生成体验码" });
        }

        const kvUrl = process.env.KV_REST_API_URL;
        const kvToken = process.env.KV_REST_API_TOKEN;
        
        // 随机生成 6 位数
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            // 存入数据库，赋予 3 次权限
            await fetch(`${kvUrl}/set/code:${code}/3`, { 
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            return res.status(200).json({ code: code });
        } catch(e) {
            return res.status(500).json({ error: "发码失败" });
        }
    }
}
