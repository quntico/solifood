const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("Finding duplicates for slug 'master-plan'...");
    const { data, error } = await supabase
        .from('quotations')
        .select('id, slug, updated_at')
        .eq('slug', 'master-plan')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data.length <= 1) {
        console.log("No duplicates found for 'master-plan'. Total: " + data.length);
        return;
    }

    console.log(`Found ${data.length} records. Keeping the most recent one (ID: ${data[0].id}).`);

    const toDelete = data.slice(1).map(q => q.id);
    for (const id of toDelete) {
        console.log(`Deleting duplicate ID: ${id}...`);
        const { error: delError } = await supabase.from('quotations').delete().eq('id', id);
        if (delError) console.error(`Failed to delete ${id}:`, delError);
        else console.log(`Deleted ${id}`);
    }

    console.log("Cleanup complete.");
}

run();
