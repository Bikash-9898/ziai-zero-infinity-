// src/pages/ContactPage.tsx
/**
 * Public contact page (route: /contact).
 *
 * Static contact page by design — no form, no submission endpoint. Every
 * detail is read from CONTACT in src/config.ts so the business information can
 * be updated in one place.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  LifeBuoy,
  Briefcase,
  Users,
  Handshake,
  Loader2,
} from 'lucide-react';
import SiteNavbar from '@/components/SiteNavbar';
import SiteShell from '@/components/SiteShell';
import SignInModal from '@/components/SignInModal';
import { CONTACT } from '@/config';
import { useAuth } from '@/context/useAuth';

const CHANNELS = [
  {
    id: 'email',
    icon: Mail,
    label: 'Email us',
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    hint: 'Best for detailed questions, bug reports and anything with attachments.',
  },
  {
    id: 'phone',
    icon: Phone,
    label: 'Call or WhatsApp',
    value: CONTACT.phone,
    href: `tel:${CONTACT.phone.replace(/\s+/g, '')}`,
    hint: 'Available during support hours for urgent account and billing issues.',
  },
  {
    id: 'location',
    icon: MapPin,
    label: 'Where we are',
    value: CONTACT.location,
    hint: 'Remote-first, serving customers across Nepal and beyond.',
  },
  {
    id: 'hours',
    icon: Clock,
    label: 'Support hours',
    value: CONTACT.hours,
    hint: CONTACT.responseTime,
  },
];

const TOPICS = [
  {
    id: 'support',
    icon: LifeBuoy,
    title: 'Technical support',
    copy: 'Something broken, slow or not behaving? Send us the steps and we will dig in.',
  },
  {
    id: 'billing',
    icon: MessageCircle,
    title: 'Billing & payments',
    copy: 'Questions about plans, NPR invoices, eSewa, Khalti, Stripe or wallet top-ups.',
  },
  {
    id: 'sales',
    icon: Briefcase,
    title: 'Sales & pricing',
    copy: 'Evaluating Zero Infinity for a team? Talk to us about volume and plan fit.',
  },
  {
    id: 'partnerships',
    icon: Handshake,
    title: 'Partnerships',
    copy: 'Integrations, reselling, or bringing your own models to the platform.',
  },
  {
    id: 'enterprise',
    icon: Users,
    title: 'Enterprise',
    copy: 'Higher volume, custom limits, priority routing and dedicated onboarding.',
  },
];

export default function ContactPage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <SiteNavbar onSignInClick={() => setIsSignInOpen(true)} accent="violet" />

      <SiteShell
        theme="violet"
        eyebrow="Get In Touch"
        title="Let's talk."
        subtitle="Questions about a plan, a model, or something that isn't working? Pick whichever channel suits you — a human reads all of them."
      >
        {/* ── Contact channels ── */}
        <section aria-label="Contact details" className="mt-14 sm:mt-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const Wrapper = channel.href ? 'a' : 'div';
              return (
                <Wrapper
                  key={channel.id}
                  {...(channel.href ? { href: channel.href } : {})}
                  className={`group flex flex-col rounded-2xl border border-white/10 bg-[#100d20]/65 p-5 backdrop-blur-2xl transition-all duration-300 sm:p-6 ${
                    channel.href
                      ? 'hover:-translate-y-1 hover:border-[#9b8cff]/40 hover:shadow-[0_0_40px_rgba(119,100,255,0.14)]'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#a99cff] to-[#6550ed] shadow-lg shadow-[#7764ff]/25 transition-transform duration-300 group-hover:scale-110">
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        {channel.label}
                      </p>
                      <p
                        className={`truncate text-base font-bold tracking-tight ${
                          channel.href ? 'text-[#c1b8ff] group-hover:underline' : ''
                        }`}
                      >
                        {channel.value}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-400">{channel.hint}</p>
                </Wrapper>
              );
            })}
          </div>
        </section>

        {/* ── Help topics ── */}
        <section aria-label="How we can help" className="mt-16 sm:mt-24">
          <div className="text-center">
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black tracking-tight">
              How can we <span className="text-[#c1b8ff]">help?</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-400">
              Whichever route you take, you'll reach the same small team — no ticket maze.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <div
                  key={topic.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-[#100d20]/65 p-5 backdrop-blur-2xl transition-colors hover:border-white/20"
                >
                  <Icon size={20} className="text-[#c1b8ff]" />
                  <h3 className="mt-3.5 text-base font-bold tracking-tight">{topic.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{topic.copy}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Socials + CTA ── */}
        <section aria-label="Follow and get started" className="mt-16 sm:mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#100d20]/80 px-6 py-12 text-center backdrop-blur-2xl sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-2/3 -translate-x-1/2 rounded-full bg-[#7764ff]/20 blur-[100px]" />

            <div className="relative flex flex-wrap items-center justify-center gap-2.5">
              {CONTACT.socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-[#9b8cff]/40 hover:text-white"
                >
                  {social.name}
                  <span className="ml-1.5 text-xs text-gray-500">{social.handle}</span>
                </a>
              ))}
            </div>

            <p className="relative mx-auto mt-6 max-w-md text-sm leading-relaxed text-gray-400">
              Already have an account and just need access? Head straight to your workspace.
            </p>

            <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  if (loading) return;
                  if (user) navigate('/client');
                  else setIsSignInOpen(true);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-br from-[#a99cff] to-[#6550ed] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#7764ff]/25 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(119,100,255,0.45)] active:scale-95 disabled:opacity-60 sm:w-auto"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : user ? 'Go to dashboard' : 'Sign in'}
              </button>
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/30 active:scale-95 sm:w-auto"
              >
                Email the team
              </a>
            </div>

            <div className="relative mt-7 flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                All systems operational
              </p>
            </div>
          </div>
        </section>
      </SiteShell>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </div>
  );
}
