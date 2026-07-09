<?php

namespace App\Http\Requests\Images;

use App\Domain\Images\DTOs\ImageItemData;
use Illuminate\Foundation\Http\FormRequest;

class StoreImageItemsRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'items'              => ['required', 'array', 'min:1'],
            'items.*.url'        => ['required', 'string'],
            'items.*.path'       => ['required', 'string'],
            'items.*.sort_order' => ['integer'],
        ];
    }

    /** @return ImageItemData[] */
    public function toDTOs(): array
    {
        return array_map(
            fn (array $item, int $i) => new ImageItemData(
                url:       $item['url'],
                path:      $item['path'],
                sortOrder: $item['sort_order'] ?? $i,
            ),
            $this->validated()['items'],
            array_keys($this->validated()['items']),
        );
    }
}
