// T4.6 — Claude API proxy Edge Function
// Receives scenario context, returns ATC instruction + expected readback

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.39";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ATCConversationEntry {
  role: "atc" | "pilot";
  text: string;
  timestamp: number;
}

interface ATCContext {
  facility: string;
  sector: string;
  callsign: string;
  altitude: number;
  heading: number;
  frequency: number;
  flightPhase: string;
  conversationHistory: ATCConversationEntry[];
  drill: {
    atcConstraints: string;
    traffic: string[];
    weather: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const context: ATCContext = await req.json();

    const systemPrompt = `You are an ATC controller at ${context.facility}, sector ${context.sector}.
You are communicating with aircraft ${context.callsign}.

Current aircraft state:
- Altitude: ${context.altitude} feet
- Heading: ${context.heading} degrees
- Frequency: ${context.frequency} MHz
- Flight phase: ${context.flightPhase}

Scenario constraints:
- ${context.drill.atcConstraints}
- Traffic: ${context.drill.traffic.join("; ")}
- Weather: ${context.drill.weather}

Rules:
1. Use standard FAA/ICAO phraseology
2. Be concise and professional
3. Include altitude, heading, or frequency changes as appropriate for the scenario
4. Return your response as JSON with exactly two fields:
   - "instruction": The ATC instruction as spoken
   - "expectedReadback": What the pilot should read back

Do NOT wrap the JSON in markdown code fences. Return raw JSON only.`;

    const conversationMessages = context.conversationHistory.map((entry) => ({
      role: entry.role === "atc" ? ("assistant" as const) : ("user" as const),
      content: entry.text,
    }));

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        ...conversationMessages,
        {
          role: "user",
          content:
            "Generate the next ATC instruction for this scenario. Respond with JSON only.",
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const parsed = JSON.parse(textBlock.text);

    return new Response(
      JSON.stringify({
        instruction: parsed.instruction,
        expectedReadback: parsed.expectedReadback,
        requiredActions: parsed.requiredActions ?? [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
