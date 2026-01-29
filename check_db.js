
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://harjjlcobmldbofmyvpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcmpqbGNvYm1sZGJvZm15dnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MzQzNDMsImV4cCI6MjA4MzQxMDM0M30.voT_0DjRRdLklBRh17exKrbsyUUB1Na4yq5EX4s1nhI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProject() {
    const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('slug', 'master-plan')
        .single();

    if (error) {
        console.error('Error fetching barra-manicero:', error);
    } else {
        console.log('Project Data (barra-manicero):');
        console.log('Project:', data.project);
        console.log('Client:', data.client);
        console.log('Sections Config Meta:', {
            clientName: data.sections_config?.clientName,
            projectName: data.sections_config?.projectName
        });
    }
}

checkProject();
