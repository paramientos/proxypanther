<?php

namespace App\Services;

class ErrorPageService
{
    public function getTemplates(): array
    {
        return [
            'minimal_dark' => [
                'name' => 'Minimal Deep Dark',
                'html' => "<body style='background:#050508;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;'><div style='text-align:center;border:1px solid rgba(255,255,255,0.1);padding:3rem;border-radius:2rem;background:rgba(255,255,255,0.02);backdrop-filter:blur(10px)'><h1 style='font-size:5rem;margin:0;color:#f38020'>{{code}}</h1><p style='font-size:1.2rem;color:rgba(255,255,255,0.6)'>{{message}}</p><a href='/' style='display:inline-block;margin-top:2rem;color:#f38020;text-decoration:none;border:1px solid #f38020;padding:0.6rem 1.5rem;border-radius:0.5rem'>Return to Safety</a></div></body>",
            ],
            'panther_orange' => [
                'name' => 'ProxyPanther Signature',
                'html' => "<body style='background:radial-gradient(circle at top, #1a1a1a, #000);color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;margin:0;overflow:hidden;'><div style='position:absolute;width:100%;height:100%;background:repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(243,128,32,0.03) 1px, rgba(243,128,32,0.03) 2px);pointer-events:none;'></div><div style='text-align:center;position:relative;'><div style='width:120px;height:120px;background:rgba(243,128,32,0.1);border-radius:30px;display:flex;align-items:center;justify-content:center;margin:0 auto 2rem;'><div style='width:60px;height:60px;border:4px solid #f38020;border-radius:15px;transform:rotate(45deg);'></div></div><h1 style='font-size:4rem;font-weight:900;letter-spacing:-2px;margin:0;'>ERROR {{code}}</h1><p style='text-transform:uppercase;letter-spacing:4px;color:#f38020;font-weight:bold;'>Security Protocol Enforced</p><p style='color:rgba(255,255,255,0.5);max-width:400px;margin:1.5rem auto;'>{{message}}</p></div></body>",
            ],
            'cyber_glitch' => [
                'name' => 'Cyber Glitch',
                'html' => "<body style='background:#000;color:#0f0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:monospace;margin:0;'><div style='border:2px solid #0f0;padding:2rem;position:relative;'><div style='position:absolute;top:-10px;left:20px;background:#000;padding:0 5px;'>SEC_ALERT</div><h1 style='font-size:3rem;margin:0;'>STATUS_{{code}}</h1><p style='margin:1rem 0;'>\u003e CRITICAL_ERROR: {{message}}</p><p style='opacity:0.5;'>\u003e SOURCE: ProxyPanther_WAF_v2.0</p><div style='margin-top:2rem;animation:pulse 1s infinite;'>[ ACCESS_DENIED ]</div><style>@keyframes pulse{0%{opacity:1;}50%{opacity:0.2;}100%{opacity:1;}}</style></div></body>",
            ],
        ];
    }
}
