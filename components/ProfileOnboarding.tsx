
import React, { useState } from 'react';
import { UserProfile, StylePreference } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const STYLE_OPTIONS: StylePreference[] = ['简约', '优雅', '中性', '复古', '法式', '干练'];

const ProfileOnboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>({
    age: 25,
    height: 165,
    weight: 55,
    preferences: [],
    isInitialized: true
  });

  const nextStep = () => setStep(s => s + 1);

  const togglePreference = (style: StylePreference) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(style)
        ? prev.preferences.filter(p => p !== style)
        : [...prev.preferences, style]
    }));
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col p-8 items-center justify-center text-slate-800">
      <div className="max-w-md w-full">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold text-center">欢迎来到 CareerChic</h2>
            <p className="text-slate-500 text-center italic">开启您的个性化职场穿搭之旅</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">年龄</label>
                <input 
                  type="range" min="18" max="60" value={formData.age}
                  onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
                <div className="text-right text-sm font-semibold">{formData.age} 岁</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">身高 (cm)</label>
                <input 
                  type="number" value={formData.height}
                  onChange={e => setFormData({...formData, height: parseInt(e.target.value)})}
                  className="w-full border-b border-slate-300 py-2 focus:border-slate-800 outline-none text-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">体重 (kg)</label>
                <input 
                  type="number" value={formData.weight}
                  onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})}
                  className="w-full border-b border-slate-300 py-2 focus:border-slate-800 outline-none text-xl"
                />
              </div>
            </div>
            <button 
              onClick={nextStep}
              className="w-full bg-slate-800 text-white py-4 rounded-full font-semibold hover:bg-slate-700 transition"
            >
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-bold text-center">选择您的风格偏好</h2>
            <p className="text-slate-500 text-center">多选，帮助我们更精准地推荐</p>
            <div className="grid grid-cols-2 gap-4">
              {STYLE_OPTIONS.map(style => (
                <button
                  key={style}
                  onClick={() => togglePreference(style)}
                  className={`py-4 rounded-xl border-2 transition-all ${
                    formData.preferences.includes(style) 
                    ? 'border-slate-800 bg-slate-800 text-white shadow-lg' 
                    : 'border-slate-100 bg-slate-50 text-slate-600'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <button 
              onClick={() => onComplete(formData)}
              disabled={formData.preferences.length === 0}
              className="w-full bg-slate-800 text-white py-4 rounded-full font-semibold hover:bg-slate-700 transition disabled:opacity-50"
            >
              开启穿搭灵感
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOnboarding;
