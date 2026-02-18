
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

    log("Checking for 'categories' table...");
    const { data: catTable, error: catTableError } = await supabase.from('categories').select('*').limit(5);
    if (catTableError) {
        log("Reference to 'categories' table failed (expected if it doesn't exist): " + catTableError.message);
    } else {
        log(`Found 'categories' table! ${catTable.length} rows fetched.`);
        log("Sample: " + JSON.stringify(catTable));
    }

    log("\nChecking HIDDEN products (show_on_website = false)...");

    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('show_on_website', false);

    if (countError) {
        log("Error counting hidden products: " + JSON.stringify(countError));
    } else {
        log(`Total HIDDEN products: ${count}`);
    }

    log("Fetching ALL categories (including hidden)...");
    const { data, error } = await supabase
        .from('products')
        .select('category');

    if (error) {
        log("Error fetching products: " + JSON.stringify(error));
        fs.writeFileSync('debug-result-2.txt', output);
        return;
    }

    log(`Fetched ${data?.length} rows (ALL products).`);
    const allCategories = Array.from(new Set(data?.map((p) => p.category).filter(Boolean) || [])).sort();
    log(`Found ${allCategories.length} unique categories across ALL products.`);
    log(allCategories.join(', '));

    fs.writeFileSync('debug-result-2.txt', output);
}

debugCategories();
