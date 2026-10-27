"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Menu,
  MessageSquarePlus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "./ui/button";
import { SesameLogo } from "./sesame-logo";
import { ProductCard } from "./product-card";
import { ManageStylesDialog } from "./manage-styles-dialog";
import { cn, formatDate, formatTime } from "@/lib/utils";
import type { AnswerStyleDto, ChatMessage, ChatSummary, ProductDto } from "./types";

const TOPICS = [
  "What is halva made of?",
  "Which flavour should I choose?",
  "Allergens and diet",
  "How to store and serve halva?",
];

const NETWORK_ERROR = "Halvi can't reach the server right now. Please check your connection and try again.";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? NETWORK_ERROR);
  return data as T;
}

export default function ChatApp() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [styles, setStyles] = useState<AnswerStyleDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [style, setStyle] = useState("Simple");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadChats = useCallback(async () => {
    setChats(await api<ChatSummary[]>("/api/chats"));
  }, []);

  const loadStyles = useCallback(async () => {
    const list = await api<AnswerStyleDto[]>("/api/styles");
    setStyles(list);
    setStyle((cur) => (list.some((s) => s.name === cur) ? cur : list[0]?.name ?? cur));
  }, []);

  useEffect(() => {
    Promise.all([
      loadChats(),
      loadStyles(),
      api<ProductDto[]>("/api/products").then(setProducts),
    ]).catch((e: Error) => setError(e.message));
  }, [loadChats, loadStyles]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function openChat(id: string) {
    setSidebarOpen(false);
    setError(null);
    try {
      const chat = await api<ChatSummary & { messages: ChatMessage[] }>(`/api/chats/${id}`);
      setActiveId(id);
      setMessages(chat.messages);
      if (chat.style) setStyle(chat.style);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function newChat() {
    setSidebarOpen(false);
    setError(null);
    try {
      const chat = await api<ChatSummary>("/api/chats", {
        method: "POST",
        body: JSON.stringify({ style }),
      });
      setActiveId(chat.id);
      setMessages([]);
      await loadChats();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function deleteChat(id: string) {
    try {
      await api(`/api/chats/${id}`, { method: "DELETE" });
      if (id === activeId) {
        setActiveId(null);
        setMessages([]);
      }
      await loadChats();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function clearChat() {
    if (!activeId) return;
    try {
      await api(`/api/chats/${activeId}?clear=1`, { method: "DELETE" });
      setMessages([]);
      await loadChats();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || typing) return;
    setError(null);
    setInput("");

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      productIds: [],
    };
    setMessages((m) => [...m, optimistic]);
    setTyping(true);

    try {
      let id = activeId;
      if (!id) {
        const chat = await api<ChatSummary>("/api/chats", {
          method: "POST",
          body: JSON.stringify({ style }),
        });
        id = chat.id;
        setActiveId(id);
      }
      const res = await api<{ title: string; messages: ChatMessage[] }>(`/api/chats/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text, style }),
      });
      setMessages((m) => [...m.filter((x) => x.id !== optimistic.id), ...res.messages]);
      await loadChats();
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setInput(text);
      setError((e as Error).message);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-white text-gray-800">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-gray-200 bg-gray-50 transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Chat History</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {chats.length === 0 && <p className="px-2 text-sm text-gray-400">No chats yet.</p>}
          {chats.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-3 py-2 hover:bg-sesame/60",
                c.id === activeId && "bg-sesame"
              )}
            >
              <button className="min-w-0 flex-1 text-left" onClick={() => openChat(c.id)}>
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="text-xs text-gray-500">{formatDate(c.updatedAt)}</p>
              </button>
              <button
                aria-label={`Delete chat ${c.title}`}
                className="rounded-md p-1 text-gray-400 opacity-100 hover:bg-white hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                onClick={() => deleteChat(c.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </nav>
        <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 p-3">
          <Button className="w-full" onClick={newChat}>
            <MessageSquarePlus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-3 shadow-soft sm:px-5">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <SesameLogo className="h-8 w-8 shrink-0" />
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">
            Halvi – your halva guide
          </h1>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="secondary" size="sm" aria-label="Answer style">
                <span className="hidden text-gray-500 sm:inline">Answer style:</span>
                <span className="max-w-[7rem] truncate">{style}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={6}
                className="z-50 min-w-[12rem] rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
              >
                {styles.map((s) => (
                  <DropdownMenu.Item
                    key={s.id}
                    onSelect={() => setStyle(s.name)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-sesame"
                  >
                    {s.name}
                    {s.name === style && <Check className="h-4 w-4 text-caramel" />}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <ManageStylesDialog styles={styles} onChanged={loadStyles} onError={setError} />
        </header>

        {error && (
          <div role="alert" className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/60 px-3 py-4 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 0 && !typing ? (
              <div className="flex flex-col items-center py-10 text-center">
                <SesameLogo className="h-16 w-16" />
                <h2 className="mt-4 text-2xl font-semibold">Hello, I&apos;m Halvi!</h2>
                <p className="mt-2 max-w-md text-gray-600">
                  Your friendly halva guide. Ask me about ingredients, flavours, allergens or how to
                  store and serve halva.
                </p>
                <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                  {TOPICS.map((t) => (
                    <button
                      key={t}
                      onClick={() => sendMessage(t)}
                      className="rounded-lg border border-sesame bg-sesame-light px-4 py-3 text-left text-sm font-medium text-caramel-dark shadow-soft transition hover:bg-sesame"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <MessageBubble key={m.id} message={m} products={products} />
              ))
            )}
            {typing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex gap-1 rounded-lg bg-gray-200 px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-gray-500"
                      style={{ animation: `bounce-dot 1.2s ${i * 0.15}s infinite` }}
                    />
                  ))}
                </span>
                Halvi is typing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <footer className="border-t border-gray-200 bg-white px-3 py-3 sm:px-6">
          <form
            className="mx-auto flex max-w-3xl items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask about our halva..."
              className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20"
            />
            <Button type="button" variant="secondary" onClick={clearChat} disabled={!activeId || messages.length === 0 || typing}>
              Clear Chat
            </Button>
            <Button type="submit" disabled={!input.trim() || typing}>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </footer>
      </main>
    </div>
  );
}

function MessageBubble({ message: m, products }: { message: ChatMessage; products: ProductDto[] }) {
  const isUser = m.role === "user";
  const cards = m.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is ProductDto => Boolean(p));

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm shadow-soft",
          isUser ? "bg-caramel text-white" : "bg-gray-200 text-gray-900"
        )}
      >
        {m.content}
      </div>
      {cards.length > 0 && (
        <div className="mt-2 grid w-full gap-2 sm:grid-cols-2">
          {cards.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      <span className="mt-1 text-[11px] text-gray-400">{formatTime(m.createdAt)}</span>
    </div>
  );
}
