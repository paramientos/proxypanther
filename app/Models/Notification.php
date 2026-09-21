<?php

namespace App\Models;

use App\Events\NotificationSent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'body',
        'icon', 'color', 'link', 'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public static function send(int $userId, string $type, string $title, array $options = []): self
    {
        $notification = static::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $options['body'] ?? null,
            'icon' => $options['icon'] ?? 'bell',
            'color' => $options['color'] ?? 'blue',
            'link' => $options['link'] ?? null,
        ]);

        broadcast(new NotificationSent($notification))->toOthers();

        return $notification;
    }
}
