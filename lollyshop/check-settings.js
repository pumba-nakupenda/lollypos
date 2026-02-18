
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    const { data, error } = await supabase
        .from('site_settings')
        .select('content')
        .eq('name', 'lolly_shop_config')
        .single();

    if (error) {
        // console.error('Error fetching settings:', error); // Ignore error if not found
        console.log('No settings found or error.');
        return;
    }

    console.log(JSON.stringify(data?.content, null, 2));
}

checkSettings();
