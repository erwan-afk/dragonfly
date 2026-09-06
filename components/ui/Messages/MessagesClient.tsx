'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button/Button';

interface ApiUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface ApiBoat {
  id: string;
  model: string;
  photos: string[];
  status: string;
}

interface ApiMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

interface ApiConversation {
  id: string;
  boat: ApiBoat | null;
  otherUser: ApiUser;
  lastMessage: ApiMessage | null;
  unreadCount: number;
  lastMessageAt: string;
}

const CONVERSATIONS_POLL_MS = 20000;
const MESSAGES_POLL_MS = 6000;

function initials(name: string | null) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ name, small }: { name: string | null; small?: boolean }) {
  return (
    <div
      className={`${small ? 'w-32 h-32 text-12' : 'w-40 h-40 text-14'} rounded-full bg-articblue text-fullwhite flex items-center justify-center font-medium shrink-0`}
    >
      {initials(name)}
    </div>
  );
}

export default function MessagesClient({
  currentUserId,
  initialConversationId
}: {
  currentUserId: string;
  initialConversationId?: string;
}) {
  const [conversations, setConversations] = useState<ApiConversation[] | null>(
    null
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [mobileThreadOpen, setMobileThreadOpen] = useState(
    !!initialConversationId
  );
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [moreMenuOpen]);

  // Lock page-level scroll on mobile (desktop keeps normal page scroll —
  // the footer is still shown there).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    function apply() {
      document.body.style.overflow = mq.matches ? 'hidden' : '';
    }
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      document.body.style.overflow = '';
    };
  }, []);

  // `100dvh` is unreliable on real mobile browsers: it changes live as the
  // address bar/toolbar collapses on scroll, which was making the panel
  // (and the gap below the last message) visibly grow mid-scroll. Track the
  // actual visual viewport height in JS instead and feed it in as a CSS
  // variable — this updates on every real resize (toolbar show/hide,
  // on-screen keyboard) without depending on dvh support.
  useEffect(() => {
    function setViewportHeight() {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        '--viewport-height',
        `${height}px`
      );
    }
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.visualViewport?.addEventListener('resize', setViewportHeight);
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.visualViewport?.removeEventListener('resize', setViewportHeight);
    };
  }, []);

  const fetchConversations = useCallback(async () => {
    const res = await fetch('/api/messages/conversations');
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
  }, []);

  const fetchBlocked = useCallback(async () => {
    const res = await fetch('/api/messages/block');
    if (!res.ok) return;
    const data = await res.json();
    setBlockedUserIds(new Set<string>(data.blockedUserIds));
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(
      `/api/messages/conversations/${conversationId}/messages`
    );
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
  }, []);

  // Initial load. `/messages/[conversationId]` (deep link from the "Contact
  // seller" button or an email notification) keeps its URL — replacing it
  // with `/messages` would navigate to a different route and remount this
  // component, dropping the just-opened thread.
  useEffect(() => {
    fetchConversations();
    fetchBlocked();
    if (initialConversationId) {
      fetchMessages(initialConversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the conversation list for unread counts / new conversations.
  useEffect(() => {
    const interval = setInterval(fetchConversations, CONVERSATIONS_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Poll the open thread for new messages.
  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(
      () => fetchMessages(selectedId),
      MESSAGES_POLL_MS
    );
    return () => clearInterval(interval);
  }, [selectedId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const selected = conversations?.find((c) => c.id === selectedId) || null;

  function openConversation(id: string) {
    setSelectedId(id);
    setMobileThreadOpen(true);
    setMoreMenuOpen(false);
    fetchMessages(id);
    setConversations(
      (prev) =>
        prev?.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)) || prev
    );
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !selectedId || sending) return;
    const body = draft.trim();
    setDraft('');
    setSending(true);
    try {
      const res = await fetch(
        `/api/messages/conversations/${selectedId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body })
        }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        fetchConversations();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleToggleBlock(userId: string) {
    const isBlocked = blockedUserIds.has(userId);
    if (isBlocked) {
      await fetch(`/api/messages/block?userId=${userId}`, {
        method: 'DELETE'
      });
    } else {
      await fetch('/api/messages/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    }
    fetchBlocked();
  }

  async function handleReport(conversationId: string) {
    const reason =
      typeof window !== 'undefined'
        ? window.prompt('Why are you reporting this conversation? (optional)')
        : '';
    const res = await fetch(
      `/api/messages/conversations/${conversationId}/report`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || '' })
      }
    );
    if (res.ok) {
      setReportedIds((prev) => new Set(prev).add(conversationId));
    }
  }

  if (conversations !== null && conversations.length === 0) {
    return (
      <section className="mx-auto max-w-screen-xl mb-16 lg:mb-[120px] px-8 sm:px-16 xl:px-0">
        <h1 className="text-24 text-oceanblue font-medium mb-16">Messages</h1>
        <div className="bg-lightgrey rounded-16 h-[calc(var(--viewport-height,100dvh)-220px)] lg:h-[640px] flex flex-col items-center justify-center text-center px-16">
          <h2 className="text-20 font-medium text-darkgrey mb-8">
            Welcome to your messages!
          </h2>
          <p className="text-14 text-stonegrey max-w-[420px] mb-24">
            Simple and fast — chat directly with buyers and sellers on
            3Hulls. A conversation always starts from a listing, by clicking
            &quot;Send a message&quot;.
          </p>
          <Button
            text="Place an ad"
            href="/list-boat"
            icon="add"
            bgColor="bg-articblue"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-screen-xl mb-16 lg:mb-[120px] px-8 sm:px-16 xl:px-0">
      <h1 className="text-24 text-oceanblue font-medium mb-16">Messages</h1>

      <div className="bg-lightgrey rounded-16 overflow-hidden flex h-[calc(var(--viewport-height,100dvh)-220px)] lg:h-[640px]">
        {/* Conversation list */}
        <div
          className={`w-full lg:w-[260px] shrink-0 border-r border-stonegrey/20 bg-fullwhite flex-col ${
            mobileThreadOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex-1 overflow-y-auto">
            {conversations === null ? (
              <p className="text-14 text-stonegrey p-16">Loading...</p>
            ) : (
              conversations.map((c) => {
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`w-full text-left px-16 py-[12px] flex gap-8 items-center border-b border-stonegrey/10 transition-colors ${
                      active ? 'bg-lightgrey' : 'hover:bg-lightgrey/60'
                    }`}
                  >
                    <Avatar name={c.otherUser.name} small />
                    <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-14 font-medium truncate text-darkgrey">
                          {c.otherUser.name || 'User'}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="w-16 h-16 rounded-full bg-articblue text-fullwhite text-[11px] flex items-center justify-center shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stonegrey truncate leading-tight">
                        {c.lastMessage?.body}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread */}
        <div
          className={`flex-1 min-w-0 flex-col bg-fullwhite ${
            mobileThreadOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-stonegrey text-14">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="px-16 lg:px-24 py-16 border-b border-stonegrey/20 flex items-center justify-between gap-8">
                <div className="flex items-center gap-8 lg:gap-12 min-w-0 flex-1">
                  <button
                    onClick={() => setMobileThreadOpen(false)}
                    aria-label="Back"
                    className="lg:hidden text-20 text-oceanblue shrink-0"
                  >
                    ←
                  </button>
                  <Avatar name={selected.otherUser.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-14 lg:text-16 font-medium text-darkgrey truncate">
                      {selected.otherUser.name || 'User'}
                    </p>
                    <p className="text-[11px] lg:text-12 text-stonegrey truncate">
                      {selected.boat?.model || 'Listing removed'}
                    </p>
                  </div>
                </div>
                <div className="relative shrink-0" ref={moreMenuRef}>
                  <button
                    onClick={() => setMoreMenuOpen((v) => !v)}
                    aria-label="More options"
                    className="w-32 h-32 flex items-center justify-center rounded-full text-stonegrey hover:bg-lightgrey hover:text-darkgrey text-20 leading-none"
                  >
                    ⋯
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute right-0 top-[38px] z-20 min-w-[140px] bg-fullwhite border border-stonegrey/20 rounded-12 shadow-[0_4px_16px_rgba(0,0,0,0.15)] py-8">
                      <button
                        onClick={() => {
                          handleToggleBlock(selected.otherUser.id);
                          setMoreMenuOpen(false);
                        }}
                        className="w-full text-left px-16 py-8 text-14 text-darkgrey hover:bg-lightgrey"
                      >
                        {blockedUserIds.has(selected.otherUser.id)
                          ? 'Unblock'
                          : 'Block'}
                      </button>
                      <button
                        onClick={() => {
                          handleReport(selected.id);
                          setMoreMenuOpen(false);
                        }}
                        disabled={reportedIds.has(selected.id)}
                        className="w-full text-left px-16 py-8 text-14 text-darkgrey hover:bg-lightgrey disabled:opacity-40"
                      >
                        {reportedIds.has(selected.id) ? 'Reported' : 'Report'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 overflow-y-auto p-16 pb-[76px] lg:p-24 flex flex-col gap-8">
                {messages.map((m) => {
                  const mine = m.senderId === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[75%] lg:max-w-[65%] px-16 py-8 rounded-16 text-14 whitespace-pre-wrap break-words ${
                        mine
                          ? 'self-end bg-articblue text-fullwhite'
                          : 'self-start bg-lightgrey text-darkgrey'
                      }`}
                    >
                      {m.body}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="fixed lg:static bottom-0 inset-x-0 lg:inset-x-auto z-30 bg-fullwhite p-16 border-t border-stonegrey/20 flex gap-8"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message..."
                  maxLength={2000}
                  disabled={blockedUserIds.has(selected.otherUser.id)}
                  className="flex-1 border border-stonegrey/30 rounded-[100px] px-16 py-8 text-14 text-darkgrey placeholder:text-stonegrey outline-none focus:border-articblue disabled:opacity-50"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={
                    sending ||
                    !draft.trim() ||
                    blockedUserIds.has(selected.otherUser.id)
                  }
                  className="bg-articblue text-fullwhite w-40 h-40 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
