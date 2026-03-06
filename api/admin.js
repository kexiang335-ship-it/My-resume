export default async function handler(req, res) {
    // 【重要】将下面的字符串替换为你在网页上获取到的老板专属 Device ID
    // 你可以放多个设备的 ID（比如手机和电脑分别获取一个填进去）
    const ADMIN_DEVICES = [
        "DEV-123456-abcdefgh", // 示例：你的电脑设备ID
        "DEV-654321-hgfedcba"  // 示例：你的手机设备ID
    ]; 
    
    // 从请求头获取客户端传来的设备指纹 ID
    const deviceId = req.headers["x-device-id"];
    
    // 检查这个设备 ID 是不是老板的
    const isAdmin = ADMIN_DEVICES.includes(deviceId);

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
