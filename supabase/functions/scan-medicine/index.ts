const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Medicine = {
  name: string;
  amount: string;
  frequency: string;
  time_label: string;
  time: string;
};

type RefillInfo = {
  medication: string;
  batchNumber: string;
  manufacturer: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const image: string = body.image;
    const mode: "prescription" | "refill" = body.mode;

    if (!image || !mode) {
      return new Response(
        JSON.stringify({ error: "Missing image or mode" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI vision service not configured. Add an OPENAI_API_KEY secret to the Supabase project." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt =
      mode === "prescription"
        ? `You are a medical prescription reader. Analyze this prescription image and extract all medicines. Return ONLY a JSON object with a "medicines" array. Each medicine has: name (medicine name), amount (dosage like "500mg" or "1 tablet"), frequency (like "1x Daily", "2x Daily", "3x Daily", "1x Nightly", "As needed"), time_label (like "Morning", "Afternoon", "Night", "Day"), time (24-hour format like "08:00", "12:00", "22:00"). If you cannot read the image clearly, return an empty medicines array. Example: {"medicines":[{"name":"Metformin","amount":"500mg","frequency":"2x Daily","time_label":"Morning","time":"08:00"}]}`
        : `You are a medicine label reader. Analyze this medicine label/packaging image and extract the medicine details. Return ONLY a JSON object with: medication (medicine name with strength), batchNumber (batch or lot number), manufacturer (company name, or "Not detected" if not visible). If you cannot read the image clearly, set all fields to empty strings. Example: {"medication":"Metformin 500mg","batchNumber":"BN12345","manufacturer":"Sun Pharma"}`;

    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      return new Response(
        JSON.stringify({ error: `AI service error: ${apiResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiData = await apiResponse.json();
    const content: string = apiData.choices?.[0]?.message?.content ?? "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify(
          mode === "prescription"
            ? { medicines: [] }
            : { medication: "", batchNumber: "", manufacturer: "Not detected" },
        ),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (mode === "prescription") {
      const medicines: Medicine[] = Array.isArray(parsed.medicines) ? parsed.medicines : [];
      return new Response(
        JSON.stringify({ medicines }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else {
      const refill: RefillInfo = {
        medication: parsed.medication ?? "",
        batchNumber: parsed.batchNumber ?? "",
        manufacturer: parsed.manufacturer ?? "Not detected",
      };
      return new Response(
        JSON.stringify({ refill }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
