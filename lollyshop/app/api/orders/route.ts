import { resolveShop } from "@/lib/resolve-shop";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  name?: string;
};

const getCartShopId = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: OrderItem[],
) => {
  const productIds = [
    ...new Set(items.map((item) => Number(item.id)).filter(Number.isInteger)),
  ];
  if (productIds.length !== items.length) {
    throw new Error("Panier invalide : produit manquant.");
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id, shop_id")
    .in("id", productIds);

  if (error) throw error;

  const shopIds = [
    ...new Set(
      (products || [])
        .map((product) => Number(product.shop_id))
        .filter((shopId) => Number.isInteger(shopId) && shopId > 0),
    ),
  ];

  if (shopIds.length !== 1) {
    throw new Error(
      "Une commande doit contenir les produits d’une seule boutique.",
    );
  }

  return shopIds[0];
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { items, total_amount, shipping_cost, shipping_method, coupon_id } =
      body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Panier vide." }, { status: 400 });
    }

    const cartShopId = await getCartShopId(supabase, items);
    const shop = await resolveShop({
      request: req,
      supabase,
      fallbackShopId: cartShopId,
    });

    if (shop.id !== cartShopId) {
      return NextResponse.json(
        {
          error:
            "Les produits du panier ne correspondent pas à la boutique demandée.",
        },
        { status: 400 },
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          customer_id: user?.id || null,
          total_amount,
          shipping_cost,
          shipping_method,
          coupon_id,
          shop_id: shop.id,
          status: "pending",
          payment_method: "cash",
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    const saleItems = items.map((item: OrderItem) => ({
      sale_id: sale.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
      description: item.name,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (itemsError) throw itemsError;

    if (coupon_id) {
      await supabase.rpc("increment_coupon_usage", { coupon_uuid: coupon_id });
    }

    return NextResponse.json({ success: true, order_id: sale.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Order creation error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
