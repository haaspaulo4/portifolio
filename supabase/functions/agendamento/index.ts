import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://egioyhrdbmhvmblgwvpi.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY env is not configured.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const formData = await req.json()

    // Validate incoming data
    if (!formData.nome || !formData.email) {
      return new Response(JSON.stringify({ error: 'Nome e Email são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert into 'bookings' table
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          servico: formData.servico,
          data: formData.data,
          horario: formData.horario,
          mensagem: formData.mensagem,
          status: 'pending'
        }
      ])
      .select()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
