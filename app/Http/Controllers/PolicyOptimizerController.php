<?php

namespace App\Http\Controllers;

use App\Services\PolicyOptimizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PolicyOptimizerController extends Controller
{
    public function __construct(private PolicyOptimizerService $optimizer) {}

    public function analyze(): JsonResponse
    {
        return response()->json($this->optimizer->analyze());
    }

    public function apply(Request $request): JsonResponse
    {
        $request->validate([
            'actions' => 'required|array|min:1',
            'actions.*.type' => 'required|string',
            'actions.*.payload' => 'required|array',
        ]);

        $applied = $this->optimizer->apply($request->actions);

        return response()->json([
            'applied' => $applied,
            'count' => count($applied),
        ]);
    }
}
