<?php

namespace App\Http\Controllers\Api;

use App\Application\Auth\IssueTokensService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function __construct(
        private IssueTokensService $issueTokensService,
    ) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return $this->issueTokensService->issue($user);
    }

    public function refresh(Request $request): JsonResponse
    {
        $rawRefreshToken = $request->cookie($this->issueTokensService->cookieName());

        if (! $rawRefreshToken) {
            return ApiResponse::unauthorized('Refresh token missing.');
        }

        [$id, $plain] = explode('|', $rawRefreshToken, 2) + [null, null];

        $tokenRecord = PersonalAccessToken::find($id);

        if (
            ! $tokenRecord
            || $tokenRecord->name !== 'refresh_token'
            || ! hash_equals($tokenRecord->token, hash('sha256', $plain))
            || ($tokenRecord->expires_at && $tokenRecord->expires_at->isPast())
        ) {
            return ApiResponse::unauthorized('Invalid or expired refresh token.');
        }

        $user = $tokenRecord->tokenable;

        $tokenRecord->delete();

        return $this->issueTokensService->issue($user);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'ulid'  => $user->ulid,
            'name'  => $user->name,
            'email' => $user->email,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        $rawRefreshToken = $request->cookie($this->issueTokensService->cookieName());
        if ($rawRefreshToken) {
            [$id] = explode('|', $rawRefreshToken, 2) + [null, null];
            PersonalAccessToken::find($id)?->delete();
        }

        return response()->json(['message' => 'Logged out successfully.'])
            ->withCookie(cookie()->forget($this->issueTokensService->cookieName()));
    }
}
