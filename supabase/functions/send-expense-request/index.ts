import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExpenseRequestData {
  tripId: string;
  tripName: string;
  currency: string;
  debtorName: string;
  creditorName: string;
  amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tripId, tripName, currency, debtorName, creditorName, amount }: ExpenseRequestData = await req.json();
    console.log('Received request data:', { tripId, tripName, currency, debtorName, creditorName, amount });

    // First, try to find email in participants table
    let recipientEmail: string | null = null;
    
    const { data: participant } = await supabase
      .from('participants')
      .select('email')
      .eq('trip_id', tripId)
      .eq('name', debtorName)
      .maybeSingle();

    recipientEmail = participant?.email || null;

    // If no email found in participants, look for user by name in profiles
    if (!recipientEmail) {
      // Try to find a registered user with matching name
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .or(`first_name.ilike.%${debtorName}%,last_name.ilike.%${debtorName}%`);

      if (profiles && profiles.length > 0) {
        // Find the best match - exact name match or closest match
        const exactMatch = profiles.find(p => {
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          return fullName.toLowerCase() === debtorName.toLowerCase();
        });

        if (exactMatch) {
          recipientEmail = exactMatch.email;
        } else {
          // Use first partial match if no exact match
          recipientEmail = profiles[0].email;
        }
      }
    }

    if (!recipientEmail) {
      console.log(`No email found for participant: ${debtorName}`);
      return new Response(
        JSON.stringify({ 
          error: `No email found for ${debtorName}. They may need to sign up or add their email to the trip.`,
          userNotFound: true 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format currency symbol
    const getCurrencySymbol = (currencyCode: string): string => {
      const currencyMap: Record<string, string> = {
        USD: '$',
        EUR: '€',
        INR: '₹',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'Fr',
        CNY: '¥',
        SEK: 'kr',
        NOK: 'kr',
        DKK: 'kr',
      };
      return currencyMap[currencyCode] || currencyCode;
    };

    const currencySymbol = getCurrencySymbol(currency);
    const formattedAmount = `${currencySymbol}${amount.toFixed(2)}`;

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
              ${creditorName} has requested <strong>${formattedAmount}</strong> from you for trip <strong>${tripName}</strong>.
            </p>
            
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Payment Details:</h3>
              <p style="font-size: 18px; margin: 5px 0;"><strong>Amount Due: ${formattedAmount}</strong></p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">Trip: ${tripName}</p>
              <p style="font-size: 14px; color: #666; margin: 5px 0;">Requested by: ${creditorName}</p>
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