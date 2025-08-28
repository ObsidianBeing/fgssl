// src/app/api/appointments/[id]/ics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Appointment from "@/models/Appointment";
import { generateICS } from "@/utils/ics";

export async function GET(
    _req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Connect to MongoDB
        await connectMongoDB();

        // 2. Await the params promise
       /* const { id } = await props.params;

        // 3. Fetch appointment from MongoDB
        const appointment = await Appointment.findById(id).lean() as {
            title: string;
            startUtcISO: string;
            fullName: string;
            email: string;
            preferredDate: string;
            preferredTime: string;
            medium: string;
            meetingLink: string;
            _id: any;
            [key: string]: any;
        } | null;

        if (!appointment) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        // 4. Type-safe destructuring
        const {
            title,
            startUtcISO,
            fullName,
            email,
            preferredDate,
            preferredTime,
            medium,
            meetingLink,
            _id,
        } = appointment;

        // 5. Validate required fields
        if (
            !title ||
            !startUtcISO ||
            !fullName ||
            !email ||
            !preferredDate ||
            !preferredTime ||
            !medium ||
            !meetingLink
        ) {
            return NextResponse.json(
                { error: "Invalid or incomplete appointment data" },
                { status: 400 }
            );
        }

        // 6. Generate ICS content
        const icsContent = generateICS({
            title,
            startUtcISO,
            description: `Appointment with ${fullName} (${email})\nMedium: ${medium}\nMeeting Link: ${meetingLink}\nPreferred Date: ${preferredDate}\nPreferred Time: ${preferredTime}`,
        });

        // 7. Return ICS file as downloadable response
        return new NextResponse(icsContent, {
            headers: {
                "Content-Type": "text/calendar; charset=utf-8",
                "Content-Disposition": `attachment; filename="appointment-${_id?.toString?.() ?? id}.ics"`,
            },
        });*/
    } catch (error: any) {
        console.error("Error generating ICS:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}