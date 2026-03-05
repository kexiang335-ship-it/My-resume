export default async function handler(req, res) {
    // 你的双设备白名单 IP
    const ADMIN_IPS = ["64.23.170.38", "39.144.156.35"];
    
    // 获取访问者 IP
    const forwarded = req.headers["x-forwarded-for"];
    const userIp = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
    const isAdmin = ADMIN_IPS.includes(userIp);

    // 处理 GET 请求：检查身份
    if (req.method === 'GET') {
        return res.status(200).json({ 
            isAdmin, 
            debugIp: userIp,
            msg: isAdmin ? "Welcome Boss" : "Access Denied"
        });
    }

    // 处理 POST 请求：生成 6 位体验码
    if (req.method === 'POST') {
        if (!isAdmin) {
            return res.status(403).json({ error: "Unauthorized IP", yourIp: userIp });
        }

        const kvUrl = process.env.KV_REST_API_URL;
        const kvToken = process.env.KV_REST_API_TOKEN;
        
        // 随机 6 位数字
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            // 将码存入 Vercel KV，设置 3 次可用额度
            await fetch(`${kvUrl}/set/code:${newCode}/3`, {
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            return res.status(200).json({ code: newCode });
        } catch (e) {
            return res.status(500).json({ error: "Storage Error" });
        }
    }
}
