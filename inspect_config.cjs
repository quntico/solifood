const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("Inspecting sections_config structure...");
    const { data, error } = await supabase
        .from('quotations')
        .select('id, slug, theme_key, sections_config, updated_at')
        .order('updated_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    data.forEach(q => {
        const isArray = Array.isArray(q.sections_config);
        const type = typeof q.sections_config;
        const keys = q.sections_config && type === 'object' && !isArray ? Object.keys(q.sections_config) : 'N/A';

        console.log(`- Slug: ${q.slug || 'N/A'} | Theme: ${q.theme_key} | IsArray: ${isArray} | Type: ${type} | Keys: ${JSON.stringify(keys)}`);
    });
}

run();
