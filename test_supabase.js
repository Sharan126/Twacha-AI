import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enmatxvzlmjqazbvungi.supabase.co';
const supabaseKey = 'sb_publishable_WNc8NtTtYOr7NQ6rXQhiUg_ABZfhAth';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('feedback').insert([{
    rating: 4,
    feedback_type: 'Other',
    message: 'good frontend test',
    status: 'pending'
  }]);
  console.log('Error:', JSON.stringify(error, null, 2));
}
test();
