export class CreateSaleDto {
    totalAmount: number;
    paymentMethod: string;
    shopId: number;
    customer_name?: string;
    with_tva?: boolean;
    type?: string;
    linked_doc_number?: string;
    items: {
        productId: number;
        quantity: number;
        price: number;
        name?: string;
    }[];
}