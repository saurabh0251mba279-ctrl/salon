import fs from 'node:fs';
import path from 'node:path';
import type { BusinessProfile, WorkspaceState } from '../src/types/locallift.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'locallift-state.json');

export const BUSINESS_PRESETS: Record<string, BusinessProfile> = {
  aurora: {
    id: 'aurora',
    name: 'Aurora Hair & Beauty Studio',
    category: 'Hair Salon & Beauty Parlour',
    ownerName: 'Priya Sharma',
    ownerRole: 'Founder & Lead Stylist',
    city: 'Bengaluru',
    address: '14 Indiranagar 100ft Road, Bengaluru 560038',
    whatsappNumber: '+91 98450 22190',
    hours: '10:00 AM – 8:30 PM (Tue–Sun)',
    closedDay: 'Monday',
    assistantName: 'Maya',
    tone: 'Warm & Boutique',
    currencySymbol: '₹',
    bookingPolicy: 'Free rescheduling up to 3 hours before appointment. Bridal trials require ₹1,000 advance adjustable in final bill.',
    afterHoursAutoReply: true,
    services: [
      { id: 'srv-1', name: 'Signature Haircut & Blowdry', category: 'Hair', price: 1200, durationMins: 60, popular: true },
      { id: 'srv-2', name: 'Keratin Smooth Therapy', category: 'Hair', price: 4500, durationMins: 150, popular: true },
      { id: 'srv-3', name: 'Balayage & Global Color', category: 'Hair', price: 5800, durationMins: 180 },
      { id: 'srv-4', name: 'Hydra-Glow Botanical Facial', category: 'Skin', price: 2400, durationMins: 75, popular: true },
      { id: 'srv-5', name: 'Bridal HD Makeup & Draping', category: 'Bridal', price: 18500, durationMins: 180, popular: true },
      { id: 'srv-6', name: 'Party Makeup & Hair Styling', category: 'Makeup', price: 4200, durationMins: 90 },
      { id: 'srv-7', name: 'Deep Nourishing Hair Spa', category: 'Hair', price: 1800, durationMins: 60 },
      { id: 'srv-8', name: 'Gel Nail Extensions & Art', category: 'Nails', price: 1650, durationMins: 75 },
    ],
    faqs: [
      {
        id: 'faq-1',
        question: 'Do you accept walk-ins or only prior bookings?',
        answer: 'Walk-ins are welcome on weekdays, though we recommend pre-booking on Fridays and weekends so you never have to wait.',
      },
      {
        id: 'faq-2',
        question: 'Which products do you use for Keratin and Color?',
        answer: 'We use salon-grade sulfate-free botanical keratin and ammonia-free colour ranges suitable for sensitive scalps.',
      },
      {
        id: 'faq-3',
        question: 'Is parking available near the studio?',
        answer: 'Yes, dedicated basement valet parking is available right outside our 100ft Road entrance.',
      },
      {
        id: 'faq-4',
        question: 'Do you offer bridal trial sessions?',
        answer: 'Yes, bridal trials take 90 minutes and cost ₹2,500, which is 100% adjusted if you confirm your wedding date with us.',
      },
    ],
  },
  velvet: {
    id: 'velvet',
    name: 'Velvet Skin & Bridal Parlour',
    category: 'Beauty Parlour & Skin Studio',
    ownerName: 'Ananya Verma',
    ownerRole: 'Founder & Makeup Artist',
    city: 'Pune',
    address: '22 Lane 6, Koregaon Park, Pune 411001',
    whatsappNumber: '+91 97650 88412',
    hours: '10:30 AM – 8:00 PM (All Days)',
    closedDay: 'None',
    assistantName: 'Riya',
    tone: 'Friendly & Local',
    currencySymbol: '₹',
    bookingPolicy: 'Appointments held for 15 minutes past scheduled time. Home bridal visits available within 15 km.',
    afterHoursAutoReply: true,
    services: [
      { id: 'srv-v1', name: 'O3+ Radiance Bridal Facial', category: 'Skin', price: 2800, durationMins: 75, popular: true },
      { id: 'srv-v2', name: 'Airbrush Bridal Package', category: 'Bridal', price: 22000, durationMins: 210, popular: true },
      { id: 'srv-v3', name: 'Full Body Detan & Polish', category: 'Skin', price: 3200, durationMins: 90 },
      { id: 'srv-v4', name: 'Sider Makeup & Saree Draping', category: 'Makeup', price: 3800, durationMins: 75, popular: true },
      { id: 'srv-v5', name: 'Eyebrow Threading & Cleanup', category: 'Essentials', price: 950, durationMins: 40 },
    ],
    faqs: [
      {
        id: 'faq-v1',
        question: 'Do you travel to wedding venues for bridal makeup?',
        answer: 'Yes, our bridal team travels across Pune and PCMC venues for bookings above ₹15,000.',
      },
      {
        id: 'faq-v2',
        question: 'How early should I book pre-bridal packages?',
        answer: 'Ideally 4 to 6 weeks prior to the wedding so skin treatments have time to settle and glow.',
      },
    ],
  },
  oakblade: {
    id: 'oakblade',
    name: 'Oak & Blade Grooming Lounge',
    category: 'Men’s Hair & Grooming Studio',
    ownerName: 'Rohan Malhotra',
    ownerRole: 'Founder & Master Barber',
    city: 'Mumbai',
    address: '8 Pali Hill Market, Bandra West, Mumbai 400050',
    whatsappNumber: '+91 98201 66340',
    hours: '9:30 AM – 9:30 PM (Tue–Sun)',
    closedDay: 'Monday',
    assistantName: 'Sam',
    tone: 'Crisp & Professional',
    currencySymbol: '₹',
    bookingPolicy: 'Same-day cancellations accepted up to 2 hours prior. Complimentary espresso with every grooming session.',
    afterHoursAutoReply: true,
    services: [
      { id: 'srv-o1', name: 'Precision Fade & Haircut', category: 'Hair', price: 900, durationMins: 45, popular: true },
      { id: 'srv-o2', name: 'Hot Towel Beard Sculpt', category: 'Beard', price: 650, durationMins: 30, popular: true },
      { id: 'srv-o3', name: 'Charcoal Detox Facial', category: 'Skin', price: 1900, durationMins: 60 },
      { id: 'srv-o4', name: 'Groom Complete Makeover', category: 'Packages', price: 6500, durationMins: 150, popular: true },
    ],
    faqs: [
      {
        id: 'faq-o1',
        question: 'Are you open late on weekday evenings?',
        answer: 'Yes, our last chair slot starts at 8:45 PM Tuesday through Sunday.',
      },
    ],
  },
};

export function createSeedState(presetKey: string = 'aurora'): WorkspaceState {
  const business = structuredClone(BUSINESS_PRESETS[presetKey] ?? BUSINESS_PRESETS.aurora);
  const today = '2026-11-19';
  const tomorrow = '2026-11-20';
  const sat = '2026-11-21';

  return {
    business,
    avgResponseSeconds: 4,
    lastUpdated: new Date().toISOString(),
    enquiries: [
      {
        id: 'enq-101',
        customerName: 'Meera Nair',
        customerPhone: '+91 98451 77210',
        source: 'Instagram Click-to-WA',
        status: 'converted',
        lastMessageAt: '10:14 AM',
        afterHours: false,
        intent: 'Appointment Booking',
        detectedService: business.services[1]?.name ?? 'Keratin Smooth Therapy',
        estimatedValue: business.services[1]?.price ?? 4500,
        unread: false,
        messages: [
          {
            id: 'm-1',
            sender: 'customer',
            text: `Hi! Do you have slots for ${business.services[1]?.name ?? 'Keratin Smooth Therapy'} tomorrow afternoon? Also what is the price?`,
            timestamp: '10:12 AM',
          },
          {
            id: 'm-2',
            sender: 'ai',
            text: `Hi Meera! Welcome to ${business.name}. Our ${business.services[1]?.name ?? 'Keratin Smooth Therapy'} is ${business.currencySymbol}${business.services[1]?.price.toLocaleString('en-IN') ?? '4,500'} (${business.services[1]?.durationMins ?? 150} mins) using sulfate-free botanical products. Tomorrow we have open slots at 1:30 PM and 4:00 PM. Which time works best for you?`,
            timestamp: '10:12 AM',
            intentTag: 'Price & Availability',
          },
          {
            id: 'm-3',
            sender: 'customer',
            text: '1:30 PM works great, please book me in!',
            timestamp: '10:14 AM',
          },
          {
            id: 'm-4',
            sender: 'ai',
            text: `Booked! Your ${business.services[1]?.name ?? 'Keratin Smooth Therapy'} is confirmed for tomorrow (20 Nov) at 1:30 PM. We will send a WhatsApp reminder 2 hours before your visit.`,
            timestamp: '10:14 AM',
            intentTag: 'Booking Confirmed',
          },
        ],
      },
      {
        id: 'enq-102',
        customerName: 'Kavya Deshmukh',
        customerPhone: '+91 99002 44189',
        source: 'Google Maps WA',
        status: 'ai_handled',
        lastMessageAt: '09:42 AM',
        afterHours: true,
        intent: 'Bridal Package Enquiry',
        detectedService: business.services[4]?.name ?? business.services[0].name,
        estimatedValue: business.services[4]?.price ?? 18500,
        unread: true,
        messages: [
          {
            id: 'm-5',
            sender: 'customer',
            text: 'Hello, checking availability for bridal HD makeup on December 12 morning. Can I book a trial first?',
            timestamp: '11:28 PM (Yesterday)',
          },
          {
            id: 'm-6',
            sender: 'ai',
            text: `Hi Kavya! Thanks for messaging ${business.name}. We do offer bridal trials (90 mins, ₹2,500 — 100% adjusted in your final bridal package of ₹18,500). December 12 morning is currently open for consultation. Would you like to reserve a trial slot this Saturday at 11:00 AM?`,
            timestamp: '11:28 PM (Yesterday)',
            intentTag: 'After-Hours Capture',
          },
          {
            id: 'm-7',
            sender: 'customer',
            text: 'Saturday 11 AM sounds good, let me confirm with my sister and text back shortly.',
            timestamp: '09:42 AM',
          },
        ],
      },
      {
        id: 'enq-103',
        customerName: 'Sneha Kulkarni',
        customerPhone: '+91 98867 31904',
        source: 'WhatsApp Direct',
        status: 'needs_owner',
        lastMessageAt: '09:05 AM',
        afterHours: false,
        intent: 'Custom Group Booking',
        detectedService: business.services[5]?.name ?? business.services[0].name,
        estimatedValue: 16800,
        unread: true,
        messages: [
          {
            id: 'm-8',
            sender: 'customer',
            text: 'Hi! We are 4 bridesmaids needing party makeup and hair styling on Sunday 29 Nov at 7 AM. Can you open early for a group discount?',
            timestamp: '09:04 AM',
          },
          {
            id: 'm-9',
            sender: 'ai',
            text: `Hi Sneha! Thank you for reaching out for your group of 4. Since 7:00 AM is before our regular opening time and includes a custom group package, I have flagged this for ${business.ownerName} to confirm early-opening availability and a group offer right away.`,
            timestamp: '09:05 AM',
            intentTag: 'Owner Escalation',
          },
        ],
      },
      {
        id: 'enq-104',
        customerName: 'Divya Menon',
        customerPhone: '+91 97412 55091',
        source: 'Google Maps WA',
        status: 'converted',
        lastMessageAt: 'Yesterday',
        afterHours: true,
        intent: 'Appointment Booking',
        detectedService: business.services[3]?.name ?? business.services[0].name,
        estimatedValue: business.services[3]?.price ?? 2400,
        unread: false,
        messages: [
          {
            id: 'm-10',
            sender: 'customer',
            text: 'Is Hydra-Glow facial safe for sensitive dry skin? Want to book for today evening.',
            timestamp: 'Yesterday, 9:50 PM',
          },
          {
            id: 'm-11',
            sender: 'ai',
            text: 'Yes Divya! Our Hydra-Glow Botanical Facial is gentle, fragrance-light, and tailored specifically for dry or reactive skin. Today we have a 5:30 PM slot open. Shall I confirm it for you?',
            timestamp: 'Yesterday, 9:50 PM',
            intentTag: 'FAQ + Booking',
          },
          {
            id: 'm-12',
            sender: 'customer',
            text: 'Yes please confirm 5:30 PM today.',
            timestamp: 'Yesterday, 9:53 PM',
          },
        ],
      },
    ],
    leads: [
      {
        id: 'lead-1',
        name: 'Kavya Deshmukh',
        phone: '+91 99002 44189',
        serviceInterest: business.services[4]?.name ?? 'Bridal HD Makeup & Draping',
        estimatedValue: 18500,
        stage: 'booking_sent',
        source: 'Google Maps WA',
        createdAt: '2026-11-18',
        lastContactedAt: 'Today, 09:42 AM',
        nextFollowUpAt: 'Today, 2:00 PM',
        notes: 'Checking with sister for Saturday 11 AM bridal trial. High-intent December bride.',
        enquiryId: 'enq-102',
      },
      {
        id: 'lead-2',
        name: 'Sneha Kulkarni',
        phone: '+91 98867 31904',
        serviceInterest: '4x Party Makeup & Hair Styling',
        estimatedValue: 16800,
        stage: 'qualified',
        source: 'WhatsApp Direct',
        createdAt: '2026-11-19',
        lastContactedAt: 'Today, 09:05 AM',
        nextFollowUpAt: 'Today, 11:00 AM',
        notes: 'Needs early 7 AM opening on 29 Nov. Owner approval required for 10% group package.',
        enquiryId: 'enq-103',
      },
      {
        id: 'lead-3',
        name: 'Meera Nair',
        phone: '+91 98451 77210',
        serviceInterest: business.services[1]?.name ?? 'Keratin Smooth Therapy',
        estimatedValue: business.services[1]?.price ?? 4500,
        stage: 'converted',
        source: 'Instagram Click-to-WA',
        createdAt: '2026-11-19',
        lastContactedAt: 'Today, 10:14 AM',
        nextFollowUpAt: 'Tomorrow, 11:30 AM',
        notes: 'Auto-booked via LocalLift AI for 20 Nov at 1:30 PM.',
        enquiryId: 'enq-101',
      },
      {
        id: 'lead-4',
        name: 'Ritika Joshi',
        phone: '+91 98223 19087',
        serviceInterest: business.services[2]?.name ?? 'Balayage & Global Color',
        estimatedValue: business.services[2]?.price ?? 5800,
        stage: 'new',
        source: 'Instagram Click-to-WA',
        createdAt: '2026-11-18',
        lastContactedAt: 'Yesterday, 6:20 PM',
        nextFollowUpAt: 'Today, 4:00 PM',
        notes: 'Asked about caramel balayage maintenance; automated 24h nudge queued.',
      },
      {
        id: 'lead-5',
        name: 'Divya Menon',
        phone: '+91 97412 55091',
        serviceInterest: business.services[3]?.name ?? 'Hydra-Glow Botanical Facial',
        estimatedValue: business.services[3]?.price ?? 2400,
        stage: 'converted',
        source: 'Google Maps WA',
        createdAt: '2026-11-18',
        lastContactedAt: 'Yesterday, 9:53 PM',
        nextFollowUpAt: 'Today, 3:30 PM',
        notes: 'Captured at 9:50 PM after closing hours and converted automatically.',
        enquiryId: 'enq-104',
      },
      {
        id: 'lead-6',
        name: 'Pooja Shetty',
        phone: '+91 96114 82011',
        serviceInterest: business.services[0]?.name ?? 'Signature Haircut & Blowdry',
        estimatedValue: business.services[0]?.price ?? 1200,
        stage: 'qualified',
        source: 'WhatsApp Direct',
        createdAt: '2026-11-17',
        lastContactedAt: '2 days ago',
        nextFollowUpAt: 'Today, 5:00 PM',
        notes: 'Returning client due for 6-week trim & deep spa.',
      },
    ],
    appointments: [
      {
        id: 'apt-201',
        customerName: 'Aarohi Rao',
        customerPhone: '+91 98452 10944',
        serviceName: business.services[0]?.name ?? 'Signature Haircut & Blowdry',
        price: business.services[0]?.price ?? 1200,
        date: today,
        time: '11:30 AM',
        durationMins: 60,
        stylist: business.ownerName,
        status: 'confirmed',
        bookedVia: 'WhatsApp AI',
        reminderSent: true,
        notes: 'Prefers layered blowout finish.',
      },
      {
        id: 'apt-202',
        customerName: 'Nisha Kapoor',
        customerPhone: '+91 99801 54120',
        serviceName: business.services[6]?.name ?? 'Deep Nourishing Hair Spa',
        price: business.services[6]?.price ?? 1800,
        date: today,
        time: '02:00 PM',
        durationMins: 60,
        stylist: 'Ritu K.',
        status: 'confirmed',
        bookedVia: 'WhatsApp AI',
        reminderSent: true,
      },
      {
        id: 'apt-203',
        customerName: 'Divya Menon',
        customerPhone: '+91 97412 55091',
        serviceName: business.services[3]?.name ?? 'Hydra-Glow Botanical Facial',
        price: business.services[3]?.price ?? 2400,
        date: today,
        time: '05:30 PM',
        durationMins: 75,
        stylist: 'Sonia M.',
        status: 'confirmed',
        bookedVia: 'WhatsApp AI',
        reminderSent: false,
        notes: 'Sensitive dry skin — use fragrance-light botanical serum.',
      },
      {
        id: 'apt-204',
        customerName: 'Meera Nair',
        customerPhone: '+91 98451 77210',
        serviceName: business.services[1]?.name ?? 'Keratin Smooth Therapy',
        price: business.services[1]?.price ?? 4500,
        date: tomorrow,
        time: '01:30 PM',
        durationMins: 150,
        stylist: business.ownerName,
        status: 'confirmed',
        bookedVia: 'WhatsApp AI',
        reminderSent: false,
      },
      {
        id: 'apt-205',
        customerName: 'Tanya Bhatia',
        customerPhone: '+91 98450 61823',
        serviceName: business.services[7]?.name ?? 'Gel Nail Extensions & Art',
        price: business.services[7]?.price ?? 1650,
        date: sat,
        time: '12:00 PM',
        durationMins: 75,
        stylist: 'Ritu K.',
        status: 'pending',
        bookedVia: 'Manual',
        reminderSent: false,
      },
    ],
    followUpRules: [
      {
        id: 'fu-1',
        name: '2-Hour Unbooked Enquiry Nudge',
        trigger: 'Customer asked price/slots but did not confirm booking',
        delayLabel: '2 hours after last message',
        channel: 'WhatsApp',
        enabled: true,
        sentCount: 48,
        replyRatePct: 44,
        template: 'Hi {{name}}, just checking in from {{business}}! We still have an opening for {{service}} this week. Reply YES and I will hold a spot for you.',
      },
      {
        id: 'fu-2',
        name: 'Same-Day Appointment Reminder',
        trigger: 'Confirmed appointment scheduled today',
        delayLabel: '2 hours before slot',
        channel: 'WhatsApp',
        enabled: true,
        sentCount: 112,
        replyRatePct: 91,
        template: 'Hi {{name}}, looking forward to seeing you at {{business}} today at {{time}} for your {{service}}. Need to reschedule? Just reply here.',
      },
      {
        id: 'fu-3',
        name: 'Post-Visit Review & Care Tip',
        trigger: 'Appointment marked completed',
        delayLabel: '24 hours after visit',
        channel: 'WhatsApp',
        enabled: true,
        sentCount: 86,
        replyRatePct: 38,
        template: 'Thank you for visiting {{business}}, {{name}}! We hope you loved your {{service}}. If you have 30 seconds, a quick Google review helps our local studio grow.',
      },
      {
        id: 'fu-4',
        name: '45-Day Re-Booking Reminder',
        trigger: 'Past haircut, color, or facial client inactive 45 days',
        delayLabel: '45 days post visit',
        channel: 'WhatsApp',
        enabled: false,
        sentCount: 29,
        replyRatePct: 31,
        template: 'Hi {{name}}, it has been about 6 weeks since your last {{service}} at {{business}}. Would you like to book a refresh slot this weekend?',
      },
    ],
    followUpLogs: [
      {
        id: 'ful-1',
        ruleName: 'Same-Day Appointment Reminder',
        recipientName: 'Aarohi Rao',
        recipientPhone: '+91 98452 10944',
        message: `Hi Aarohi, looking forward to seeing you at ${business.name} today at 11:30 AM for your ${business.services[0]?.name}.`,
        sentAt: '09:30 AM',
        outcome: 'Replied',
      },
      {
        id: 'ful-2',
        ruleName: '2-Hour Unbooked Enquiry Nudge',
        recipientName: 'Divya Menon',
        recipientPhone: '+91 97412 55091',
        message: `Hi Divya, we saved a 5:30 PM evening opening for your ${business.services[3]?.name}. Reply YES to confirm.`,
        sentAt: 'Yesterday, 9:51 PM',
        outcome: 'Booked',
      },
      {
        id: 'ful-3',
        ruleName: 'Post-Visit Review & Care Tip',
        recipientName: 'Shruti Hegde',
        recipientPhone: '+91 99450 88712',
        message: `Thank you for visiting ${business.name}, Shruti! Hope you are loving your fresh hair color.`,
        sentAt: 'Yesterday, 4:15 PM',
        outcome: 'Sent',
      },
    ],
    dailyMetrics: [
      { day: 'Fri', enquiries: 19, aiResolved: 16, bookings: 8, revenue: 21400 },
      { day: 'Sat', enquiries: 31, aiResolved: 27, bookings: 15, revenue: 44800 },
      { day: 'Sun', enquiries: 26, aiResolved: 23, bookings: 13, revenue: 39200 },
      { day: 'Mon', enquiries: 14, aiResolved: 14, bookings: 6, revenue: 15600 },
      { day: 'Tue', enquiries: 21, aiResolved: 18, bookings: 9, revenue: 24900 },
      { day: 'Wed', enquiries: 24, aiResolved: 21, bookings: 11, revenue: 31500 },
      { day: 'Thu', enquiries: 28, aiResolved: 24, bookings: 12, revenue: 36400 },
    ],
  };
}

let cachedState: WorkspaceState | null = null;

export function loadState(): WorkspaceState {
  if (cachedState) {
    return cachedState;
  }
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      cachedState = JSON.parse(raw) as WorkspaceState;
      return cachedState;
    }
  } catch {
    // Fall back to fresh seed state if file is unreadable
  }
  cachedState = createSeedState('aurora');
  saveState(cachedState);
  return cachedState;
}

export function saveState(next: WorkspaceState): WorkspaceState {
  next.lastUpdated = new Date().toISOString();
  cachedState = next;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch {
    // Keep in-memory state if disk write fails
  }
  return cachedState;
}

export function resetState(presetKey: string = 'aurora'): WorkspaceState {
  const fresh = createSeedState(presetKey);
  return saveState(fresh);
}
