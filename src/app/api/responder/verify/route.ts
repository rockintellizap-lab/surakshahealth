import { NextRequest, NextResponse } from "next/server";
import { getProfile, logResponderAccess } from "@/lib/profileService";
import type { EmergencyProfile } from "@/lib/profile";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, responderName, responderEmail, responderPhone, ip, userAgent } = body;

    if (!uid || !responderName || !responderEmail || !responderPhone) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const profile = await getProfile(uid);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Profile is not approved for emergency access" },
        { status: 403 }
      );
    }

    await logResponderAccess(uid, {
      responderName,
      responderEmail,
      responderPhone,
      ip: ip || "unknown",
      userAgent: userAgent || "unknown",
    });

    const { vaccinations, photo, aadhaar, ...emergencyData } = profile;
    const responseData: EmergencyProfile & { uid: string } = {
      ...emergencyData,
      uid,
    };

    return NextResponse.json({ success: true, profile: responseData });
  } catch (error) {
    console.error("Responder verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}