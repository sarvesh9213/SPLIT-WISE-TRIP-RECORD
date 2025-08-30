import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.1";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  debtorEmail?: string;
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

    const {
      tripId,
      tripName,
      currency,
      debtorName,
      creditorName,
      amount,
      debtorEmail
    }: ExpenseRequestData = await req.json();

    console.log("Processing expense request:", { tripId, debtorName, creditorName, amount });

    // Get recipient email from participants table if not provided
    let recipientEmail = debtorEmail;
    
    if (!recipientEmail) {
      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('email')
        .eq('trip_id', tripId)
        .eq('name', debtorName)
        .single();

      if (participantError) {
        console.error("Error finding participant:", participantError);
        return new Response(
          JSON.stringify({ error: "Could not find participant email" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      recipientEmail = participant?.email;
    }

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No email found for this participant" }),
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

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "TripSplit <onboarding@resend.dev>", // You can customize this
      to: [recipientEmail],
      subject: `Payment Request: ${formattedAmount} for ${tripName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Request</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8fafc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .trip-info {
              background: #f1f5f9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .amount-highlight {
              font-size: 32px;
              font-weight: bold;
              color: #e11d48;
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              background: #fef2f2;
              border-radius: 8px;
              border: 2px solid #fecaca;
            }
            .details {
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              color: #64748b;
              font-size: 14px;
            }
            .emoji {
              font-size: 24px;
              margin-right: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="emoji">💰</span>Payment Request</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${debtorName}</strong>,</p>
              
              <p>You have a pending payment request from <strong>${creditorName}</strong> for your shared expenses.</p>
              
              <div class="trip-info">
                <h3 style="margin-top: 0; color: #1e293b;"><span class="emoji">✈️</span>${tripName}</h3>
                <p style="margin-bottom: 0; color: #64748b;">Trip expenses that need to be settled</p>
              </div>

              <div class="amount-highlight">
                ${formattedAmount}
              </div>

              <div class="details">
                <div class="detail-row">
                  <span><strong>Amount Owed:</strong></span>
                  <span>${formattedAmount}</span>
                </div>
                <div class="detail-row">
                  <span><strong>To:</strong></span>
                  <span>${creditorName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Trip:</strong></span>
                  <span>${tripName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Currency:</strong></span>
                  <span>${currency}</span>
                </div>
              </div>

              <p>Please settle this amount at your earliest convenience. You can use any payment method that works best for both of you (bank transfer, digital wallet, cash, etc.).</p>

              <p>Thanks for keeping our trip expenses organized! 🙌</p>
            </div>

            <div class="footer">
              <p>This email was sent from TripSplit - Your travel expense tracking companion</p>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment request sent successfully",
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-expense-request function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send payment request",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);