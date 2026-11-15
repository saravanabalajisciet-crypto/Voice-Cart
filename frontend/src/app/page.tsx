
"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  size: string;
  price: number;
  stock: number;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
  }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const suggestions = [
  "₹1000 க்குள் Cooker வேண்டும்",
  "ஒரு நல்ல Mixer வேண்டும்",
  "சிறந்த Fan பரிந்துரைக்கவும்",
];

const categories = [
  { name: "Cookers", tamil: "குக்கர்", category: "cooker", icon: "🍲", color: "bg-[#F4E1D3]" },
  { name: "Mixers", tamil: "மிக்ஸி", category: "mixer", icon: "🥣", color: "bg-[#E9E5D9]" },
  { name: "Fans", tamil: "மின்விசிறி", category: "fan", icon: "🌀", color: "bg-[#E9E2D8]" },
  { name: "Kitchen", tamil: "சமையலறை", category: "rice cooker", icon: "🏡", color: "bg-[#F0DFD5]" },
];

function getProductIcon(category: string) {
  if (category.includes("cooker")) return "🍲";
  if (category.includes("mixer")) return "🥣";
  if (category.includes("fan")) return "🌀";
  return "🛍️";
}

function detectCategory(message: string) {
  const text = message.toLowerCase();

  if (text.includes("rice cooker") || text.includes("ரைஸ் குக்கர்")) {
    return "rice cooker";
  }
  if (text.includes("cooker") || text.includes("குக்கர்")) {
    return "cooker";
  }
  if (text.includes("mixer") || text.includes("மிக்ஸி")) {
    return "mixer";
  }
  if (text.includes("fan") || text.includes("மின்விசிறி")) {
    return "fan";
  }

  return "";
}

function detectBudget(message: string) {
  const match =
    message.match(/₹\s?([\d,]+)/) ||
    message.match(/(\d[\d,]*)\s?ரூபா/);

  if (!match) return undefined;

  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : undefined;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const sendLockRef = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [demoOrderId, setDemoOrderId] = useState("");

  useEffect(() => {
    let id = sessionStorage.getItem("voicecart_session");

    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("voicecart_session", id);
    }

    setSessionId(id);
  }, []);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
    };
  }, []);

  async function loadProducts(category: string, maxPrice?: number) {
    setProductsLoading(true);
    setProductError("");
    setActiveCategory(category);

    try {
      const params = new URLSearchParams({ category });

      if (maxPrice !== undefined) {
        params.set("max_price", String(maxPrice));
      }

      const response = await fetch(
        `${API_URL}/products?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Product loading failed");
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch {
      setProductError(
        "Products load ஆகவில்லை. Backend running-ல் இருக்கிறதா என்று பாருங்கள்."
      );
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  function speakReply(text: string) {
    if (!voiceOutput || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ta-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const tamilVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("ta"));

    if (tamilVoice) utterance.voice = tamilVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage(text: string) {
    const message = text.trim();

    if (!message || sendLockRef.current || !sessionId) return;
    sendLockRef.current = true;

    setInput("");
    setError("");

    setMessages((previous) => [
      ...previous,
      { role: "user", text: message },
    ]);

    setLoading(true);

    const category = detectCategory(message);
    const budget = detectBudget(message);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to connect to VoiceCart AI.");
      }

      const data = await response.json();

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply },
      ]);

      speakReply(data.reply);

      if (category) {
        await loadProducts(category, budget);
      }
    } catch {
      setError(
        "VoiceCart AI-ஐ connect செய்ய முடியவில்லை. Backend running-ல் இருக்கிறதா என்று பாருங்கள்."
      );
    } finally {
      setLoading(false);
      sendLockRef.current = false;
    }
  }

  function startVoiceInput() {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }

    const browser = window as SpeechWindow;
    const SpeechRecognition =
      browser.SpeechRecognition || browser.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Please use Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "ta-IN";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript?.trim();

      if (transcript) {
        setInput(transcript);
        // Automatically send the recognised speech; the customer
        // does not need to press the Send button.
        void sendMessage(transcript);
      }
    };

    recognition.onerror = () => {
      setError("Voice input failed. Please try again.");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    setListening(true);
    setError("");
    recognition.start();
  }

  function addToCart(product: Product) {
    setCart((previous) => {
      const existing = previous.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return previous.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.stock),
              }
            : item
        );
      }

      return [...previous, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, change: number) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.min(
                  item.product.stock,
                  item.quantity + change
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((previous) =>
      previous.filter((item) => item.product.id !== productId)
    );
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  function placeDemoOrder() {
    if (!address.trim() || cart.length === 0) return;

    setDemoOrderId(
      "VC-" + Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    setOrderPlaced(true);
    setCart([]);
  }

  function resetCheckout() {
    setCheckoutOpen(false);
    setOrderPlaced(false);
    setAddress("");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5EDE3] text-[#342923]">

      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-[#E9DCCF] bg-[#F5EDE3]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-7 lg:px-10">

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#A64B35] text-white shadow-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                <path d="M3 8h18l-2 12H5L3 8Z" />
                <path d="M8 8a4 4 0 0 1 8 0" />
              </svg>
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                VoiceCart<span className="text-[#A64B35]">.</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#92796B]">
                Shopping made simple
              </p>
            </div>
          </div>

          <button
            onClick={() => setCheckoutOpen(true)}
            className="flex items-center gap-2 rounded-full bg-[#A64B35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#853A29]"
          >
            <span>🛒</span>
            Cart
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#A64B35]">
              {cartCount}
            </span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-7 px-4 py-7 sm:px-7 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:px-10 lg:py-12">

        {/* LEFT: HERO AND VOICE */}
        <div className="flex flex-col">

          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#E7D2C3] bg-[#F9E8DE] px-4 py-2">
            <span className="text-sm">✦</span>
            <span className="text-[10px] font-bold tracking-[0.16em] text-[#A64B35] sm:text-xs">
              YOUR PERSONAL SHOPPING COMPANION
            </span>
          </div>

          <h2 className="text-4xl font-extrabold leading-[1.2] tracking-tight sm:text-5xl lg:text-6xl">
            வணக்கம்!
            <br />
            <span className="text-[#A64B35]">
              என்ன வாங்கணும்?
            </span>
          </h2>

          <p className="mt-5 max-w-lg text-sm leading-7 text-[#806D60] sm:text-base">
            No complicated apps. No confusing buttons.
            Just speak naturally in Tamil. We'll help you
            discover, compare and choose what you need.
          </p>

          {/* VOICE CARD */}
          <div className="relative mt-8 overflow-hidden rounded-[2rem] bg-[#A64B35] p-6 text-white shadow-xl sm:p-9">
            <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute -right-5 -top-9 h-32 w-32 rounded-full border border-white/10" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <p className="text-xs font-semibold tracking-[0.2em] text-white/75">
                TALK TO VOICECART
              </p>

              <button
                onClick={startVoiceInput}
                disabled={loading}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                className={`mt-6 flex h-24 w-24 items-center justify-center rounded-full border-[6px] border-white/20 bg-[#F5EDE3] text-[#A64B35] shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-50 sm:h-28 sm:w-28 ${
                  listening ? "animate-pulse scale-105" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-10 w-10 sm:h-12 sm:w-12">
                  <rect x="9" y="2" width="6" height="13" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8" />
                </svg>
              </button>

              <h3 className="mt-5 text-xl font-bold sm:text-2xl">
                {listening
                  ? "கேட்டுக்கொண்டிருக்கிறேன்..."
                  : speaking
                    ? "VoiceCart பேசுகிறது..."
                    : "பேசத் தொடங்குங்கள்"}
              </h3>

              <p className="mt-2 text-xs text-white/75 sm:text-sm">
                {listening
                  ? "முடித்ததும் தானாகவே அனுப்பப்படும்"
                  : speaking
                    ? "AI பதிலை கவனமாக கேளுங்கள்"
                    : "Tap the microphone and speak in Tamil"}
              </p>

              <button
                type="button"
                onClick={() => {
                  if (voiceOutput && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                    setSpeaking(false);
                  }
                  setVoiceOutput(!voiceOutput);
                }}
                className="mt-4 rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                {voiceOutput ? "🔊 Voice replies ON" : "🔇 Voice replies OFF"}
              </button>

              {listening && (
                <div className="mt-5 flex h-7 items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <span
                      key={bar}
                      className="w-1 animate-pulse rounded-full bg-white"
                      style={{
                        height: `${10 + (bar % 4) * 5}px`,
                        animationDelay: `${bar * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SUGGESTIONS */}
          <div className="mt-8">
            <p className="mb-4 text-xs font-bold tracking-[0.15em] text-[#92796B]">
              TRY SAYING
            </p>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={loading}
                  className="rounded-full border border-[#E6D6C8] bg-[#FBF8F3] px-4 py-3 text-left text-xs font-medium text-[#705448] transition hover:border-[#A64B35] hover:bg-[#F6E4DA] disabled:opacity-50 sm:text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* SHOPPING TIP */}
          <div className="mt-8 rounded-2xl border border-[#E9DCCF] bg-[#FBF8F3] p-5">
            <p className="text-sm font-bold text-[#49362C]">
              💡 Shopping made easy
            </p>
            <p className="mt-2 text-xs leading-6 text-[#92796B]">
              Tell us the product you need and your budget.
              VoiceCart will help you find suitable products.
            </p>
          </div>
        </div>

        {/* RIGHT: SHOPPING PANEL */}
        <div className="flex min-w-0 flex-col gap-5">

          {/* CATEGORY PANEL */}
          <div className="rounded-[2rem] border border-[#E9DCCF] bg-[#FBF8F3] p-5 shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold sm:text-xl">
                  Explore categories
                </h3>
                <p className="mt-1 text-xs text-[#92796B]">
                  What are you looking for today?
                </p>
              </div>
              <span className="text-xl">✦</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    loadProducts(category.category);
                    sendMessage(`${category.name} வேண்டும்`);
                  }}
                  disabled={loading || productsLoading}
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#EDE2D8] bg-white p-3 text-left transition hover:-translate-y-1 hover:border-[#D5A08C] hover:shadow-md disabled:opacity-50 sm:p-4"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${category.color}`}>
                    {category.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#49362C]">
                      {category.name}
                    </p>
                    <p className="mt-1 text-xs text-[#9A8274]">
                      {category.tamil}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT CATALOGUE */}
          <div className="rounded-[2rem] border border-[#E9DCCF] bg-[#FBF8F3] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#49362C]">
                  Discover products
                </h3>
                <p className="mt-1 text-xs text-[#92796B]">
                  {activeCategory
                    ? `Showing ${activeCategory} products`
                    : "Choose a category or ask VoiceCart"}
                </p>
              </div>
              {products.length > 0 && (
                <span className="rounded-full bg-[#F2E2D7] px-3 py-1 text-xs font-semibold text-[#A64B35]">
                  {products.length} products
                </span>
              )}
            </div>

            {productsLoading && (
              <p className="py-8 text-center text-sm text-[#92796B]">
                Finding products...
              </p>
            )}

            {productError && (
              <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                {productError}
              </p>
            )}

            {!productsLoading && products.length === 0 && !productError && (
              <div className="mt-5 rounded-2xl border border-dashed border-[#DECABD] bg-white/60 px-5 py-9 text-center">
                <span className="text-4xl">🛍️</span>
                <p className="mt-3 text-sm font-semibold text-[#49362C]">
                  Products will appear here
                </p>
                <p className="mt-2 text-xs leading-5 text-[#9A8274]">
                  Ask for a cooker, mixer or fan to explore our catalogue.
                </p>
              </div>
            )}

            {!productsLoading && products.length > 0 && (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {products.map((product) => {
                  const cartItem = cart.find(
                    (item) => item.product.id === product.id
                  );

                  return (
                    <div
                      key={product.id}
                      className="overflow-hidden rounded-2xl border border-[#EDE2D8] bg-white"
                    >
                      <div className="flex h-36 items-center justify-center bg-[#F3E9DF]">
                        <span className="text-6xl">
                          {getProductIcon(product.category)}
                        </span>
                      </div>

                      <div className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#A48675]">
                          {product.id} · {product.size}
                        </p>

                        <h4 className="mt-2 min-h-10 text-sm font-bold leading-5 text-[#49362C]">
                          {product.name}
                        </h4>

                        <p className="mt-2 min-h-9 text-xs leading-5 text-[#92796B]">
                          {product.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-extrabold text-[#A64B35]">
                            ₹{product.price.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] text-[#92796B]">
                            {product.stock} in stock
                          </span>
                        </div>

                        {cartItem ? (
                          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5EDE3] p-2">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-[#A64B35]"
                            >
                              −
                            </button>
                            <span className="text-sm font-bold">
                              {cartItem.quantity} in cart
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              disabled={cartItem.quantity >= product.stock}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold text-[#A64B35] disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                            className="mt-4 w-full rounded-xl bg-[#A64B35] py-3 text-xs font-bold text-white transition hover:bg-[#853A29] disabled:opacity-40"
                          >
                            {product.stock > 0 ? "＋ Add to Cart" : "Out of stock"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CONVERSATION PANEL */}
          <div className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-[2rem] border border-[#E9DCCF] bg-[#FBF8F3] shadow-sm sm:min-h-[420px]">
            <div className="flex items-center justify-between border-b border-[#EEE3D9] px-5 py-4 sm:px-6">
              <div>
                <h3 className="font-bold text-[#49362C]">
                  Your conversation
                </h3>
                <p className="mt-1 text-[11px] text-[#9A8274]">
                  Your personal shopping assistant
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2E2D7] text-lg">
                🤎
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
              {messages.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F2E2D7] text-3xl">
                    🛍️
                  </div>
                  <h4 className="mt-4 font-bold text-[#49362C]">
                    உங்கள் shopping journey இங்கே தொடங்குகிறது!
                  </h4>
                  <p className="mt-2 max-w-xs text-xs leading-6 text-[#9A8274]">
                    Ask for a product, tell us your budget,
                    and we'll guide you step by step.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                      message.role === "user"
                        ? "rounded-br-sm bg-[#A64B35] text-white"
                        : "rounded-bl-sm border border-[#E9DCCF] bg-white text-[#49362C]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm border border-[#E9DCCF] bg-white px-4 py-3 text-sm text-[#92796B]">
                    VoiceCart is thinking...
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="mx-4 mb-3 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">
                {error}
              </p>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage(input);
              }}
              className="border-t border-[#EEE3D9] p-3 sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-[#E9DCCF] bg-white p-1.5 focus-within:border-[#A64B35]">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type in Tamil or English..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[#49362C] outline-none placeholder:text-[#B5A397]"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || loading || !sessionId}
                  className="shrink-0 rounded-xl bg-[#A64B35] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#853A29] disabled:opacity-40 sm:px-5"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* CHECKOUT MODAL */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#342923]/60 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg rounded-[2rem] bg-[#FBF8F3] p-6 shadow-2xl sm:p-8">

            {orderPlaced ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E6F0E4] text-4xl">
                  ✓
                </div>
                <h2 className="mt-5 text-2xl font-extrabold text-[#49362C]">
                  Demo order confirmed!
                </h2>
                <p className="mt-3 text-sm text-[#92796B]">
                  Your VoiceCart demo checkout is complete.
                </p>
                <div className="mt-5 rounded-2xl bg-[#F2E2D7] p-4">
                  <p className="text-xs text-[#92796B]">Demo order ID</p>
                  <p className="mt-1 text-lg font-bold text-[#A64B35]">
                    {demoOrderId}
                  </p>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#92796B]">
                  This is a demonstration only. No real order or payment has been processed.
                </p>
                <button
                  onClick={resetCheckout}
                  className="mt-6 w-full rounded-xl bg-[#A64B35] py-3 font-bold text-white hover:bg-[#853A29]"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#49362C]">
                      Your Cart
                    </h2>
                    <p className="mt-1 text-xs text-[#92796B]">
                      Review your items before checkout
                    </p>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F2E2D7] text-lg text-[#A64B35]"
                  >
                    ✕
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="text-5xl">🛒</span>
                    <p className="mt-4 font-bold text-[#49362C]">
                      Your cart is empty
                    </p>
                    <p className="mt-2 text-xs text-[#92796B]">
                      Add some products to continue.
                    </p>
                    <button
                      onClick={() => setCheckoutOpen(false)}
                      className="mt-5 rounded-xl bg-[#A64B35] px-6 py-3 text-sm font-bold text-white"
                    >
                      Explore products
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 max-h-64 space-y-3 overflow-y-auto">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-3 rounded-2xl border border-[#EDE2D8] bg-white p-3"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F3E9DF] text-3xl">
                            {getProductIcon(item.product.category)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[#49362C]">
                              {item.product.name}
                            </p>
                            <p className="mt-1 text-xs text-[#A64B35]">
                              ₹{item.product.price.toLocaleString("en-IN")}
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="font-bold text-[#A64B35]"
                              >
                                −
                              </button>
                              <span className="text-xs font-bold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, 1)}
                                disabled={item.quantity >= item.product.stock}
                                className="font-bold text-[#A64B35] disabled:opacity-40"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="ml-2 text-[11px] text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-[#49362C]">
                            ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#F2E2D7] p-4">
                      <div className="flex justify-between text-sm text-[#705448]">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="mt-3 flex justify-between border-t border-[#DECABD] pt-3 text-base font-extrabold text-[#49362C]">
                        <span>Total</span>
                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="mt-2 text-[10px] text-[#92796B]">
                        Demo pricing. Delivery charges not included.
                      </p>
                    </div>

                    <div className="mt-5">
                      <label className="text-sm font-bold text-[#49362C]">
                        Delivery address
                      </label>
                      <textarea
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="Enter your delivery address..."
                        rows={3}
                        className="mt-2 w-full resize-none rounded-xl border border-[#E9DCCF] bg-white p-3 text-sm outline-none focus:border-[#A64B35]"
                      />
                    </div>

                    <div className="mt-4">
                      <label className="text-sm font-bold text-[#49362C]">
                        Demo payment method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className="mt-2 w-full rounded-xl border border-[#E9DCCF] bg-white p-3 text-sm outline-none focus:border-[#A64B35]"
                      >
                        <option>Cash on Delivery</option>
                        <option>UPI (Demo only)</option>
                      </select>
                    </div>

                    <button
                      onClick={placeDemoOrder}
                      disabled={!address.trim()}
                      className="mt-6 w-full rounded-xl bg-[#A64B35] py-4 text-sm font-bold text-white transition hover:bg-[#853A29] disabled:opacity-40"
                    >
                      Confirm Demo Order · ₹{subtotal.toLocaleString("en-IN")}
                    </button>

                    <p className="mt-3 text-center text-[10px] leading-5 text-[#92796B]">
                      Demo checkout only. No actual payment, order placement or delivery will occur.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#E9DCCF] px-4 py-6 text-center">
        <p className="text-xs font-medium tracking-wide text-[#92796B]">
          Simple shopping. Your language. Your choice.
        </p>
        <p className="mt-2 text-[10px] text-[#AE9889]">
          Made with care by VoiceCart AI
        </p>
      </footer>
    </main>
  );
}
