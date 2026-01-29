
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProject() {
    const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('slug', 'barra-manicero')
        .single();

    if (error) {
        console.error('Error fetching barra-manicero:', error);
    } else {
        console.log('Project Data (barra-manicero):');
        const sections = data.sections_config?.sections || [];
        const fichaSection = sections.find(s => s.id === 'ficha');
        console.log('Ficha Section Content:');
        console.log(JSON.stringify(fichaSection?.content, null, 2));
    }

    const { data: mpData, error: mpError } = await supabase
        .from('quotations')
        .select('*')
        .eq('slug', 'mp-barra-manicero')
        .single();

    if (mpError) {
        console.log('No mp-barra-manicero found.');
    } else {
        console.log('Master Plan Data (mp-barra-manicero):');
        console.log(JSON.stringify(mpData, null, 2));
    }
}

checkProject();
