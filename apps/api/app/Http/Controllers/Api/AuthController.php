<?php

namespace App\Http\Controllers\Api;

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
    private const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
    private const REFRESH_TOKEN_EXPIRY_DAYS   = 30;
    private const REFRESH_COOKIE              = 'refresh_token';

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

        return $this->issueTokens($user);
    }

    public function refresh(Request $request): JsonResponse
    {
        $rawRefreshToken = $request->cookie(self::REFRESH_COOKIE);

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

        return $this->issueTokens($user);
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

        $rawRefreshToken = $request->cookie(self::REFRESH_COOKIE);
        if ($rawRefreshToken) {
            [$id] = explode('|', $rawRefreshToken, 2) + [null, null];
            PersonalAccessToken::find($id)?->delete();
        }

        return response()->json(['message' => 'Logged out successfully.'])
            ->withCookie(cookie()->forget(self::REFRESH_COOKIE));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function issueTokens(User $user): JsonResponse
    {
        $accessToken = $user->createToken(
            'access_token',
            ['*'],
            now()->addMinutes(self::ACCESS_TOKEN_EXPIRY_MINUTES)
        )->plainTextToken;

        $refreshToken = $user->createToken(
            'refresh_token',
            ['*'],
            now()->addDays(self::REFRESH_TOKEN_EXPIRY_DAYS)
        )->plainTextToken;

        $refreshCookie = cookie(
            self::REFRESH_COOKIE,
            $refreshToken,
            self::REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60,
            '/',
            null,
            true,
            true,
            false,
            'Lax'
        );

        return response()->json([
            'access_token' => $accessToken,
            'expires_in'   => self::ACCESS_TOKEN_EXPIRY_MINUTES * 60,
            'user'         => [
                'ulid'  => $user->ulid,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ])->withCookie($refreshCookie);
    }
}
