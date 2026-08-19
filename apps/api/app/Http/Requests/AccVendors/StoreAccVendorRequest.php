<?php

namespace App\Http\Requests\AccVendors;

use App\Domain\AccVendors\DTOs\AccVendorData;
use Illuminate\Foundation\Http\FormRequest;

class StoreAccVendorRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'address'   => ['nullable', 'string', 'max:500'],
            'phone'     => ['nullable', 'string', 'max:20'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'vat_no'    => ['nullable', 'string', 'max:50'],
        ];
    }

    public function toDTO(): AccVendorData
    {
        $v = $this->validated();

        return new AccVendorData(
            name:      $v['name'],
            address:   $v['address'] ?? null,
            phone:     $v['phone'] ?? null,
            telephone: $v['telephone'] ?? null,
            vatNo:     $v['vat_no'] ?? null,
        );
    }
}
