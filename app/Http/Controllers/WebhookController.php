<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Deployment;
use App\Jobs\DeployProjectJob;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    public function handle(Request $request, $token)
    {
        $project = Project::where('webhook_token', $token)->firstOrFail();

        $deployment = Deployment::create([
            'project_id' => $project->id,
            'status' => 'pending',
            'version' => $request->input('push_data.tag') ?? $request->input('ref') ?? 'latest',
        ]);

        DeployProjectJob::dispatch($deployment);

        return response()->json(['message' => 'Deployment triggered', 'deployment_id' => $deployment->id]);
    }
}
