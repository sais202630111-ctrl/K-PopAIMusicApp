import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Song {
  id: number;
  title: string;
  artist: string;
  genre: string;
  tags: string[];
  matchScore: number;
  albumColor: string;
  emoji: string;
  aiReason: string;
  // CRUD fields
  rating: number;
  comment: string;
  saved: boolean;
}

interface ChatMessage {
  id: number;
  role: "user" | "ai" | "typing";
  text: string;
  songs?: Song[];
  tags?: string[];
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_SONGS: Song[] = [
  {
    id: 1, title: "LEMON TANG", artist: "aespa", genre: "신나는",
    tags: ["#kpop", "#청량한", "#여름드라이브"], matchScore: 98,
    albumColor: "#E2FF00", emoji: "🍋",
    aiReason: "청량한 베이스와 상큼한 보컬 톤이 레몬 탱 특유의 여름 에너지와 완벽히 맞습니다.",
    rating: 0, comment: "", saved: false
  },
  {
    id: 2, title: "Ditto", artist: "NewJeans", genre: "감성적인",
    tags: ["#감성적인", "#청량한", "#kpop"], matchScore: 94,
    albumColor: "#FF5E3A", emoji: "🎸",
    aiReason: "몽환적인 분위기와 뉴진스 특유의 Y2K 감성이 여름 드라이브와 잘 어울립니다.",
    rating: 4, comment: "정말 좋아요!", saved: true
  },
  {
    id: 3, title: "Hype Boy", artist: "NewJeans", genre: "신나는",
    tags: ["#신나는", "#kpop", "#여름드라이브"], matchScore: 91,
    albumColor: "#9B5CF6", emoji: "💜",
    aiReason: "경쾌한 리듬과 중독성 있는 후렴구가 여름 드라이브 플레이리스트에 딱 맞습니다.",
    rating: 0, comment: "", saved: false
  },
  {
    id: 4, title: "ANTIFRAGILE", artist: "LE SSERAFIM", genre: "댄스",
    tags: ["#댄스", "#신나는", "#kpop"], matchScore: 88,
    albumColor: "#06B6D4", emoji: "🌊",
    aiReason: "강렬한 비트와 자신감 있는 보컬이 레몬 탱의 강렬함과 공명합니다.",
    rating: 5, comment: "완벽한 곡!", saved: true
  },
  {
    id: 5, title: "Love Dive", artist: "IVE", genre: "감성적인",
    tags: ["#감성적인", "#청량한", "#kpop"], matchScore: 85,
    albumColor: "#F59E0B", emoji: "🌸",
    aiReason: "감각적인 멜로디와 맑은 보컬이 청량한 여름 감성과 어울립니다.",
    rating: 0, comment: "", saved: false
  },
  {
    id: 6, title: "NXDE", artist: "(G)I-DLE", genre: "댄스",
    tags: ["#댄스", "#kpop", "#신나는"], matchScore: 82,
    albumColor: "#EC4899", emoji: "💃",
    aiReason: "독창적인 컨셉과 중독성 있는 사운드가 레몬 탱의 개성과 매칭됩니다.",
    rating: 3, comment: "괜찮아요", saved: false
  },
];

const AI_RESPONSES: Record<string, string> = {
  default: "AI가 분석 중입니다... 잠시만 기다려주세요 🎵",
  kpop: "K-POP 태그를 분석했습니다! 현재 가장 트렌디한 곡들을 추천드립니다.",
  청량한: "청량한 분위기의 음악을 찾으셨군요! 상큼하고 시원한 바이브의 곡들을 선별했습니다. ☀️",
  여름드라이브: "여름 드라이브에 딱 맞는 신나는 곡들을 준비했습니다! 창문 내리고 달려볼까요? 🚗",
  감성적인: "감성적인 K-POP 명곡들을 추천드립니다. 마음에 와닿는 곡을 찾으실 수 있을 거예요. 🌙",
  댄스: "신나는 댄스 트랙들을 모았습니다! 몸이 절로 움직이는 곡들이에요 💃",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function AlbumArt({ color, emoji, size = 48, playing = false }: {
  color: string; emoji: string; size?: number; playing?: boolean;
}) {
  return (
    <div
      className="relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}33, ${color}66)`, border: `1px solid ${color}44` }}
    >
      <span style={{ fontSize: size * 0.4 }}>{emoji}</span>
      {playing && (
        <div className="absolute inset-0 flex items-end justify-center pb-1 gap-0.5 bg-black/40">
          {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${(i-1)*0.15}s` }} />)}
        </div>
      )}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className="star text-lg select-none"
          style={{ color: i <= (hover || value) ? "#E2FF00" : "rgba(255,255,255,0.2)" }}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(i)}
        >★</span>
      ))}
    </div>
  );
}

function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span className="tag-pill">
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:text-white transition-colors leading-none">×</button>
      )}
    </span>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

type Tab = "chat" | "library";
type FilterTab = "전체" | "신나는" | "감성적인" | "댄스";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0, role: "ai",
      text: "안녕하세요! 저는 K-POP AI 음악 추천 도우미입니다 🎵\n\n태그나 곡 분위기를 입력하면 AI가 딱 맞는 음악을 추천해 드립니다.\n\n예시: #kpop #청량한, 여름 드라이브 음악 추천해줘, 신나는 댄스곡 알려줘"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [inputTags, setInputTags] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Library/CRUD state
  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [filterTab, setFilterTab] = useState<FilterTab>("전체");
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [detailSong, setDetailSong] = useState<Song | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Tag input handling ──────────────────────────────────────────────────────

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
      return;
    }
    if (e.key === " " || e.key === "　") {
      const val = inputText.trim();
      if (val.startsWith("#") && val.length > 1) {
        e.preventDefault();
        setInputTags(t => [...t, val]);
        setInputText("");
      }
    }
    if (e.key === "Backspace" && inputText === "" && inputTags.length > 0) {
      setInputTags(t => t.slice(0, -1));
    }
  }

  function addQuickTag(tag: string) {
    if (!inputTags.includes(tag)) {
      setInputTags(t => [...t, tag]);
    }
    inputRef.current?.focus();
  }

  // ── Send message ────────────────────────────────────────────────────────────

  function sendMessage() {
    const allTags = [...inputTags];
    const textPart = inputText.trim();
    if (textPart.startsWith("#")) {
      allTags.push(textPart);
    }
    const combined = allTags.length > 0
      ? allTags.join(" ") + (textPart && !textPart.startsWith("#") ? " " + textPart : "")
      : textPart;

    if (!combined) return;

    const userMsg: ChatMessage = { id: Date.now(), role: "user", text: combined, tags: allTags };
    setMessages(m => [...m, userMsg]);
    setInputText("");
    setInputTags([]);
    setIsTyping(true);

    // Determine AI response
    const lower = combined.toLowerCase();
    let aiText = "입력하신 내용을 분석했습니다. 아래 추천 곡들을 확인해보세요! 🎧";
    for (const key of Object.keys(AI_RESPONSES)) {
      if (lower.includes(key)) {
        aiText = AI_RESPONSES[key];
        break;
      }
    }

    // Filter songs
    let recommended = [...INITIAL_SONGS];
    if (lower.includes("감성")) recommended = INITIAL_SONGS.filter(s => s.genre === "감성적인");
    else if (lower.includes("댄스")) recommended = INITIAL_SONGS.filter(s => s.genre === "댄스");
    else if (lower.includes("신나")) recommended = INITIAL_SONGS.filter(s => s.genre === "신나는");
    else recommended = INITIAL_SONGS.slice().sort(() => Math.random() - 0.5).slice(0, 4);

    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: ChatMessage = {
        id: Date.now() + 1, role: "ai",
        text: aiText,
        songs: recommended,
        tags: allTags
      };
      setMessages(m => [...m, aiMsg]);
    }, 1800);
  }

  function saveToLibrary(song: Song) {
    setSongs(prev => {
      const exists = prev.find(s => s.id === song.id);
      if (exists) return prev.map(s => s.id === song.id ? { ...s, saved: true } : s);
      return [...prev, { ...song, saved: true }];
    });
  }

  // ── Library CRUD ────────────────────────────────────────────────────────────

  function openEdit(song: Song) {
    setEditingSong(song);
    setEditComment(song.comment);
    setEditRating(song.rating);
  }

  function saveEdit() {
    if (!editingSong) return;
    setSongs(prev => prev.map(s =>
      s.id === editingSong.id ? { ...s, comment: editComment, rating: editRating } : s
    ));
    setEditingSong(null);
  }

  function deleteSong(id: number) {
    setSongs(prev => prev.filter(s => s.id !== id));
    setShowDeleteConfirm(null);
    if (detailSong?.id === id) setDetailSong(null);
  }

  const filteredSongs = songs.filter(s =>
    filterTab === "전체" ? true : s.genre === filterTab
  );

  // ── Chat Input Area ─────────────────────────────────────────────────────────

  const quickTags = ["#kpop", "#lemon tang", "#청량한", "#여름드라이브", "#신나는", "#감성적인"];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ background: "#0D0E12" }}>
      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(13,14,18,0.95)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
            style={{ background: "linear-gradient(135deg, #E2FF00, #FF5E3A)" }}
          >
            K
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-none" style={{ color: "#E2FF00" }}>
              AI K-POP 음악 추천
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              음악 취향을 분석하는 AI 도우미
            </p>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["chat", "library"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === tab
                ? { background: "#E2FF00", color: "#0D0E12" }
                : { color: "rgba(255,255,255,0.5)" }
              }
            >
              {tab === "chat" ? "🤖 AI 채팅" : `📚 내 라이브러리 (${songs.length})`}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === "chat" ? (
          <ChatView
            messages={messages}
            isTyping={isTyping}
            inputText={inputText}
            inputTags={inputTags}
            quickTags={quickTags}
            playingId={playingId}
            chatEndRef={chatEndRef}
            inputRef={inputRef}
            setInputText={setInputText}
            setInputTags={setInputTags}
            onKeyDown={handleInputKeyDown}
            onSend={sendMessage}
            onQuickTag={addQuickTag}
            onPlay={(id) => setPlayingId(prev => prev === id ? null : id)}
            onSave={saveToLibrary}
            onDetail={setDetailSong}
            savedIds={songs.filter(s => s.saved).map(s => s.id)}
          />
        ) : (
          <LibraryView
            songs={filteredSongs}
            filterTab={filterTab}
            playingId={playingId}
            onFilter={setFilterTab}
            onPlay={(id) => setPlayingId(prev => prev === id ? null : id)}
            onEdit={openEdit}
            onDelete={(id) => setShowDeleteConfirm(id)}
            onDetail={setDetailSong}
          />
        )}
      </div>

      {/* Edit Modal */}
      {editingSong && (
        <div className="modal-overlay" onClick={() => setEditingSong(null)}>
          <div
            className="glass-card rounded-2xl p-6 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
            style={{ background: "#1A1D27", border: "1px solid rgba(226,255,0,0.2)" }}
          >
            <h3 className="text-lg font-black mb-1" style={{ color: "#E2FF00" }}>곡 정보 수정</h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
              {editingSong.title} — {editingSong.artist}
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>별점</label>
              <StarRating value={editRating} onChange={setEditRating} />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.5)" }}>코멘트</label>
              <textarea
                value={editComment}
                onChange={e => setEditComment(e.target.value)}
                placeholder="이 곡에 대한 코멘트를 남겨보세요..."
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  outline: "none"
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "#E2FF00", color: "#0D0E12" }}
              >
                저장하기
              </button>
              <button
                onClick={() => setEditingSong(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div
            className="glass-card rounded-2xl p-6 w-full max-w-sm mx-4"
            onClick={e => e.stopPropagation()}
            style={{ background: "#1A1D27", border: "1px solid rgba(255,94,58,0.3)" }}
          >
            <div className="text-3xl text-center mb-3">🗑️</div>
            <h3 className="text-lg font-black text-center mb-2">곡을 삭제하시겠어요?</h3>
            <p className="text-sm text-center mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
              삭제된 곡은 복구할 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteSong(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "#FF5E3A", color: "#fff" }}
              >
                삭제하기
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {detailSong && (
        <div className="modal-overlay" onClick={() => setDetailSong(null)}>
          <div
            className="glass-card rounded-2xl p-6 w-full max-w-lg mx-4"
            onClick={e => e.stopPropagation()}
            style={{ background: "#1A1D27", border: `1px solid ${detailSong.albumColor}33` }}
          >
            <div className="flex items-center gap-4 mb-5">
              <AlbumArt color={detailSong.albumColor} emoji={detailSong.emoji} size={72} />
              <div>
                <h3 className="text-xl font-black">{detailSong.title}</h3>
                <p className="font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{detailSong.artist}</p>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {detailSong.tags.map(t => <TagPill key={t} tag={t} />)}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(226,255,0,0.05)", border: "1px solid rgba(226,255,0,0.15)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#E2FF00" }}>🤖 AI 추천 이유</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{detailSong.aiReason}</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>매칭률</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: `${detailSong.matchScore}%`, background: "#E2FF00" }} />
                </div>
                <span className="text-sm font-bold" style={{ color: "#E2FF00" }}>{detailSong.matchScore}%</span>
              </div>
            </div>

            {detailSong.rating > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>내 별점</p>
                <StarRating value={detailSong.rating} />
              </div>
            )}

            {detailSong.comment && (
              <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(255,255,255,0.04)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>내 코멘트</p>
                <p className="text-sm">{detailSong.comment}</p>
              </div>
            )}

            <button
              onClick={() => setDetailSong(null)}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Chat View ────────────────────────────────────────────────────────────────

function ChatView({
  messages, isTyping, inputText, inputTags, quickTags, playingId, chatEndRef, inputRef,
  setInputText, setInputTags, onKeyDown, onSend, onQuickTag, onPlay, onSave, onDetail, savedIds
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  inputText: string;
  inputTags: string[];
  quickTags: string[];
  playingId: number | null;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setInputText: (v: string) => void;
  setInputTags: (fn: (t: string[]) => string[]) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSend: () => void;
  onQuickTag: (t: string) => void;
  onPlay: (id: number) => void;
  onSave: (s: Song) => void;
  onDetail: (s: Song) => void;
  savedIds: number[];
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 min-h-0 scroll-panel px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              {msg.role === "ai" && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{ background: "linear-gradient(135deg, #E2FF00, #FF5E3A)", color: "#0D0E12" }}
                  >K</div>
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>K-POP AI</span>
                </div>
              )}
              <div className={msg.role === "user" ? "chat-user px-4 py-3" : "chat-ai px-4 py-3"}>
                {msg.tags && msg.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {msg.tags.map(t => <TagPill key={t} tag={t} />)}
                  </div>
                )}
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
              </div>
              {msg.songs && msg.songs.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.songs.map(song => (
                    <ChatSongCard
                      key={song.id}
                      song={song}
                      playing={playingId === song.id}
                      saved={savedIds.includes(song.id)}
                      onPlay={() => onPlay(song.id)}
                      onSave={() => onSave(song)}
                      onDetail={() => onDetail(song)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="chat-ai px-4 py-3 flex items-center gap-1">
              <span className="text-sm mr-1" style={{ color: "rgba(255,255,255,0.5)" }}>AI가 분석 중</span>
              <span className="dot-1 text-lg" style={{ color: "#E2FF00" }}>•</span>
              <span className="dot-2 text-lg" style={{ color: "#E2FF00" }}>•</span>
              <span className="dot-3 text-lg" style={{ color: "#E2FF00" }}>•</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Tags */}
      <div className="flex-shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
        {quickTags.map(tag => (
          <button
            key={tag}
            onClick={() => onQuickTag(tag)}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(226,255,0,0.08)",
              border: "1px solid rgba(226,255,0,0.2)",
              color: "rgba(226,255,0,0.7)",
              fontFamily: "'JetBrains Mono', monospace"
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 mx-4 mb-4 rounded-2xl overflow-hidden transition-all"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1 min-h-[44px]">
          {inputTags.map((tag, i) => (
            <TagPill key={i} tag={tag} onRemove={() => setInputTags(t => t.filter((_, j) => j !== i))} />
          ))}
          <input
            ref={inputRef}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={inputTags.length === 0 ? "태그를 입력하세요 (예: #kpop #청량한) — Enter로 전송" : "태그 추가..."}
            className="chat-input flex-1 min-w-[120px] bg-transparent text-sm py-1"
            style={{ color: "#fff", border: "none", fontFamily: "'Noto Sans KR', sans-serif" }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>
            #태그 입력 후 Space키로 추가
          </span>
          <button
            onClick={onSend}
            disabled={!inputText.trim() && inputTags.length === 0}
            className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 disabled:opacity-30"
            style={{ background: "#E2FF00", color: "#0D0E12" }}
          >
            AI 추천 ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatSongCard({ song, playing, saved, onPlay, onSave, onDetail }: {
  song: Song; playing: boolean; saved: boolean;
  onPlay: () => void; onSave: () => void; onDetail: () => void;
}) {
  return (
    <div
      className="glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer song-card"
      onClick={onDetail}
      style={{ border: playing ? `1px solid rgba(226,255,0,0.4)` : undefined }}
    >
      <AlbumArt color={song.albumColor} emoji={song.emoji} size={44} playing={playing} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold truncate">{song.title}</p>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
            style={{ background: "rgba(226,255,0,0.15)", color: "#E2FF00", fontFamily: "'JetBrains Mono', monospace" }}
          >
            {song.matchScore}%
          </span>
        </div>
        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{song.artist}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={e => { e.stopPropagation(); onPlay(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{ background: playing ? "#E2FF00" : "rgba(226,255,0,0.15)", color: playing ? "#0D0E12" : "#E2FF00" }}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          onClick={e => { e.stopPropagation(); onSave(); }}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-sm"
          style={{ background: saved ? "rgba(255,94,58,0.2)" : "rgba(255,255,255,0.08)", color: saved ? "#FF5E3A" : "rgba(255,255,255,0.4)" }}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>
    </div>
  );
}

// ─── Library View ─────────────────────────────────────────────────────────────

const FILTER_TABS: FilterTab[] = ["전체", "신나는", "감성적인", "댄스"];

function LibraryView({ songs, filterTab, playingId, onFilter, onPlay, onEdit, onDelete, onDetail }: {
  songs: Song[];
  filterTab: FilterTab;
  playingId: number | null;
  onFilter: (t: FilterTab) => void;
  onPlay: (id: number) => void;
  onEdit: (s: Song) => void;
  onDelete: (id: number) => void;
  onDetail: (s: Song) => void;
}) {
  const savedCount = songs.filter(s => s.saved).length;
  const avgRating = songs.filter(s => s.rating > 0).reduce((acc, s, _, arr) => acc + s.rating / arr.length, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <div
        className="flex-shrink-0 mx-4 mt-4 rounded-2xl p-4 flex items-center gap-6"
        style={{ background: "rgba(226,255,0,0.05)", border: "1px solid rgba(226,255,0,0.1)" }}
      >
        <Stat label="전체 곡" value={songs.length.toString()} />
        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.08)" }} />
        <Stat label="저장된 곡" value={savedCount.toString()} accent />
        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.08)" }} />
        <Stat label="평균 별점" value={avgRating > 0 ? `★ ${avgRating.toFixed(1)}` : "—"} />
      </div>

      {/* Filter tabs */}
      <div className="flex-shrink-0 flex gap-2 px-4 mt-3">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => onFilter(tab)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={filterTab === tab
              ? { background: "#E2FF00", color: "#0D0E12" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Song list */}
      <div className="flex-1 min-h-0 scroll-panel px-4 mt-3 pb-4 space-y-2">
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span className="text-5xl">🎵</span>
            <p className="text-sm">AI 채팅에서 곡을 추가해보세요</p>
          </div>
        ) : (
          songs.map(song => (
            <LibrarySongCard
              key={song.id}
              song={song}
              playing={playingId === song.id}
              onPlay={() => onPlay(song.id)}
              onEdit={() => onEdit(song)}
              onDelete={() => onDelete(song.id)}
              onDetail={() => onDetail(song)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
      <p className="text-lg font-black" style={{ color: accent ? "#E2FF00" : "#fff", fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </p>
    </div>
  );
}

function LibrarySongCard({ song, playing, onPlay, onEdit, onDelete, onDetail }: {
  song: Song; playing: boolean;
  onPlay: () => void; onEdit: () => void; onDelete: () => void; onDetail: () => void;
}) {
  return (
    <div
      className="glass-card rounded-2xl p-4 song-card"
      style={{ border: playing ? `1px solid rgba(226,255,0,0.35)` : undefined }}
    >
      <div className="flex items-start gap-3">
        <div onClick={onDetail} className="cursor-pointer">
          <AlbumArt color={song.albumColor} emoji={song.emoji} size={52} playing={playing} />
        </div>
        <div className="flex-1 min-w-0" onClick={onDetail} style={{ cursor: "pointer" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-black">{song.title}</p>
            {song.saved && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,94,58,0.2)", color: "#FF5E3A" }}>
                저장됨
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded font-bold"
              style={{ background: "rgba(226,255,0,0.12)", color: "#E2FF00", fontFamily: "'JetBrains Mono', monospace" }}
            >
              매칭률 {song.matchScore}%
            </span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{song.artist}</p>

          <div className="flex items-center gap-3 mt-2">
            <StarRating value={song.rating} />
            {song.comment && (
              <span className="text-xs truncate max-w-[180px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                "{song.comment}"
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {song.tags.map(t => <TagPill key={t} tag={t} />)}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={onPlay}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 text-sm"
            style={{ background: playing ? "#E2FF00" : "rgba(226,255,0,0.12)", color: playing ? "#0D0E12" : "#E2FF00" }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 text-sm"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
            title="수정"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 text-sm"
            style={{ background: "rgba(255,94,58,0.12)", color: "#FF5E3A" }}
            title="삭제"
          >
            🗑️
          </button>
        </div>
      </div>

      {song.comment && (
        <div
          className="mt-3 px-3 py-2 rounded-xl text-xs"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", borderLeft: "2px solid rgba(226,255,0,0.3)" }}
        >
          {song.comment}
        </div>
      )}
    </div>
  );
}
