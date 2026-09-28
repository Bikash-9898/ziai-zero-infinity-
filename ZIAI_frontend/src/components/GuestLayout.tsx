import { useState } from 'react';
import GuestSidebar from './GuestSidebar';
import ChatPage from '../pages/ChatPage';
import { ChatProvider } from '../store/chatStore';
import SignInModal from './SignInModal';

interface GuestLayoutProps {
  onClose?: () => void;
}

export default function GuestLayout({ onClose }: GuestLayoutProps) {
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  return (
    <ChatProvider>
      <div className="flex h-dvh bg-[#212121] text-slate-100 font-sans overflow-hidden">
        <GuestSidebar 
          onClose={onClose} 
          onOpenSignIn={() => setIsSignInOpen(true)} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPage />
        </div>
      </div>
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </ChatProvider>
  );
}