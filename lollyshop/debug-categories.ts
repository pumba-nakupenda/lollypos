
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCategories() {
    console.log("Checking product count...");

    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .neq('show_on_website', false);

    if (countError) {
        console.error("Error counting products:", countError);
        return;
    }

    console.log(`Total products (show_on_website != false): ${count}`);

    console.log("Fetching categories with default query...");
    const { data, error } = await supabase
        .from('products')
        .select('category')
        .neq('show_on_website', false);

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Fetched ${data?.length} rows.`);
    const categories = Array.from(new Set(data?.map((p: any) => p.category).filter(Boolean) || [])).sort();
    console.log(`Found ${categories.length} unique categories:`, categories);

    if (data?.length === 1000) { // Supabase default limit
        console.warn("WARNING: Fetched exactly 1000 rows. Likely hitting default limit!");
    }
}

debugCategories();
