import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReservationEmailRequest {
  clientName: string;
  clientEmail: string;
  reservationDate: string;
  reservationType: string;
  reservationPrice: number;
  numPeople: number;
}

const RESERVATION_LABELS: Record<string, string> = {
  entrada: 'Entrada do clube',
  piscina: 'Piscina',
  quiosque: 'Quiosque/Churrasqueira',
  cafe: 'Café da manhã',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      clientName, 
      clientEmail, 
      reservationDate, 
      reservationType, 
      reservationPrice,
      numPeople 
    }: ReservationEmailRequest = await req.json();

    console.log("Sending reservation email to:", clientEmail);

    const reservationLabel = RESERVATION_LABELS[reservationType] || reservationType;
    
    // Format date for display
    const dateObj = new Date(reservationDate + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResponse = await resend.emails.send({
      from: "Clube de Lazer Shangrilá <onboarding@resend.dev>",
      to: [clientEmail],
      subject: "✅ Reserva Confirmada - Clube de Lazer Shangrilá",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a365d 0%, #2d5aa3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏊 Clube de Lazer Shangrilá</h1>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1a365d; margin-top: 0;">Olá, ${clientName}!</h2>
            
            <p style="font-size: 16px;">Sua reserva foi <strong style="color: #16a34a;">confirmada com sucesso</strong>! 🎉</p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f97316;">
              <h3 style="color: #1a365d; margin-top: 0;">📋 Detalhes da Reserva</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">📅 Data:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">⏰ Horário:</td>
                  <td style="padding: 8px 0; font-weight: bold;">10h às 18h</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">🎫 Tipo:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${reservationLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">👥 Pessoas:</td>
                  <td style="padding: 8px 0; font-weight: bold;">${numPeople}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">💰 Valor por pessoa:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">R$ ${reservationPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #92400e; margin: 0 0 10px 0;">💳 Informações de Pagamento</h4>
              <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                <li>Pagamento realizado na chegada ao clube</li>
                <li>Crianças até 6 anos: entrada gratuita</li>
                <li>Acima de 65 anos: meia-entrada</li>
              </ul>
            </div>
            
            <div style="background: #dbeafe; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">📍 Localização</h4>
              <p style="margin: 0; color: #1e3a8a;">
                Clube de Lazer Shangrilá<br>
                <a href="https://clubedelazershangrila.com.br" style="color: #2563eb;">clubedelazershangrila.com.br</a>
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Caso precise cancelar ou alterar sua reserva, entre em contato conosco.
            </p>
          </div>
          
          <div style="background: #1a365d; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              © 2024 Clube de Lazer Shangrilá - Seu refúgio familiar
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reservation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
