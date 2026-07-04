const https = require('https');

const projectRef = 'rkyasmeuiswgjsgmrupk';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const lines = [
  'CREATE OR REPLACE FUNCTION public.handle_new_user()',
  'RETURNS trigger',
  'LANGUAGE plpgsql',
  'SECURITY DEFINER',
  'SET search_path = public',
  'AS $func$',
  'DECLARE',
  '  user_name text;',
  'BEGIN',
  '  user_name := COALESCE(',
  "    NULLIF(TRIM(new.raw_user_meta_data->>\'name\'), \'\'),",
  "    NULLIF(TRIM(new.raw_user_meta_data->>\'full_name\'), \'\'),",
  "    \'Novo usuario ELUS\'",
  '  );',
  '  INSERT INTO public.users (id, email)',
  '  VALUES (new.id, new.email)',
  '  ON CONFLICT (id) DO NOTHING;',
  '  INSERT INTO public.profiles (id, name)',
  '  VALUES (new.id, user_name)',
  '  ON CONFLICT (id) DO NOTHING;',
  '  INSERT INTO public.verifications (user_id, status, is_current)',
  "  VALUES (new.id, \'unverified\', true)",
  '  ON CONFLICT DO NOTHING;',
  '  RETURN new;',
  'EXCEPTION',
  '  WHEN others THEN',
  "    RAISE LOG \'ELUS trigger error: %\', SQLERRM;",
  '    RETURN new;',
  'END;',
  '$func$;'
];

const sql = lines.join('\n');

const body = JSON.stringify({ query: sql });

const options = {
  hostname: projectRef + '.supabase.co',
  path: '/pg/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': 'Bearer ' + serviceKey,
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => { console.error('Erro:', e.message); });
req.write(body);
req.end();
