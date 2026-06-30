<?php

namespace App\Application\Auth\Actions;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class IssueTokensAction
{
    private const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
    private const REFRESH_TOKEN_EXPIRY_DAYS   = 30;
    private const REFRESH_COOKIE              = 'refresh_token';

    public function execute(User $user): JsonResponse
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

    public function cookieName(): string
    {
        return self::REFRESH_COOKIE;
    }
}
