import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/profileService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const profile = await getProfile(uid);

    if (!profile) {
      return NextResponse.json(
        { profile: null, error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.status !== "approved") {
      return NextResponse.json(
        { profile: null, error: "Profile is not approved for emergency access" },
        { status: 403 }
      );
    }

    const { reports, vaccinations, photo, aadhaar, ...emergencyData } = profile;
    const responseData = { ...emergencyData, uid };

    return NextResponse.json({ profile: responseData });
  } catch (error) {
    console.error("Responder profile fetch error:", error);
    return NextResponse.json(
      { profile: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
