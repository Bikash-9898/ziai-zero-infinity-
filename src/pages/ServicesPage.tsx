// src/pages/ServicesPage.tsx
/**
 * Public services page (route: /services).
 *
 * Every card below maps to something that actually ships in this app — the
 * model names, tiers, payment gateways and routes are taken from
 * app/services/model_service.py, image_model_service.py, the sidebar nav and
 * the plan tiers in the billing schema, so the page can't drift into
 * advertising features that don't exist.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Image as ImageIcon,
  Archive,
  Mic,
  CreditCard,
  ShieldCheck,
  Check,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import SiteNavbar from '@/components/SiteNavbar';
import SiteShell from '@/components/SiteShell';
import SignInModal from '@/components/SignInModal';
import { useAuth } from '@/context/useAuth';

interface Service {
  id: string;
  icon: typeof MessageSquare;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  /** In-app destination, if the service is reachable without leaving the flow. */
  path: string;
}

const SERVICES: Service[] = [
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'AI Chat Agent',
    tagline: 'Frontier chat across five providers',
    description:
      'One conversation, many minds. Pick a specific model or let Auto route each turn to the tier that fits — fast for quick answers, flagship for hard reasoning.',
    features: [
      'OpenAI, Anthropic, Google, NVIDIA & Hugging Face models',
      'Auto-routing across Fast, Balanced and Flagship tiers',
      'Vision — attach images and let capable models read them',
      'Web-search grounding via Tavily, SerpAPI or Serper',
      'Streamed Markdown replies with saved conversation history',
    ],
    path: '/client/chat',
  },
  {
    id: 'image',
    icon: ImageIcon,
    title: 'Image Generation',
    tagline: 'Text to image, production ready',
    description:
      'Turn a sentence into a usable asset. Every generation is metered in credits, kept in your history and one click away from being downloaded.',
    features: [
      'FLUX.1, FLUX.1-schnell and Stable Diffusion 3.5 Large',
      'Square (1:1) and widescreen (16:9) output',
      'Live waveform-free progress with per-model credit cost',
      'Generation history gallery with preview and download',
    ],
    path: '/client/image',
  },
  {
    id: 'library',
    icon: Archive,
    title: 'Library',
    tagline: 'Your files, one workspace',
    description:
      'Upload documents and images once and keep them close at hand for the sessions that need them, without re-uploading on every project.',
    features: [
      'Multi-file upload in a single drop',
      'Organised by category with size and type details',
      'Reuse assets across chat and image sessions',
      'Delete anything you no longer need',
    ],
    path: '/client/library',
  },
  {
    id: 'voice',
    icon: Mic,
    title: 'Voice',
    tagline: 'Talk instead of typing',
    description:
      'Speak your prompt, hear the answer back. Voice input captures your words as you say them, and the reply is read aloud automatically.',
    features: [
      'Speech-to-text input with a live audio waveform',
      'Text-to-speech replies',
      'Hands-free conversation mode',
      'Barge-in — talk over the reply to interrupt it',
    ],
    path: '/client/chat',
  },
  {
    id: 'billing',
    icon: CreditCard,
    title: 'Billing & Plans',
    tagline: 'Pay the way Nepal does',
    description:
      'Transparent NPR pricing with no hidden fees. Top up a wallet or subscribe, and watch tokens, requests and spend in real time.',
    features: [
      'Free, Basic, Pro and Enterprise tiers',
      'eSewa, Khalti and Stripe checkout',
      'Wallet top-up for pay-as-you-go usage',
      'Live usage, token and spend dashboards',
    ],
    path: '/plans',
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    title: 'Platform Operations',
    tagline: 'Run the whole thing yourself',
    description:
      'The admin console behind Zero Infinity. Add models, set prices, control which plans can reach which model, and keep an eye on users and revenue.',
    features: [
      'Model registry for chat and image models',
      'Per-model pricing and plan limits',
      'Guest-model access rules',
      'User, profit and usage oversight',
    ],
    path: '/admin',
  },
];

const TIER_STEPS = [
  {
    title: 'Free',
    price: 'NPR 0',
    copy: 'Enough to evaluate the whole platform — chat, images and a small monthly allowance.',
  },
  {
    title: 'Basic',
    price: 'Entry tier',
    copy: 'For daily individual use, with a bigger token and request ceiling.',
  },
  {
    title: 'Pro',
    price: 'Most popular',
    copy: 'For power users who hit the Free limits regularly and want faster models.',
  },
  {
    title: 'Enterprise',
    price: 'Custom limits',
    copy: 'For teams and organisations that need higher volume and priority access.',
  },
];

export default function ServicesPage() {
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (!user) {
      setIsSignInOpen(true);
      return;
    }
    navigate('/client');
  };

  return (
    <div>
      <SiteNavbar onSignInClick={() => setIsSignInOpen(true)} accent="violet" />

      <SiteShell
        theme="violet"
        eyebrow="What We Build"
        title="One platform."
        subtitle="Chat, images, documents and voice — running on the model providers you already trust, metered in Nepali Rupees and billed the local way."
      >
        {/* ── Services grid ── */}
        <section aria-label="Services" className="mt-14 sm:mt-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  key={service.id}
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#100d20]/65 p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#9b8cff]/40 hover:shadow-[0_0_40px_rgba(119,100,255,0.14)] sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#a99cff] to-[#6550ed] shadow-lg shadow-[#7764ff]/25 transition-transform duration-300 group-hover:scale-110">
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight">{service.title}</h2>
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-[#c1b8ff]">
                        {service.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-gray-400">{service.description}</p>

                  <ul className="mt-5 flex flex-col gap-2.5">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-300">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#9b8cff]/15">
                          <Check size={11} className="text-[#c1b8ff]" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={handleGetStarted}
                    className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-white transition-colors hover:text-[#c1b8ff]"
                  >
                    Try {service.title}
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Plan tiers ── */}
        <section aria-label="Plan tiers" className="mt-16 sm:mt-24">
          <div className="text-center">
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] font-black tracking-tight">
              Pick a tier, <span className="text-[#c1b8ff]">keep the difference.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-400">
              Four plans, priced in Nepali Rupees and billed monthly. No hidden fees — upgrade,
              downgrade or cancel whenever you like.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TIER_STEPS.map((tier, index) => (
              <div
                key={tier.title}
                className={`rounded-2xl border p-5 transition-colors ${
                  index === 2
                    ? 'border-[#9b8cff]/40 bg-[#9b8cff]/8'
                    : 'border-white/10 bg-[#100d20]/65'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold">{tier.title}</h3>
                  {index === 2 && (
                    <span className="rounded-full bg-[#9b8cff]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c1b8ff]">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                  {tier.price}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{tier.copy}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section aria-label="Get started" className="mt-16 sm:mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#100d20]/80 px-6 py-12 text-center backdrop-blur-2xl sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-2/3 -translate-x-1/2 rounded-full bg-[#7764ff]/20 blur-[100px]" />
            <h2 className="relative text-[clamp(1.5rem,4vw,2.5rem)] font-black tracking-tight">
              Ready to build something?
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-400">
              Create a free account and put the whole suite to work — no card required to get
              started.
            </p>
            <div className="relative mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleGetStarted}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-br from-[#a99cff] to-[#6550ed] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#7764ff]/25 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(119,100,255,0.45)] active:scale-95 disabled:opacity-60 sm:w-auto"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Get Started Free'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/plans')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-white/30 active:scale-95 sm:w-auto"
              >
                Compare plans
              </button>
            </div>
          </div>
        </section>
      </SiteShell>

      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </div>
  );
}
