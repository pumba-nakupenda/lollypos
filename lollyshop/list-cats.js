
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve('.env.local');
let supabaseUrl, supabaseKey;

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const getEnv = (key) => {
        const match = envContent.match(new RegExp(`${key}=(.*)`));
        return match ? match[1].trim() : null;
    };
    supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
    supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
} catch (e) {
    console.error('Could not read .env.local', e);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCategories() {
    const { data, error } = await supabase
        .from('products')
        .select('category')
        .neq('show_on_website', false);

    if (error) {
        console.error('Error fetching categories:', error);
        return;
    }

    const categories = [...new Set(data.map(p => p.category).filter(Boolean))].sort();
    console.log(JSON.stringify(categories, null, 2));
}

listCategories();
