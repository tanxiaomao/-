
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Outfit, Season, Occasion, CommunityPost, WeatherData, Comment } from './types';
import ProfileOnboarding from './components/ProfileOnboarding';
import { getOutfitRecommendations, analyzeOutfitImage } from './services/geminiService';
import { getCurrentWeather } from './services/weatherService';

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg className={`w-6 h-6 transition-all duration-300 ${filled ? 'text-rose-500 fill-current scale-110' : 'text-slate-400 hover:text-rose-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'community' | 'ai' | 'me'>('discover');
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [season, setSeason] = useState<Season>('春');
  const [occasion, setOccasion] = useState<Occasion>('日常办公');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const init = async () => {
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));
      
      const savedFavs = localStorage.getItem('user_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const w = await getCurrentWeather();
      setWeather(w);
    };
    init();
  }, []);

  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('user_profile', JSON.stringify(newProfile));
  };

  const fetchRecommendations = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const results = await getOutfitRecommendations(profile, season, occasion, weather || undefined);
    setOutfits(results);
    setLoading(false);
  }, [profile, season, occasion, weather]);

  useEffect(() => {
    if (profile && activeTab === 'discover') {
      fetchRecommendations();
    }
  }, [profile, activeTab, fetchRecommendations]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('user_favorites', JSON.stringify(next));
      return next;
    });
  };

  if (!profile) return <ProfileOnboarding onComplete={handleProfileComplete} />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20 relative overflow-x-hidden flex flex-col">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-40 p-4 flex justify-between items-center border-b border-slate-100">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">CareerChic</h1>
        <div className="flex items-center space-x-2">
          {weather && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 rounded-full border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600">{weather.temp}° {weather.condition}</span>
            </div>
          )}
          <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-white font-medium">{occasion}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'discover' && (
          <div className="p-4 space-y-6">
            {weather && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-100 animate-in fade-in slide-in-from-top duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold">今日穿搭建议</h2>
                    <p className="text-xs opacity-80">{weather.city} · {weather.condition} · {weather.temp}°C</p>
                  </div>
                  <div className="text-2xl">🧥</div>
                </div>
                <p className="mt-3 text-sm font-medium leading-relaxed">
                  气温适中，最适合{profile.preferences[0]}风搭配。已为您精准适配当日温差。
                </p>
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {(['春', '夏', '秋', '冬'] as Season[]).map(s => (
                <button key={s} onClick={() => setSeason(s)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${season === s ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-100'}`}>{s}季</button>
              ))}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
              {(['正式会议', '日常办公', '商务午宴', '休闲周五', '下班约会'] as Occasion[]).map(o => (
                <button key={o} onClick={() => setOccasion(o)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${occasion === o ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-100'}`}>{o}</button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                <p className="text-slate-400 text-sm italic">正在根据天气精选穿搭...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {outfits.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} isFavorite={favorites.includes(outfit.id)} onToggleFav={toggleFavorite} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'community' && <CommunityView />}
        {activeTab === 'ai' && <AILabView profile={profile} />}
        {activeTab === 'me' && <ProfileView profile={profile} favorites={favorites} outfits={outfits} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
        <NavButton icon="discovery" active={activeTab === 'discover'} label="发现" onClick={() => setActiveTab('discover')} />
        <NavButton icon="community" active={activeTab === 'community'} label="社区" onClick={() => setActiveTab('community')} />
        <NavButton icon="ai" active={activeTab === 'ai'} label="AI实验" onClick={() => setActiveTab('ai')} />
        <NavButton icon="me" active={activeTab === 'me'} label="我的" onClick={() => setActiveTab('me')} />
      </nav>
    </div>
  );
};

const OutfitCard = ({ outfit, isFavorite, onToggleFav }: any) => (
  <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
    <div className="relative aspect-[3/4] overflow-hidden">
      <img src={outfit.imageUrl} alt={outfit.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <button onClick={() => onToggleFav(outfit.id)} className="absolute top-4 right-4 bg-white/90 p-2.5 rounded-full shadow-lg backdrop-blur-sm"><HeartIcon filled={isFavorite} /></button>
    </div>
    <div className="p-6 space-y-4">
      <h3 className="text-xl font-bold text-slate-800">{outfit.title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">{outfit.description}</p>
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">今日公式</span>
        <p className="text-slate-800 font-medium text-sm">{outfit.formula}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {outfit.highlights?.map((h: string, i: number) => (
          <span key={i} className="px-3 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-100">✨ {h}</span>
        ))}
      </div>
    </div>
  </div>
);

const CommunityView: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      author: 'Vivian',
      avatar: 'https://picsum.photos/seed/vivi/100',
      imageUrl: 'https://picsum.photos/seed/post1/600/800',
      content: '今天上海微凉，米色系西装+高领衫，刚好适配22度的多云天气！',
      likes: 128,
      isLiked: false,
      comments: [
        { id: 'c1', author: 'Lily', text: '这套颜色真的绝绝子', timestamp: Date.now() }
      ],
      timestamp: Date.now() - 3600000
    },
    {
      id: '2',
      author: 'Claire',
      avatar: 'https://picsum.photos/seed/claire/100',
      imageUrl: 'https://picsum.photos/seed/post2/600/800',
      content: '周五休闲风，卫衣+西装裤居然意外的合适？大家周末去哪玩呀？',
      likes: 89,
      isLiked: false,
      comments: [],
      timestamp: Date.now() - 7200000
    }
  ]);

  const toggleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const addComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newComment: Comment = { id: Date.now().toString(), author: '我', text, timestamp: Date.now() };
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    }));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">职场女性社区</h2>
        <button className="bg-slate-800 text-white p-2 rounded-full shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
      <div className="space-y-8">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-50">
            <div className="p-4 flex items-center space-x-3">
              <img src={post.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
              <div>
                <p className="text-sm font-bold text-slate-800">{post.author}</p>
                <p className="text-[10px] text-slate-400 italic">1小时前发布</p>
              </div>
            </div>
            <img src={post.imageUrl} alt="post" className="w-full aspect-[4/5] object-cover" />
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
              <div className="flex items-center space-x-6">
                <button onClick={() => toggleLike(post.id)} className="flex items-center space-x-1.5 group">
                  <HeartIcon filled={post.isLiked} />
                  <span className={`text-xs font-bold ${post.isLiked ? 'text-rose-500' : 'text-slate-400'}`}>{post.likes}</span>
                </button>
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <span className="text-xs font-bold">{post.comments.length}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-50 space-y-3">
                {post.comments.map(c => (
                  <div key={c.id} className="text-xs">
                    <span className="font-bold text-slate-800 mr-2">{c.author}:</span>
                    <span className="text-slate-600">{c.text}</span>
                  </div>
                ))}
                <CommentInput onSend={(val) => addComment(post.id, val)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CommentInput = ({ onSend }: { onSend: (v: string) => void }) => {
  const [val, setVal] = useState('');
  return (
    <div className="flex items-center space-x-2 mt-2">
      <input 
        value={val} 
        onChange={e => setVal(e.target.value)}
        placeholder="发表你的穿搭看法..." 
        className="flex-1 bg-slate-50 text-xs px-3 py-2 rounded-full outline-none focus:ring-1 ring-slate-200 transition"
      />
      <button 
        onClick={() => { onSend(val); setVal(''); }}
        className="text-[10px] font-bold text-slate-800 px-3 py-2 bg-slate-100 rounded-full hover:bg-slate-200"
      >发送</button>
    </div>
  );
};

const NavButton = ({ icon, active, label, onClick }: any) => {
  const icons: any = {
    discovery: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    community: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    ai: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    me: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition ${active ? 'text-slate-900 scale-110 font-bold' : 'text-slate-400'}`}>
      {icons[icon]}
      <span className="text-[10px]">{label}</span>
    </button>
  );
};

const AILabView: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [preview, setPreview] = useState<string>('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const runAnalysis = async () => {
    if (!preview) return;
    setAnalyzing(true);
    try {
      const base64 = preview.split(',')[1];
      const result = await analyzeOutfitImage(base64, profile);
      setAnalysis(result);
    } catch (err) {
      alert('分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">AI 穿搭实验室</h2>
        <p className="text-slate-400 text-xs italic">深度解析穿搭亮点与身材适配</p>
      </div>

      <div className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center bg-white group transition-all hover:border-slate-400">
        {preview ? (
          <img src={preview} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-300 text-center">
            <p className="text-5xl mb-4">📸</p>
            <p className="font-semibold text-sm">点击上传或拍摄穿搭</p>
            <p className="text-[10px] mt-1 opacity-60">支持 .jpg, .png 格式</p>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
      </div>

      {preview && !analysis && (
        <button 
          onClick={runAnalysis} 
          disabled={analyzing} 
          className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 transition active:scale-95 flex justify-center items-center space-x-2"
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span>正在实验室深度解析...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>开启 AI 深度解析</span>
            </>
          )}
        </button>
      )}

      {analysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
          {/* 核心结论区域 */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">REPORT</span>
              <h3 className="text-xl font-bold text-slate-900">{analysis.title}</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">{analysis.description}</p>

            {/* 1. 造型师专属建议 (Highest priority) */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <svg className="w-12 h-12 text-indigo-900" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path></svg>
              </div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="p-1.5 bg-indigo-600 rounded-lg text-white">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </span>
                <span className="text-xs font-black text-indigo-900 uppercase tracking-tighter">造型师匹配建议</span>
              </div>
              <p className="text-indigo-900 text-sm font-medium leading-relaxed italic">
                “{analysis.personalSuggestion}”
              </p>
            </div>
          </div>

          {/* 2. 穿搭公式卡片 */}
          <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-amber-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7.586 5H6a1 1 0 100 2h1.586l-1.293 1.293a1 1 0 101.414 1.414L9 8.414V10a1 1 0 102 0V8.414l1.293 1.293a1 1 0 001.414-1.414L12.414 7H14a1 1 0 100-2h-1.586l1.293-1.293A1 1 0 0013 2H7z" clipRule="evenodd"></path></svg>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">万能穿搭公式</span>
            </div>
            <p className="text-lg font-serif italic text-amber-50 leading-snug">
              {analysis.formula}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {analysis.tags?.map((tag: string) => (
                <span key={tag} className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-white/60">#{tag}</span>
              ))}
            </div>
          </div>

          {/* 3. 核心亮点拆解 */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase mb-4 block">核心风格拆解</span>
            <div className="space-y-3">
              {analysis.highlights?.map((h: string, i: number) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <span className="text-amber-500 font-bold mt-0.5 text-xs">0{i+1}</span>
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              onClick={() => {setAnalysis(null); setPreview('');}} 
              className="flex-1 py-4 text-xs font-bold text-slate-400 bg-white border border-slate-100 rounded-2xl active:bg-slate-50 transition"
            >
              放弃分析
            </button>
            <button 
              onClick={() => {alert('已保存至您的型格档案');}} 
              className="flex-[2] py-4 text-xs font-bold text-white bg-slate-800 rounded-2xl shadow-lg active:scale-95 transition"
            >
              保存至型格报告
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileView: React.FC<{ profile: UserProfile, favorites: string[], outfits: Outfit[] }> = ({ profile, favorites, outfits }) => {
  const favoriteOutfits = outfits.filter(o => favorites.includes(o.id));
  return (
    <div className="p-4 space-y-8">
      <div className="flex items-center space-x-4 pt-4">
        <div className="w-20 h-20 bg-slate-200 rounded-3xl overflow-hidden"><img src="https://picsum.photos/seed/user/200" className="w-full h-full object-cover" /></div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">职场菁英</h2>
          <p className="text-slate-400 text-xs italic">已为您生成专属职场型格报告</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 text-center"><p className="text-2xl font-bold text-slate-800">{favorites.length}</p><p className="text-[10px] text-slate-400 mt-1">收藏灵感</p></div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 text-center"><p className="text-2xl font-bold text-slate-800">{profile.preferences.length}</p><p className="text-[10px] text-slate-400 mt-1">关注风格</p></div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-bold">灵感收藏夹</h3>
        <div className="grid grid-cols-2 gap-3">
          {favoriteOutfits.map(o => (
            <div key={o.id} className="aspect-[3/4] rounded-2xl overflow-hidden relative shadow-sm"><img src={o.imageUrl} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2"><span className="text-white text-[10px] font-medium truncate">{o.title}</span></div></div>
          ))}
          {favoriteOutfits.length === 0 && <div className="col-span-2 py-10 text-center bg-white rounded-3xl text-slate-300 italic text-sm">快去发现页收藏心仪穿搭吧</div>}
        </div>
      </div>
      <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 text-rose-500 font-bold text-xs border border-rose-100 rounded-2xl bg-rose-50">重置账号信息</button>
    </div>
  );
};

export default App;
