import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedShop = {
  id: number;
  name: string;
  slug: string;
};

type ShopRow = {
  id: number;
  name: string;
  slug: string;
};

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "shop",
  "lollyshop",
  "lolly",
  "admin",
]);

const parseHostMap = () => {
  try {
    return JSON.parse(process.env.SHOP_HOST_MAP || "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
};

const resolveSlugFromHost = (host: string | null) => {
  if (!host) return null;

  const hostname = host.split(":")[0].toLowerCase();
  const hostMap = parseHostMap();
  if (hostMap[hostname]) return hostMap[hostname];

  if (hostname.includes("localhost") || hostname === "127.0.0.1") return null;
  if (hostname.includes("luxya")) return "luxya";
  if (hostname.includes("homtek") || hostname.includes("hometek"))
    return "homtek";

  const [subdomain] = hostname.split(".");
  if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) return subdomain;

  return null;
};

const fetchShopById = async (supabase: SupabaseClient, shopId: number) => {
  const { data, error } = await supabase
    .from("shops")
    .select("id, name, slug")
    .eq("id", shopId)
    .maybeSingle();

  if (error) throw error;
  return data as ShopRow | null;
};

const fetchShopBySlug = async (supabase: SupabaseClient, slug: string) => {
  const { data, error } = await supabase
    .from("shops")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as ShopRow | null;
};

export const resolveShop = async ({
  request,
  supabase,
  fallbackShopId,
}: {
  request: Request;
  supabase: SupabaseClient;
  fallbackShopId?: number | null;
}): Promise<ResolvedShop> => {
  const url = new URL(request.url);
  const explicitShop =
    url.searchParams.get("shopId") || url.searchParams.get("shop");

  if (explicitShop && explicitShop !== "all") {
    const numericShopId = Number(explicitShop);
    const shop = Number.isInteger(numericShopId)
      ? await fetchShopById(supabase, numericShopId)
      : await fetchShopBySlug(supabase, explicitShop);

    if (shop) return shop;
  }

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.hostname;
  const slug = resolveSlugFromHost(host);
  if (slug) {
    const shop = await fetchShopBySlug(supabase, slug);
    if (shop) return shop;
  }

  if (fallbackShopId) {
    const shop = await fetchShopById(supabase, fallbackShopId);
    if (shop) return shop;
  }

  throw new Error("Boutique introuvable pour cette commande.");
};
