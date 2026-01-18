const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("Reading exact record for 'master-plan'...");
    const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('slug', 'master-plan')
        .single();

    if (error) {
        console.error("Error/Empty:", error.message);
        return;
    }

    console.log(JSON.stringify(data, null, 2));
}

run();
