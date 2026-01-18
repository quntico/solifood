const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("Checking quotations...");
    const { data, error } = await supabase
        .from('quotations')
        .select('id, slug, theme_key, video_url, updated_at')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    console.log(`Found ${data.length} records.`);
    const slugs = {};
    const toDelete = [];

    data.forEach(q => {
        if (!q.slug) return;
        if (slugs[q.slug]) {
            console.log(`Duplicate found for slug [${q.slug}]: ID ${q.id} (Existing ID: ${slugs[q.slug].id})`);
            toDelete.push(q.id);
        } else {
            slugs[q.slug] = q;
        }
    });

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} duplicate records...`);
        // We delete by ID
        for (const id of toDelete) {
            const { error: delError } = await supabase.from('quotations').delete().eq('id', id);
            if (delError) console.error(`Failed to delete ID ${id}:`, delError);
            else console.log(`Deleted ID ${id}`);
        }
    } else {
        console.log("No duplicates found.");
    }

    // Check 'master-plan' specifically
    const mp = data.find(q => q.slug === 'master-plan');
    if (mp) {
        console.log("Master Plan Record:", JSON.stringify(mp, null, 2));
    } else {
        console.log("Master Plan Record NOT FOUND for slug 'master-plan'");
    }
}

run();
