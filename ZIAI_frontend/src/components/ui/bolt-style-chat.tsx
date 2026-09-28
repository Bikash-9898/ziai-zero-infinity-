'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Plus, Lightbulb, Paperclip, Image, FileCode, X,
  Bolt,
  Loader2
} from 'lucide-react'
import ModelSelector from '@/components/ModelSelector'
import { ShinyButton } from '@/components/ui/shiny-button'

// ATTACH MENU ACTIONS
// All three entries drive one shared hidden <input type="file">. `accept` is
// written straight onto the DOM node before .click() — routing it through
// state would be async and the picker would open with the previous filter.
const ATTACH_ACTIONS = [
  { key: 'file',  icon: Paperclip, label: 'Upload file', accept: undefined },
  { key: 'image', icon: Image,    label: 'Add image',   accept: 'image/*' },
  {
    key: 'code',
    icon: FileCode,
    label: 'Import code',
    accept: '.ts,.tsx,.js,.jsx,.mjs,.cjs,.py,.java,.kt,.swift,.c,.h,.cpp,.hpp,.cs,.go,.rs,.rb,.php,.html,.css,.scss,.json,.yml,.yaml,.sql,.sh,.md',
  },
] as const

// Matches the free-tier cap MessageInput enforces, so the empty state and the
// regular composer agree on how many files a free user may stage.
const MAX_STAGED_FILES = 10

const fileKey = (f: File) => `${f.name}:${f.size}`

// CHAT INPUT
function ChatInput({ onSend, onAttach, placeholder = 'What do you want to build?', attaching = false }: {
  onSend?: (message: string) => void
  onAttach?: (files: File[], message: string) => void
  placeholder?: string
  attaching?: boolean
}) {
  const [message, setMessage] = useState('')
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [limitHit, setLimitHit] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  const openPicker = (accept?: string) => {
    const el = fileInputRef.current;
    if (!el) return;
    el.accept = accept ?? '';
    el.value = ''; // so re-picking the same file still fires a change event
    el.click();
  };

  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setShowAttachMenu(false);
    if (!picked.length) return;
    if (files.length + picked.length > MAX_STAGED_FILES) setLimitHit(true);
    setFiles((prev) => {
      // De-dupe so picking the same file twice doesn't stack copies.
      const seen = new Set(prev.map(fileKey));
      return [...prev, ...picked.filter((f) => !seen.has(fileKey(f)))].slice(0, MAX_STAGED_FILES);
    });
  };

  const removeFile = (f: File) => {
    setLimitHit(false);
    setFiles((prev) => prev.filter((x) => fileKey(x) !== fileKey(f)));
  };

  const canSend = (message.trim().length > 0 || files.length > 0) && !attaching;

  const handleSubmit = () => {
    if (!canSend) return;
    const trimmed = message.trim();
    if (files.length > 0) {
      onAttach?.(files, trimmed);
    } else {
      onSend?.(trimmed);
    }
    setFiles([]);
    setLimitHit(false);
    setMessage('');
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative w-full max-w-[680px] mx-auto">
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
      <div className="relative rounded-2xl bg-[#100d20]/90 ring-1 ring-[#9b8cff]/15 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_2px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
        {/* Single hidden input driven by all three menu entries. */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesPicked}
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 pt-4">
            {files.map((f) => (
              <span
                key={fileKey(f)}
                className="group inline-flex items-center gap-1.5 max-w-full pl-2.5 pr-1.5 py-1 rounded-full bg-white/[0.08] text-[12px] text-[#c9c9ce] border border-white/10"
              >
                {f.type.startsWith('image/') ? (
                  <Image className="size-3.5 shrink-0 text-[#c1b8ff]" />
                ) : (
                  <Paperclip className="size-3.5 shrink-0 text-[#8a8a8f]" />
                )}
                <span className="truncate max-w-[150px]">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f)}
                  aria-label={`Remove ${f.name}`}
                  className="shrink-0 size-4 rounded-full flex items-center justify-center text-[#6a6a6f] hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {limitHit && (
          <p className="px-5 pt-3 text-[11px] text-amber-400/90">
            Up to {MAX_STAGED_FILES} files per message — some were not added.
          </p>
        )}

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent text-[15px] text-white placeholder-[#5a5a5f] px-5 pt-5 pb-3 focus:outline-none min-h-[80px] max-h-[200px]"
            style={{ height: '80px' }}
          />
        </div>

        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="flex items-center justify-center size-8 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-[#8a8a8f] hover:text-white transition-all duration-200 active:scale-95"
              >
                <Plus className={`size-4 transition-transform duration-200 ${showAttachMenu ? 'rotate-45' : ''}`} />
              </button>

              {showAttachMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-2 z-50 bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-1.5 min-w-[180px]">
                      {ATTACH_ACTIONS.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            type="button"
                            key={item.key}
                            onClick={() => openPicker(item.accept)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#a0a0a5] hover:bg-white/5 hover:text-white transition-all duration-150"
                          >
                            <Icon className="size-4" />
                            <span className="text-sm">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            <ModelSelector />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-[#6a6a6f] hover:text-white hover:bg-white/5 transition-all duration-200">
              <Lightbulb className="size-4" />
              <span className="hidden sm:inline">Plan</span>
            </button>

            <ShinyButton
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              highlightColor="#c1b8ff"
              className="inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(119,100,255,0.3)] [--shiny-cta-padding:8px_16px] [--shiny-cta-font-size:14px] [--shiny-cta-bg:#6550ed]"
            >
              <span className="inline">{attaching ? 'Uploading…' : 'Build now'}</span>
              {attaching && <Loader2 className="size-4 animate-spin" />}
            </ShinyButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// Ray Background
function RayBackground() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-[#030308]" />
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[4000px] h-[1800px] sm:w-[6000px]"
        style={{
          background: 'radial-gradient(circle at center 800px, rgba(163, 148, 255, 0.82) 0%, rgba(112, 91, 255, 0.58) 14%, rgba(91, 66, 236, 0.32) 18%, rgba(91, 66, 236, 0.12) 22%, rgba(3, 3, 8, 0.2) 25%)'
        }}
      />
      <div
        className="absolute top-[175px] left-1/2 w-[1600px] h-[1600px] sm:top-1/2 sm:w-[3043px] sm:h-[2865px]"
        style={{ transform: 'translate(-50%) rotate(180deg)' }}
      >
        <div className="absolute w-full h-full rounded-full -mt-[13px]" style={{ background: 'radial-gradient(43.89% 25.74% at 50.02% 97.24%, #080612 0%, #030308 100%)', border: '16px solid white', transform: 'rotate(180deg)', zIndex: 5 }} />
        <div className="absolute w-full h-full rounded-full bg-[#030308] -mt-[11px]" style={{ border: '23px solid #c1b8ff', transform: 'rotate(180deg)', zIndex: 4 }} />
        <div className="absolute w-full h-full rounded-full bg-[#030308] -mt-[8px]" style={{ border: '23px solid #a99cff', transform: 'rotate(180deg)', zIndex: 3 }} />
        <div className="absolute w-full h-full rounded-full bg-[#030308] -mt-[4px]" style={{ border: '23px solid #7764ff', transform: 'rotate(180deg)', zIndex: 2 }} />
        <div className="absolute w-full h-full rounded-full bg-[#030308]" style={{ border: '20px solid #4938b8', boxShadow: '0 -15px 24.8px rgba(119, 100, 255, 0.6)', transform: 'rotate(180deg)', zIndex: 1 }} />
      </div>
    </div>
  )
}

// ANNOUNCEMENT BADGE COMPONENT
function AnnouncementBadge({ text, href = '#' }: { text: string; href?: string }) {
  const content = (
    <>
      <span className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none opacity-70 mix-blend-overlay" style={{ background: 'radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.15) 0%, transparent 70%)' }} />
      <span className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-[100px] opacity-60" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(37, 119, 255, 0.8) 20%, rgba(126, 93, 225, 0.8) 50%, rgba(59, 130, 246, 0.8) 80%, transparent 100%)', filter: 'blur(0.5px)' }} />
      <Bolt className="size-4 relative z-10 text-white" />
      <span className="relative z-10 text-white font-medium">{text}</span>
    </>
  )

  const className = 'relative inline-flex items-center gap-2 px-5 py-2 min-h-[40px] rounded-full text-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
  const style = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
    backdropFilter: 'blur(20px) saturate(140%)',
    boxShadow: 'inset 0 1px rgba(255,255,255,0.2), inset 0 -1px rgba(0,0,0,0.1), 0 8px 32px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)'
  }

  return href !== '#' ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>{content}</a>
  ) : (
    <button type="button" className={className} style={style}>{content}</button>
  )
}

// MAIN BOLT CHAT COMPONENT
interface BoltChatProps {
  title?: string
  subtitle?: string
  announcementText?: string
  announcementHref?: string
  placeholder?: string
  showInput?: boolean
  onSend?: (message: string) => void
  /** Called with the staged files plus any typed text. Without it the attach
   *  menu has nowhere to send the selection, so wire this alongside onSend. */
  onAttach?: (files: File[], message: string) => void
  /** True while the parent uploads — swaps the CTA to a spinner. */
  attaching?: boolean
}

export function BoltStyleChat({
  title = 'What will you',
  subtitle = 'Create stunning apps & websites by chatting with AI.',
  announcementText = 'Introducing Bolt V2',
  announcementHref = '#',
  placeholder = 'What do you want to build?',
  showInput = true,
  onSend,
  onAttach,
  attaching = false
}: BoltChatProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[#030308]">
      <RayBackground />
      <div className="absolute top-[70px]">
        <AnnouncementBadge text={announcementText} href={announcementHref} />
      </div>

      <div className="absolute top-[66%] left-1/2 sm:top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-full h-full overflow-hidden px-4">
        <div className="text-center mb-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-1">
            {title}{' '}
            <span className="bg-gradient-to-b from-[#c1b8ff] via-[#a99cff] to-white bg-clip-text text-transparent italic">
              build
            </span>
            {' '}today?
          </h1>
          <p className="text-base font-semibold sm:text-lg text-[#8a8a8f]">{subtitle}</p>
        </div>

        {showInput && (
          <div className="w-full max-w-[700px] mb-6 sm:mb-8 mt-2">
            <ChatInput
              placeholder={placeholder}
              onSend={onSend}
              onAttach={onAttach}
              attaching={attaching}
            />
          </div>
        )}
      </div>
    </div>
  )
}
