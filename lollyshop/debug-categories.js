
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

async function debugCategories() {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += msg + "\n";
    };

    log("Checking product count...");

    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .neq('show_on_website', false);

    if (countError) {
        log("Error counting products: " + JSON.stringify(countError));
        fs.writeFileSync('debug-result.txt', output);
        return;
    }

    log(`Total products (show_on_website != false): ${count}`);

    log("Fetching categories with default query...");
    const { data, error } = await supabase
        .from('products')
        .select('category')
        .neq('show_on_website', false); // No explicit limit, so default applies

    if (error) {
        log("Error fetching products: " + JSON.stringify(error));
        fs.writeFileSync('debug-result.txt', output);
        return;
    }

    log(`Fetched ${data?.length} rows.`);
    const categories = Array.from(new Set(data?.map((p) => p.category).filter(Boolean) || [])).sort();
    log(`Found ${categories.length} unique categories: ${categories.join(', ')}`);

    if (data?.length === 1000) {
        log("WARNING: Fetched exactly 1000 rows. Likely hitting default limit!");
    }

    fs.writeFileSync('debug-result.txt', output);
}

debugCategories();
