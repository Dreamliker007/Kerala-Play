const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  console.error(`Missing production environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
if (!/^https:\/\//.test(process.env.SUPABASE_URL)) {
  console.error('SUPABASE_URL must be an https:// URL.');
  process.exit(1);
}
console.log('Kerala Play production environment looks ready.');
