/**
 * Escalation handler for requests not acknowledged within timeout period
 * Can be called by a cron job or triggered manually
 */

import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { reassignRequest, getRequestStatus } from '../../../lib/statusTracking';
import { getContacts } from '../../../lib/routing';
import { sendWhatsAppAlert } from '../../../lib/whatsapp';

// Timeout in minutes before escalation
const ACKNOWLEDGMENT_TIMEOUT_MINUTES = 5;

interface EscalationResult {
  escalated: number;
  failed: number;
  skipped: number;
}

export async function POST(request: Request) {
  try {
    // Check for requests that should be escalated
    const timeoutDate = new Date();
    timeoutDate.setMinutes(timeoutDate.getMinutes() - ACKNOWLEDGMENT_TIMEOUT_MINUTES);

    const { data: pendingRequests, error } = await supabase
      .from('request_status')
      .select(`
        *,
        patient_requests (
          id,
          hospital,
          floor,
          wing,
          room,
          department
        )
      `)
      .in('status', ['created', 'escalated'])
      .lt('assigned_at', timeoutDate.toISOString());

    if (error) {
      throw new Error(`Failed to fetch pending requests: ${error.message}`);
    }

    const results: EscalationResult = {
      escalated: 0,
      failed: 0,
      skipped: 0,
    };

    for (const reqStatus of pendingRequests ?? []) {
      try {
        const patientRequest = reqStatus.patient_requests;
        const currentAssignee = reqStatus.assigned_to;
        const escalationCount = reqStatus.escalation_count || 0;

        // Limit escalations to prevent infinite loop (max 3 escalations)
        if (escalationCount >= 3) {
          console.log(`Request ${reqStatus.request_id} reached max escalations, skipping`);
          results.skipped++;
          continue;
        }

        // Get next level contacts for escalation
        const { whatsapp: escalationContacts } = await getContacts(
          {
            hospital: patientRequest.hospital,
            floor: patientRequest.floor,
            wing: patientRequest.wing,
          },
          patientRequest.department
        );

        // Filter out current assignee and pick first alternative
        const nextAssignee = escalationContacts.find(phone => phone !== currentAssignee);

        if (!nextAssignee) {
          console.log(`No escalation target found for request ${reqStatus.request_id}`);
          results.skipped++;
          continue;
        }

        // Reassign
        const reassigned = await reassignRequest(
          reqStatus.request_id,
          nextAssignee,
          currentAssignee
        );

        if (!reassigned) {
          results.failed++;
          continue;
        }

        // Notify new assignee
        const escalationMessage = `🚨 ESCALATED REQUEST\nPatient in ${patientRequest.room} needs ${patientRequest.department}\nOriginal contact did not respond.\n\nReply "Acknowledged" or tap the button to respond.`;

        await sendWhatsAppAlert({
          recipients: [nextAssignee],
          location: {
            hospital: patientRequest.hospital,
            floor: patientRequest.floor,
            wing: patientRequest.wing,
          },
          room: patientRequest.room,
          department: patientRequest.department as any,
          notes: escalationMessage,
        });

        // Notify previous assignee of escalation
        await sendWhatsAppAlert({
          recipients: [currentAssignee],
          location: {
            hospital: patientRequest.hospital,
            floor: patientRequest.floor,
            wing: patientRequest.wing,
          },
          room: patientRequest.room,
          department: patientRequest.department as any,
          notes: `ℹ️ Your request for ${patientRequest.room} was escalated to another team member due to timeout.`,
        });

        results.escalated++;
      } catch (err) {
        console.error(`Failed to escalate request:`, err);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Escalation complete: ${results.escalated} escalated, ${results.failed} failed, ${results.skipped} skipped`,
    });

  } catch (err: any) {
    console.error('Escalation handler error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
