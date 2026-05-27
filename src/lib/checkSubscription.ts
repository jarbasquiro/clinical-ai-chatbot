import { supabase } from './supabase';

export async function checkSubscription(
  email: string
) {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', email)
    .eq('active', true)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}