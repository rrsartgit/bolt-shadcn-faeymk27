import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OSRM_API = 'https://router.project-osrm.org/route/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { start, end } = await req.json();
    
    const response = await fetch(
      `${OSRM_API}/bike/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    );
    
    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});