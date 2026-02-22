export class CreateSaleDto {
    totalAmount: number;
    paymentMethod: string;
    shopId: number;
    customer_name?: string;
    customer_id?: string;
    created_by?: string;
    with_tva?: boolean;
    type?: string;
    paid_amount?: number;
    parent_id?: string;
    invoice_number?: string;
    linked_doc_number?: string;
    status?: string;
    items: {
        productId: number;
        quantity: number;
        price: number;
        name?: string;
        variantId?: string;
    }[];
}