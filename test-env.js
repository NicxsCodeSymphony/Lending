console.log('Environment Variables Check:');
console.log('==========================');

const envVars = [
  'NODE_ENV',
  'VERCEL',
  'USE_SUPABASE',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? 'SET' : 'NOT SET'}`);
  if (value && varName.includes('KEY')) {
    console.log(`  Value: ${value.substring(0, 10)}...`);
  } else if (value) {
    console.log(`  Value: ${value}`);
  }
});

console.log('\nSupabase Configuration:');
console.log('=======================');

const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.VERCEL === '1' || 
                    process.env.USE_SUPABASE === 'true';

console.log(`isProduction: ${isProduction}`);
console.log(`hasSupabaseUrl: ${!!process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`hasSupabaseKey: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);

if (isProduction && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.log('\n❌ ERROR: Supabase environment variables are missing!');
  console.log('You need to create a .env.local file with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
} else if (isProduction) {
  console.log('\n✅ Supabase environment variables are configured');
} else {
  console.log('\nℹ️ Running in development mode (SQLite)');
}