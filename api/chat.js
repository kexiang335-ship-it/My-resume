export default async function handler(req, res) {
  // 设置跨域头，允许前端调用
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { messages } = req.body;
  
  // 从 Vercel 环境变量获取你填写的 sk- Key
  const apiKey = process.env.GEMINI_API_KEY; 
  
  // 【重要】如果你问到了中转地址，请把下面这个链接换成卖家给你的地址
  // 如果没问到，先试试这个默认的
  const BASE_URL = "https://api.openai.com/v1/chat/completions";

  if (!apiKey || !apiKey.startsWith('sk-')) {
    return res.status(400).json({ 
      answer: "错误：检测到 API Key 缺失或格式不是 OpenAI 的 sk- 开头。请检查 Vercel 环境变量。" 
    });
  }

  try {
    // 将前端传来的数据格式转换为 OpenAI 标准格式
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
        model: "gpt-3.5-turbo", // 或者问卖家这个 Key 支持什么模型（如 gpt-4）
        messages: openAiMessages,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI 中转报错:", data.error);
      return res.status(500).json({ answer: `中转服务器返回错误: ${data.error.message}` });
    }

    // 提取 OpenAI 的回复内容
    const aiResponse = data.choices[0].message.content;
    res.status(200).json({ answer: aiResponse });

  } catch (error) {
    console.error("请求异常:", error);
    res.status(500).json({ answer: "无法连接到 OpenAI 中转服务器，请检查 Base URL 是否正确。" });
  }
}
