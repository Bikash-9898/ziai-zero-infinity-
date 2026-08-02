// src/pages/GuestPage.tsx
/**
 * Standalone guest-chat landing page (route: /guest) — a minimal, sign-up-
 * promoting shell (GuestSidebar) around the same ChatPage everyone uses.
 *
 * Reuses GuestGate (the same auto-provisioning used at /client/chat) rather
 * than a separate guest-token store, so a guest session created here is the
 * exact same tokenStore-backed JWT session recognized everywhere else in
 * the app — visiting /client/chat afterward continues the same session
 * instead of starting a second, disconnected one.
 */
import GuestGate from '@/components/GuestGate';
import GuestLayout from '@/components/GuestLayout';

export default function GuestPage() {
  return (
    <div className="h-dvh bg-[#06060c] flex flex-col">
      <GuestGate>
        <GuestLayout />
      </GuestGate>
    </div>
  );
}
