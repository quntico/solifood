const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("Repairing corrupted sections_config...");
    const { data, error } = await supabase
        .from('quotations')
        .select('id, slug, theme_key, sections_config');

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    for (const q of data) {
        const isArray = Array.isArray(q.sections_config);
        const isObject = q.sections_config && typeof q.sections_config === 'object';

        // CORRUPTION CHECK: 
        // If it's an object but NOT an array, AND it's not the master plan slug
        // AND it contains the error keys I introduced
        if (isObject && !isArray && q.slug !== 'master-plan' && q.sections_config.heroVideoUrl) {
            console.log(`Repairing corrupted record: Slug: ${q.slug} | Theme: ${q.theme_key}`);

            // Setting to null so it falls back to defaultSections in QuotationViewer
            const { error: updateError } = await supabase
                .from('quotations')
                .update({ sections_config: null })
                .eq('id', q.id);

            if (updateError) console.error(`Failed to repair ID ${q.id}:`, updateError);
            else console.log(`Successfully repaired ID ${q.id}`);
        }
    }
}

run();
