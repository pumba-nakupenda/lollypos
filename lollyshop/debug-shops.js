
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCategoriesPerShop() {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += msg + "\n";
    };

    log("Fetching ALL products to group by Shop...");
    const { data, error } = await supabase
        .from('products')
        .select('category, shop_id')
        .neq('show_on_website', false);

    if (error) {
        log("Error fetching products: " + JSON.stringify(error));
        fs.writeFileSync('debug-shops.txt', output);
        return;
    }

    const shop1Cats = new Set();
    const shop2Cats = new Set();
    const allCats = new Set();

    data.forEach(p => {
        if (p.category) {
            allCats.add(p.category);
            if (p.shop_id === 1) shop1Cats.add(p.category);
            if (p.shop_id === 2) shop2Cats.add(p.category);
        }
    });

    log(`Total Unique Categories: ${allCats.size}`);
    log(`Shop 1 (Luxya) Categories (${shop1Cats.size}): ${Array.from(shop1Cats).sort().join(', ')}`);
    log(`Shop 2 (Homtek) Categories (${shop2Cats.size}): ${Array.from(shop2Cats).sort().join(', ')}`);

    fs.writeFileSync('debug-shops.txt', output);
}

debugCategoriesPerShop();
