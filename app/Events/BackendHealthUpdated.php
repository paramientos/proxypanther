<?php

namespace App\Events;

use App\Models\ProxySite;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BackendHealthUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ProxySite $site) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('health-checks'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->site->id,
            'is_online' => $this->site->is_online,
            'last_check_at' => $this->site->last_check_at,
            'last_error' => $this->site->last_error,
        ];
    }
}
