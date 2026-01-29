
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProject() {
    const { data, error } = await supabase
        .from('quotations')
        .select('sections_config')
        .eq('slug', 'barra-manicero')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        const sections = data.sections_config?.sections || [];
        console.log('Component types in barra-manicero:');
        sections.forEach(s => {
            console.log(`ID: ${s.id}, Component: ${s.component}`);
        });
    }
}

checkProject();
