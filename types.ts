
export type Season = '春' | '夏' | '秋' | '冬';
export type Occasion = '正式会议' | '日常办公' | '商务午宴' | '休闲周五' | '下班约会';
export type StylePreference = '简约' | '优雅' | '中性' | '复古' | '法式' | '干练';

export interface WeatherData {
  temp: number;
  condition: string;
  city: string;
}

export interface UserProfile {
  age: number;
  height: number;
  weight: number;
  preferences: StylePreference[];
  isInitialized: boolean;
}

export interface Outfit {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  season: Season;
  occasion: Occasion;
  tags: string[];
  formula?: string;
  highlights?: string[];
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  imageUrl: string;
  content: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  timestamp: number;
}
