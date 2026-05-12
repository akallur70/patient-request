/**
 * WhatsApp action handler
 * Processes responses from staff (Acknowledged, Resolved buttons)
 */

import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase';
import { updateRequestStatus, getRequestStatus } from '../../../lib/statusTracking';
import { sendWhatsAppAlert } from '../../../lib/whatsapp';

interface WhatsAppResponse {
  action: 'acknowledged' | 'resolved';
  requestId: string;
  staffPhone: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, requestId, staffPhone } = body as WhatsAppResponse;

    if (!action || !requestId || !staffPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: action, requestId, staffPhone' },
        { status: 400 }
      );
    }

    if (!['acknowledged', 'resolved'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "acknowledged" or "resolved"' },
        { status: 400 }
      );
    }

    // Get current status
    const currentStatus = await getRequestStatus(requestId);
    if (!currentStatus) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Verify staff member is assigned
    if (currentStatus.assigned_to !== staffPhone) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this request' },
        { status: 403 }
      );
    }

    // Don't allow going backwards
    if (action === 'acknowledged' && currentStatus.status !== 'created' && currentStatus.status !== 'escalated') {
      return NextResponse.json(
        { success: false, error: `Cannot acknowledge request in ${currentStatus.status} status` },
        { status: 400 }
      );
    }

    // Update status
    const updated = await updateRequestStatus({
      requestId,
      statusFrom: currentStatus.status as any,
      statusTo: action,
      actionBy: staffPhone,
      actionType: action,
      notes: `${action.charAt(0).toUpperCase() + action.slice(1)} by staff member`,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update request status' },
        { status: 500 }
      );
    }

    // Send confirmation message
    const messages: Record<string, string> = {
      acknowledged: `✅ Request acknowledged. Will be worked on shortly.`,
      resolved: `✅ Request marked as resolved. Thank you!`,
    };

    await sendWhatsAppAlert({
      recipients: [staffPhone],
      location: { hospital: 'system', floor: null, wing: null },
      room: 'notification',
      department: 'Nursing' as any,
      notes: messages[action],
    });

    return NextResponse.json({
      success: true,
      status: updated.status,
      message: `Request ${action} successfully`,
    });

  } catch (err: any) {
    console.error('Error handling WhatsApp response:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
