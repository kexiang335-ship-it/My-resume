<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>作品集仓库 | SHAO.KX Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background: #000; color: #d4af37; margin: 0; -webkit-tap-highlight-color: transparent; }
        .gold-text { background: linear-gradient(135deg, #fff3ad 0%, #d4af37 50%, #8a6d3b 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass-card { background: rgba(15, 15, 15, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(212, 175, 55, 0.15); transition: all 0.4s ease; height: 100%; display: flex; flex-direction: column; }
        #admin-btn { z-index: 99999 !important; }
        #admin-modal { z-index: 100000 !important; }
    </style>
</head>
<body class="bg-black min-h-screen pb-20">

    <button id="admin-btn" onclick="document.getElementById('admin-modal').classList.remove('hidden')" 
        class="hidden fixed top-5 right-5 bg-[#d4af37] text-black text-[11px] font-black px-5 py-2.5 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.5)] active:scale-90 transition-all uppercase">
        ⚡ 发码控制台
    </button>

    <div id="admin-modal" class="hidden fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
        <div class="bg-[#111] border-2 border-[#d4af37] p-8 rounded-3xl w-full max-w-[340px] text-center shadow-[0_0_50px_rgba(212,175,55,0.2)]">
            <h2 class="text-xl font-black text-white mb-2 italic">MASTER ADMIN</h2>
            <p id="ip-indicator" class="text-[9px] text-slate-600 mb-6 uppercase tracking-widest">CHECKING PERMISSION...</p>
            <div class="bg-black border border-white/10 rounded-xl py-5 mb-6">
                <span id="new-code-display" class="text-4xl font-mono font-bold tracking-[0.2em] text-[#d4af37]">------</span>
            </div>
            <button onclick="generateCode()" class="w-full bg-[#d4af37] text-black font-black py-4 rounded-xl hover:bg-white active:bg-slate-200 transition-all mb-4 uppercase text-sm">点击生成新码</button>
            <button onclick="document.getElementById('admin-modal').classList.add('hidden')" class="text-xs text-slate-500 underline">关闭退出</button>
        </div>
    </div>

    <nav class="p-8">
        <a href="index.html" class="border border-[#d4af37]/30 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#d4af37] hover:text-black transition-all">← Back to Home</a>
    </nav>

    <header class="text-center py-16">
        <h1 onclick="secretTrigger()" class="text-5xl font-black gold-text italic uppercase tracking-tighter cursor-default select-none">作品集仓库</h1>
        <p class="text-slate-500 text-sm mt-4 tracking-[0.3em] uppercase">Full Project Repository</p>
    </header>

    <main class="max-w-6xl mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div class="glass-card rounded-3xl overflow-hidden">
            <div class="h-48 bg-gradient-to-br from-[#d4af37]/10 to-black flex items-center justify-center text-4xl">🌍</div>
            <div class="p-8 flex-1 flex flex-col">
                <h3 class="text-xl font-bold text-white mb-2">AI 外贸谈判与报价系统</h3>
                <p class="text-xs text-slate-400 mb-6 leading-relaxed">利用大语言模型模拟全球市场商务谈判逻辑，自动生成多币种报价单。</p>
                <div class="mt-auto">
                    <a href="aitrading.html" class="inline-block w-full text-center py-3 bg-[#d4af37]/10 border border-[#d4af37]/50 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#d4af37] hover:text-black transition-all">立即进入体验项目</a>
                </div>
            </div>
        </div>
        </main>

    <script>
        // 自动检查老板身份
        async function checkBoss() {
            try {
                const res = await fetch('/api/admin');
                const data = await res.json();
                if (data.isAdmin) {
                    document.getElementById('admin-btn').classList.remove('hidden');
                    document.getElementById('ip-indicator').innerText = "IDENTIFIED: BOSS";
                } else {
                    console.log("Current IP:", data.debugIp);
                }
            } catch (err) {}
        }

        // 备用触发器：连点标题 5 下
        let count = 0;
        function secretTrigger() {
            count++;
            if(count >= 5) {
                document.getElementById('admin-btn').classList.remove('hidden');
                alert("Boss Mode Forced On");
                count = 0;
            }
        }

        async function generateCode() {
            const btn = document.querySelector('#admin-modal button');
            const display = document.getElementById('new-code-display');
            display.innerText = "WAIT...";
            btn.disabled = true;

            try {
                const res = await fetch('/api/admin', { method: 'POST' });
                const data = await res.json();
                if (data.code) {
                    display.innerText = data.code;
                } else {
                    display.innerText = "DENIED";
                    alert("权限拒绝：你的IP可能已变动");
                }
            } catch (err) {
                display.innerText = "ERROR";
            } finally {
                btn.disabled = false;
            }
        }
        window.onload = checkBoss;
    </script>
</body>
</html>
