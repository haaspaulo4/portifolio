import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const userMessage = payload.message || payload
    const apiKey = Deno.env.get('GROQ_API_KEY')
    const modelName = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile'

    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not configured.')
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: `Você é um assistente virtual (CLI/Terminal) do Paulo.
Paulo é graduado em Gestão Comercial e especialista em Automações de Processos, Desenvolvimento Web (front/back), Infraestrutura Web e Inteligência Artificial aplicada.

Seu objetivo é:
1. Responder dúvidas sobre o trabalho do Paulo.
2. Destacar habilidades dele (Gestão Comercial + Tech/Automações + IA).
3. Ser extremamente cortês, profissional, mas manter um estilo de escrita que lembra um console/terminal hacker elegante (use formatação limpa, seções em bloco, termos tech ocasionais de forma natural).
4. Incentivar SEMPRE o usuário a clicar em "agendar_" no menu ou rolar até o formulário para agendar uma consultoria gratuita de 30 minutos.

Fale em português do Brasil (casual/profissional). Seja conciso nas respostas, sem enrolação.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API error: ${errorText}`)
    }

    const data = await response.json()
    const botReply = data.choices?.[0]?.message?.content || 'Desculpe, não consegui obter uma resposta.'

    return new Response(JSON.stringify({ response: botReply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
