// src/app/api/banners/route.ts
import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { blobs } = await list({
      prefix: "banner_",
      token: "vercel_blob_rw_7uCpedk8uHSlW1Qx_dcwT0MT5tlQ1c9CQxapv3ElBDJgpLd", // Hardcoded for now
    });
    const bannerData = blobs.map(blob => {
      const filenameParts = blob.pathname.split("_");
      const id = parseInt(filenameParts[1].split(".")[0], 10);
      return {
        id,
        imageUrl: blob.url,
        marketId: 0, // Placeholder
        title: "Banner " + id, // Placeholder
      };
    });
    return NextResponse.json(bannerData);
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}