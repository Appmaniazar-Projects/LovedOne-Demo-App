// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

console.info("Pay@ auth function started");

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (_req, _ctx) => {
      const clientId = Deno.env.get("PAYAT_CLIENT_ID");
      const clientSecret = Deno.env.get("PAYAT_CLIENT_SECRET");

      if (!clientId || !clientSecret) {
        return Response.json(
          {
            success: false,
            error: "Pay@ credentials are not configured.",
          },
          { status: 500 },
        );
      }

      const basicAuth = btoa(`${clientId}:${clientSecret}`);

      const response = await fetch(
        "https://staging-go.payat.co.za/yapi/oauth/token",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
          }).toString(),
        },
      );

      const responseText = await response.text();

      if (!response.ok) {
        console.error(
          `Pay@ token request failed: ${response.status}`,
          responseText,
        );

        return Response.json(
          {
            success: false,
            status: response.status,
            error: "Pay@ authentication failed.",
            details: responseText,
          },
          { status: response.status },
        );
      }

      const tokenData = JSON.parse(responseText);

      return Response.json({
        success: true,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        access_token_received: Boolean(tokenData.access_token),
      });
    },
  ),
};