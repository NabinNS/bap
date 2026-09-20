<?php

namespace App\Http\Requests\AccCustomers;

use App\Domain\AccCustomers\DTOs\AccCustomerData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAccCustomerRequest extends FormRequest
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

    public function toDTO(): AccCustomerData
    {
        $v = $this->validated();

        return new AccCustomerData(
            name:      $v['name'],
            address:   $v['address'] ?? null,
            phone:     $v['phone'] ?? null,
            telephone: $v['telephone'] ?? null,
            vatNo:     $v['vat_no'] ?? null,
        );
    }
}
