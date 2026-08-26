<?php

namespace App\Enums;

enum TransactionParticular: string
{
    case Purchase       = 'purchase';
    case Cash           = 'cash';
    case Cheque         = 'cheque';
    case Sales          = 'sales';
    case PurchaseNonVat = 'purchase_non_vat';
    case DebitNote      = 'debit_note';
    case CreditNote     = 'credit_note';
}
