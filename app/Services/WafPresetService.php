<?php

namespace App\Services;

class WafPresetService
{
    public function getPresets(): array
    {
        return [
            'wordpress' => [
                'name' => 'WordPress Hardening',
                'description' => 'Shields XML-RPC, wp-config, wp-login, and prevents PHP execution in uploads.',
                'icon' => 'ShieldCheck',
                'rules' => [
                    ['type' => 'path', 'pattern' => '(?i)(wp-config|xmlrpc|wp-login)\.php', 'action' => 'block'],
                    ['type' => 'path', 'pattern' => '(?i)/wp-content/uploads/.*\.php', 'action' => 'block'],
                    ['type' => 'path', 'pattern' => '(?i)/wp-includes/.*\.php', 'action' => 'block'],
                    ['type' => 'query', 'pattern' => '(?i)(author|id)=', 'action' => 'block'],
                ],
            ],
            'laravel' => [
                'name' => 'Laravel Fortress',
                'description' => 'Blocks access to .env, logs, composer files, and Ignition debug endpoints.',
                'icon' => 'ShieldAlert',
                'rules' => [
                    ['type' => 'path', 'pattern' => '(?i)\.env', 'action' => 'block'],
                    ['type' => 'path', 'pattern' => '(?i)(storage/logs|composer\.json|package\.json)', 'action' => 'block'],
                    ['type' => 'path', 'pattern' => '(?i)_ignition/.*', 'action' => 'block'],
                    ['type' => 'path', 'pattern' => '(?i)/vendor/.*', 'action' => 'block'],
                ],
            ],
            'api' => [
                'name' => 'API Shield',
                'description' => 'Strict protection against common SQLi and cross-site scripting in headers/query.',
                'icon' => 'Terminal',
                'rules' => [
                    ['type' => 'header', 'header_name' => 'User-Agent', 'pattern' => '(?i)(sqlmap|nikto|nmap|zgrab)', 'action' => 'block'],
                    ['type' => 'query', 'pattern' => '(?i)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR\s+1=1)', 'action' => 'block'],
                    ['type' => 'query', 'pattern' => '<script.*?>|javascript:', 'action' => 'block'],
                ],
            ],
        ];
    }
}
