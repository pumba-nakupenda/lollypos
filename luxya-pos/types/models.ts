export interface Product {
    id: number
    name: string
    category: string | null
    brand: string | null
    price: number
    cost_price: number
    promo_price: number | null
    stock: number
    image: string | null
    gallery: string[] | null
    video_url: string | null
    type: 'product' | 'service'
    description: string | null
    shop_id: number
    show_on_pos: boolean
    barcode: string | null
    expiry_date: string | null
    variants: Variant[] | null
    created_at: string
    updated_at: string
}

export interface Variant {
    color: string
    size: string
    stock: string
    price: number | null
    image: string | null
}

export interface Customer {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    ninea: string | null
    rc: string | null
    shop_id: number
    lead_status: string | null
    lead_source: string | null
    next_follow_up: string | null
    notes: string | null
    created_at: string
}

export interface Sale {
    id: string
    customer_name: string | null
    customer_id: string | null
    total_amount: number
    payment_method: string
    type: string
    status: string
    shop_id: number
    invoice_number: string | null
    with_tva: boolean
    paid_amount: number
    created_by: string | null
    created_at: string
    profiles?: { email: string }
}

export interface DebtItem {
    product_id: number
    name: string
    quantity: number
    price: number
}

export interface Debt {
    id: string
    customer_id: string | null
    customer_name?: string | null
    creditor_name: string | null
    total_amount: number
    paid_amount: number
    remaining_amount: number
    type: 'receivable' | 'debt'
    status: string
    due_date: string | null
    items: DebtItem[] | null
    description: string | null
    shop_id: number
    created_at: string
    customers?: { name: string; phone: string | null }
}

export interface DebtPayment {
    id: string
    debt_id: string
    amount: number
    payment_method: string
    created_at: string
}

export interface Supplier {
    id: string
    name: string
    contact_name: string | null
    phone: string | null
    email: string | null
    address: string | null
    category: string | null
    notes: string | null
    shop_id: number
    created_at: string
}

export interface Expense {
    id: string
    description: string
    amount: number
    date: string
    category_id: number | null
    shop_id: number
    is_personal: boolean
    frequency: string | null
    created_by: string | null
    created_at: string
}

export interface CashSession {
    id: string
    shop_id: number
    status: 'open' | 'closed'
    opening_balance: number
    closing_balance_actual: number | null
    closing_balance_theoretical: number | null
    opened_at: string
    closed_at: string | null
}

export interface CashMovement {
    id: string
    session_id: string
    shop_id: number
    type: 'income' | 'outcome' | 'deposit' | 'withdrawal'
    amount: number
    description: string
    source: string | null
    payment_method: string | null
    created_at: string
}
