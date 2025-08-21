// This new route handles the final push to the Emaar API.
import { NextResponse } from "next/server";

// Emaar API configuration
const EMAAR_CONFIG = {
  dev: {
    url: "https://apidev.emaar.com/etenantsales/casualsales",
    apiKey: process.env.EMAAR_DEV_API_KEY,
  },
  prod: {
    url: "https://api.emaar.com/etenantsales/casualsales",
    apiKey: process.env.EMAAR_PROD_API_KEY,
  },
};

export async function POST(request) {
  try {
    const { payload, environment } = await request.json();

    if (!payload) {
      return NextResponse.json(
        { message: "Payload is missing." },
        { status: 400 }
      );
    }
    if (!["dev", "prod"].includes(environment)) {
      return NextResponse.json(
        { message: "Invalid environment specified." },
        { status: 400 }
      );
    }

    const config = EMAAR_CONFIG[environment];
    console.log(`Pushing to Emaar ${environment.toUpperCase()} endpoint...`);

    const emaarResponse = await fetch(config.url, {
      method: "POST",
      headers: {
        "x-apikey": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Get the response text or json from Emaar
    const responseData = await emaarResponse
      .json()
      .catch(() => emaarResponse.text());

    if (!emaarResponse.ok) {
      console.error(`Emaar API Error (${emaarResponse.status}):`, responseData);
      throw new Error(
        `Emaar API returned an error: ${JSON.stringify(responseData)}`
      );
    }

    console.log("Successfully pushed to Emaar:", responseData);
    return NextResponse.json({
      message: "Successfully pushed sales data to Emaar.",
      details: responseData,
    });
  } catch (error) {
    console.error("Internal server error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
