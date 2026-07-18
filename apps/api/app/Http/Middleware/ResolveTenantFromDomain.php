<?php

namespace App\Http\Middleware;

use App\Models\TenantDomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantFromDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $tenantDomain = TenantDomain::where('domain', $host)->with('tenant')->first();

        if (!$tenantDomain) {
            return response()->json(['message' => 'Domain not recognized'], 404);
        }

        app()->instance('current_tenant', $tenantDomain->tenant);

        return $next($request);
    }
}
