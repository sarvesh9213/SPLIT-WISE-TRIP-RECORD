import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpenseRequestData {
  recipientEmail: string;
  tripName: string;
  amount: string;
  fromUser: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, tripName, amount, fromUser }: ExpenseRequestData = await req.json();
    console.log('Received request data:', { recipientEmail, tripName, amount, fromUser });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TripSplit <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `Trip Expense Request - ${tripName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
              Trip Expense Request - ${tripName}
            </h2>
            
            <p style="font-size: 16px; color: #555;">
              Hello,
            </p>
            
            <p style="font-size: 16px; color: #555;">
              ${fromUser} has requested <strong>${amount}</strong> from you for trip <strong>${tripName}</strong>.
            </p>
            
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Payment Details:</h3>
              <p style="font-size: 18px; margin: 5px 0;"><strong>Amount Due: ${amount}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">Trip: ${tripName}</p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">Requested by: ${fromUser}</p>
            </div>
            
            <p style="font-size: 16px; color: #555;">
              Please settle this expense at your earliest convenience.
            </p>
            
            <p style="font-size: 14px; color: #888; margin-top: 30px;">
              This is an automated message from TripSplit. Please do not reply to this email.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorText }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-expense-request function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);