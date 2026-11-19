import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { BUSINESS_PRESETS, loadState, resetState, saveState } from './server/store.ts';
import {
  generateBusinessGrowthInsights,
  generateFollowUpDraft,
  generateWhatsAppAssistantReply,
} from './server/gemini.ts';
import type {
  AppointmentRecord,
  BusinessProfile,
  EnquiryThread,
  LeadRecord,
} from './src/types/locallift.ts';

function formatNowTime(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: '2mb' }));

  // 1. Fetch complete workspace state + preset catalog
  app.get('/api/state', (_req, res) => {
    const state = loadState();
    const presets = Object.values(BUSINESS_PRESETS).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      city: p.city,
    }));
    res.json({ state, presets });
  });

  // 2. Switch demo business preset or reset workspace
  app.post('/api/reset', (req, res) => {
    const presetId = typeof req.body?.presetId === 'string' ? req.body.presetId : 'aurora';
    const state = resetState(presetId);
    res.json({ state });
  });

  // 3. Live WhatsApp AI Simulator & Customer Enquiry Handler (powered by Gemini)
  app.post('/api/chat/whatsapp', async (req, res) => {
    try {
      const { enquiryId, customerName, customerPhone, message, afterHours } = req.body as {
        enquiryId?: string;
        customerName?: string;
        customerPhone?: string;
        message?: string;
        afterHours?: boolean;
      };

      if (!message || !message.trim()) {
        res.status(400).json({ error: 'Message text is required.' });
        return;
      }

      const state = loadState();
      const nowTime = formatNowTime();
      const safeName = (customerName || 'Walk-in Guest').trim();
      const safePhone = (customerPhone || '+91 98450 99120').trim();

      let thread: EnquiryThread | undefined = enquiryId
        ? state.enquiries.find((e) => e.id === enquiryId)
        : undefined;

      if (!thread) {
        thread = {
          id: makeId('enq'),
          customerName: safeName,
          customerPhone: safePhone,
          source: 'WhatsApp Direct',
          status: 'ai_handled',
          lastMessageAt: nowTime,
          afterHours: Boolean(afterHours),
          intent: 'New Enquiry',
          detectedService: 'General Enquiry',
          estimatedValue: state.business.services[0]?.price ?? 1200,
          unread: false,
          messages: [],
        };
        state.enquiries.unshift(thread);
      }

      const existingHistory = [...thread.messages];
      const existingBookingsToday = state.appointments
        .filter((a) => a.date === '2026-11-19' && a.status !== 'cancelled')
        .map((a) => `${a.time} (${a.serviceName})`);

      const aiResult = await generateWhatsAppAssistantReply({
        business: state.business,
        customerName: thread.customerName,
        customerPhone: thread.customerPhone,
        message: message.trim(),
        history: existingHistory,
        existingBookingsToday,
      });

      // Append customer message & AI reply
      thread.messages.push({
        id: makeId('msg'),
        sender: 'customer',
        text: message.trim(),
        timestamp: afterHours ? '11:15 PM (After Hours)' : nowTime,
      });

      thread.messages.push({
        id: makeId('msg'),
        sender: 'ai',
        text: aiResult.replyText,
        timestamp: afterHours ? '11:15 PM (Auto)' : nowTime,
        intentTag: aiResult.intent,
      });

      thread.lastMessageAt = afterHours ? '11:15 PM' : nowTime;
      thread.intent = aiResult.intent;
      thread.detectedService = aiResult.detectedService;
      thread.estimatedValue = aiResult.estimatedValue > 0 ? aiResult.estimatedValue : thread.estimatedValue;
      thread.afterHours = thread.afterHours || Boolean(afterHours);

      if (aiResult.bookingExtracted.readyToBook) {
        thread.status = 'converted';
      } else if (aiResult.needsOwnerAttention) {
        thread.status = 'needs_owner';
        thread.unread = true;
      } else {
        thread.status = 'ai_handled';
      }

      // Create or update CRM Lead automatically
      let lead = state.leads.find(
        (l) => l.enquiryId === thread!.id || l.phone === thread!.customerPhone
      );
      const computedStage = aiResult.bookingExtracted.readyToBook
        ? 'converted'
        : aiResult.leadStage;

      if (!lead) {
        lead = {
          id: makeId('lead'),
          name: thread.customerName,
          phone: thread.customerPhone,
          serviceInterest: aiResult.detectedService,
          estimatedValue: thread.estimatedValue,
          stage: computedStage,
          source: thread.source,
          createdAt: '2026-11-19',
          lastContactedAt: `Today, ${nowTime}`,
          nextFollowUpAt: aiResult.followUpSuggestion,
          notes: `Auto-captured via LocalLift AI (${aiResult.intent}).`,
          enquiryId: thread.id,
        };
        state.leads.unshift(lead);
      } else {
        lead.serviceInterest = aiResult.detectedService || lead.serviceInterest;
        lead.estimatedValue = thread.estimatedValue || lead.estimatedValue;
        lead.stage = computedStage;
        lead.lastContactedAt = `Today, ${nowTime}`;
        lead.nextFollowUpAt = aiResult.followUpSuggestion;
      }

      // Create appointment automatically if customer confirmed booking
      let bookingCreated: AppointmentRecord | null = null;
      if (aiResult.bookingExtracted.readyToBook) {
        const matchedService = state.business.services.find((s) =>
          s.name.toLowerCase().includes(aiResult.bookingExtracted.serviceName.toLowerCase()) ||
          aiResult.bookingExtracted.serviceName.toLowerCase().includes(s.name.toLowerCase())
        );

        bookingCreated = {
          id: makeId('apt'),
          customerName: thread.customerName,
          customerPhone: thread.customerPhone,
          serviceName: matchedService?.name || aiResult.bookingExtracted.serviceName || aiResult.detectedService,
          price: matchedService?.price || thread.estimatedValue,
          date: aiResult.bookingExtracted.preferredDate || '2026-11-20',
          time: aiResult.bookingExtracted.preferredTime || '03:00 PM',
          durationMins: matchedService?.durationMins || 60,
          stylist: state.business.ownerName,
          status: 'confirmed',
          bookedVia: 'WhatsApp AI',
          reminderSent: false,
          notes: 'Booked automatically through WhatsApp AI assistant.',
        };
        state.appointments.unshift(bookingCreated);

        // Update today's metric bucket
        const todayMetric = state.dailyMetrics[state.dailyMetrics.length - 1];
        if (todayMetric) {
          todayMetric.bookings += 1;
          todayMetric.revenue += bookingCreated.price;
        }
      }

      // Increment enquiry counter for today
      const todayBucket = state.dailyMetrics[state.dailyMetrics.length - 1];
      if (todayBucket) {
        todayBucket.enquiries += 1;
        if (!aiResult.needsOwnerAttention) {
          todayBucket.aiResolved += 1;
        }
      }

      saveState(state);

      res.json({
        state,
        enquiryId: thread.id,
        aiMeta: {
          replyText: aiResult.replyText,
          intent: aiResult.intent,
          detectedService: aiResult.detectedService,
          estimatedValue: thread.estimatedValue,
          leadStage: computedStage,
          needsOwnerAttention: aiResult.needsOwnerAttention,
          followUpSuggestion: aiResult.followUpSuggestion,
          bookingCreated,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to reach Gemini AI service.';
      console.error('WhatsApp AI error:', err);
      res.status(502).json({ error: errorMessage });
    }
  });

  // 4. Owner manual reply in Enquiry Inbox
  app.post('/api/enquiries/:id/reply', (req, res) => {
    const state = loadState();
    const thread = state.enquiries.find((e) => e.id === req.params.id);
    if (!thread) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      res.status(400).json({ error: 'Reply text is required.' });
      return;
    }
    const nowTime = formatNowTime();
    thread.messages.push({
      id: makeId('msg'),
      sender: 'owner',
      text,
      timestamp: nowTime,
      intentTag: 'Owner Reply',
    });
    thread.lastMessageAt = nowTime;
    thread.unread = false;
    if (thread.status === 'needs_owner') {
      thread.status = 'ai_handled';
    }
    saveState(state);
    res.json({ state });
  });

  // 5. Mark enquiry read or update status
  app.patch('/api/enquiries/:id', (req, res) => {
    const state = loadState();
    const thread = state.enquiries.find((e) => e.id === req.params.id);
    if (!thread) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    if (typeof req.body?.unread === 'boolean') thread.unread = req.body.unread;
    if (typeof req.body?.status === 'string') {
      thread.status = req.body.status as EnquiryThread['status'];
    }
    saveState(state);
    res.json({ state });
  });

  // 6. Appointments CRUD
  app.post('/api/appointments', (req, res) => {
    const state = loadState();
    const body = req.body as Partial<AppointmentRecord>;
    if (!body.customerName || !body.serviceName || !body.date || !body.time) {
      res.status(400).json({ error: 'Customer name, service, date, and time are required.' });
      return;
    }
    const matchedService = state.business.services.find((s) => s.name === body.serviceName);
    const created: AppointmentRecord = {
      id: makeId('apt'),
      customerName: body.customerName.trim(),
      customerPhone: (body.customerPhone || '+91 98450 00000').trim(),
      serviceName: body.serviceName,
      price: typeof body.price === 'number' ? body.price : matchedService?.price ?? 1500,
      date: body.date,
      time: body.time,
      durationMins: matchedService?.durationMins ?? 60,
      stylist: body.stylist || state.business.ownerName,
      status: body.status || 'confirmed',
      bookedVia: body.bookedVia || 'Manual',
      reminderSent: false,
      notes: body.notes || '',
    };
    state.appointments.unshift(created);
    const todayBucket = state.dailyMetrics[state.dailyMetrics.length - 1];
    if (todayBucket) {
      todayBucket.bookings += 1;
      todayBucket.revenue += created.price;
    }
    saveState(state);
    res.json({ state, appointment: created });
  });

  app.patch('/api/appointments/:id', (req, res) => {
    const state = loadState();
    const apt = state.appointments.find((a) => a.id === req.params.id);
    if (!apt) {
      res.status(404).json({ error: 'Appointment not found.' });
      return;
    }
    Object.assign(apt, req.body);
    saveState(state);
    res.json({ state });
  });

  app.delete('/api/appointments/:id', (req, res) => {
    const state = loadState();
    state.appointments = state.appointments.filter((a) => a.id !== req.params.id);
    saveState(state);
    res.json({ state });
  });

  // 7. Leads CRUD
  app.post('/api/leads', (req, res) => {
    const state = loadState();
    const body = req.body as Partial<LeadRecord>;
    if (!body.name || !body.phone) {
      res.status(400).json({ error: 'Lead name and phone are required.' });
      return;
    }
    const lead: LeadRecord = {
      id: makeId('lead'),
      name: body.name.trim(),
      phone: body.phone.trim(),
      serviceInterest: body.serviceInterest || state.business.services[0]?.name || 'General Service',
      estimatedValue: Number(body.estimatedValue) || 1500,
      stage: body.stage || 'new',
      source: body.source || 'WhatsApp Direct',
      createdAt: '2026-11-19',
      lastContactedAt: 'Just now',
      nextFollowUpAt: 'In 2 hours',
      notes: body.notes || '',
    };
    state.leads.unshift(lead);
    saveState(state);
    res.json({ state, lead });
  });

  app.patch('/api/leads/:id', (req, res) => {
    const state = loadState();
    const lead = state.leads.find((l) => l.id === req.params.id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }
    Object.assign(lead, req.body);
    saveState(state);
    res.json({ state });
  });

  // 8. Follow-ups: toggle/edit rule, AI draft message, send follow-up
  app.patch('/api/followups/:id', (req, res) => {
    const state = loadState();
    const rule = state.followUpRules.find((r) => r.id === req.params.id);
    if (!rule) {
      res.status(404).json({ error: 'Follow-up rule not found.' });
      return;
    }
    Object.assign(rule, req.body);
    saveState(state);
    res.json({ state });
  });

  app.post('/api/ai/draft-followup', async (req, res) => {
    try {
      const state = loadState();
      const { customerName, serviceInterest, goal, notes } = req.body as {
        customerName: string;
        serviceInterest: string;
        goal: string;
        notes?: string;
      };
      const draft = await generateFollowUpDraft({
        business: state.business,
        customerName: customerName || 'Guest',
        serviceInterest: serviceInterest || state.business.services[0]?.name || 'Salon Service',
        goal: goal || 'Follow up on recent WhatsApp enquiry and offer an open slot',
        notes,
      });
      res.json({ draft });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to generate follow-up draft.';
      res.status(502).json({ error: errorMessage });
    }
  });

  app.post('/api/followups/send', (req, res) => {
    const state = loadState();
    const { ruleName, recipientName, recipientPhone, message, leadId, appointmentId } = req.body as {
      ruleName: string;
      recipientName: string;
      recipientPhone: string;
      message: string;
      leadId?: string;
      appointmentId?: string;
    };

    if (!recipientName || !message) {
      res.status(400).json({ error: 'Recipient name and message are required.' });
      return;
    }

    const nowTime = formatNowTime();
    state.followUpLogs.unshift({
      id: makeId('ful'),
      ruleName: ruleName || 'AI Follow-Up',
      recipientName,
      recipientPhone: recipientPhone || '+91 98450 00000',
      message,
      sentAt: `Today, ${nowTime}`,
      outcome: 'Sent',
    });

    const rule = state.followUpRules.find((r) => r.name === ruleName);
    if (rule) {
      rule.sentCount += 1;
    }

    if (leadId) {
      const lead = state.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.lastContactedAt = `Today, ${nowTime}`;
        if (lead.stage === 'new') lead.stage = 'qualified';
      }
    }

    if (appointmentId) {
      const apt = state.appointments.find((a) => a.id === appointmentId);
      if (apt) apt.reminderSent = true;
    }

    // Also append to matching enquiry thread if exists
    const thread = state.enquiries.find(
      (e) => e.customerPhone === recipientPhone || e.customerName === recipientName
    );
    if (thread) {
      thread.messages.push({
        id: makeId('msg'),
        sender: 'ai',
        text: message,
        timestamp: nowTime,
        intentTag: 'Automated Follow-Up',
      });
      thread.lastMessageAt = nowTime;
    }

    saveState(state);
    res.json({ state });
  });

  // 9. AI Growth Insights for Analytics / Dashboard
  app.post('/api/ai/insights', async (_req, res) => {
    try {
      const state = loadState();
      const insights = await generateBusinessGrowthInsights(state);
      res.json({ insights });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to generate AI insights.';
      res.status(502).json({ error: errorMessage });
    }
  });

  // 10. Update Business Profile, Services, and FAQs
  app.put('/api/business', (req, res) => {
    const state = loadState();
    const updated = req.body as Partial<BusinessProfile>;
    state.business = {
      ...state.business,
      ...updated,
    };
    saveState(state);
    res.json({ state });
  });

  // Serve Vite middleware in dev, or built dist in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LocalLift AI server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
