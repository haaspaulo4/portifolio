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

    // Notifica Telegram em background (não bloqueia a resposta ao cliente).
    // Falhas aqui NÃO devem impedir o insert, que já foi commitado.
    if (data && data.length > 0) {
      try {
        const inserted = data[0]
        const notifyUrl = `${supabaseUrl}/functions/v1/notify-telegram`
        fetch(notifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            title: 'Novo agendamento',
            body: `${formData.nome} solicitou reunião`,
            fields: {
              Nome: formData.nome,
              Email: formData.email,
              Telefone: formData.telefone || '—',
              Servico: formData.servico || '—',
              Data: formData.data || '—',
              Horario: formData.horario || '—',
              Mensagem: (formData.mensagem || '—').slice(0, 200),
            },
          }),
        }).catch((e) => console.error('notify-telegram failed:', e))
      } catch (e) {
        console.error('notify dispatch error:', e)
      }
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
