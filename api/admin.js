export default async function handler(req, res) {
    // 你的白名单 IP
    const ADMIN_IPS = ["64.23.170.38", "39.144.156.43"]; 
    const forwarded = req.headers["x-forwarded-for"];
    const userIp = forwarded ? forwarded.split(/, /)[0] : req.socket.remoteAddress;
    
    const isAdmin = ADMIN_IPS.includes(userIp);

    if (req.method === 'GET') {
        return res.status(200).json({ isAdmin });
    }

    if (req.method === 'POST') {
        if (!isAdmin) return res.status(403).json({ error: "Access Denied" });

        const kvUrl = process.env.KV_REST_API_URL;
        const kvToken = process.env.KV_REST_API_TOKEN;
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            await fetch(`${kvUrl}/set/code:${code}/3`, { 
                headers: { Authorization: `Bearer ${kvToken}` }
            });
            return res.status(200).json({ code: code });
        } catch(e) {
            return res.status(500).json({ error: "KV Error" });
        }
    }
}
