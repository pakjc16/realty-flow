
import React, { useState } from 'react';
import { generateListingDescription, askRealEstateAdvisor } from '../services/geminiService';
import { Sparkles, Send, Loader2, Copy, Check } from 'lucide-react';
import { Property, Unit } from '../types';

interface AIAssistantProps {
  properties: Property[];
  units: Unit[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ properties, units }) => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'listing'>('advisor');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  // Listing generation state
  const [selectedPropId, setSelectedPropId] = useState(properties[0]?.id || '');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [features, setFeatures] = useState('');
  const [listingResult, setListingResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdvisorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer('');
    const response = await askRealEstateAdvisor(question);
    setAnswer(response);
    setLoading(false);
  };

  const handleListingSubmit = async () => {
    const prop = properties.find(p => p.id === selectedPropId);
    const unit = units.find(u => u.id === selectedUnitId);
    
    if (!prop) return;

    setLoading(true);
    const featureList = features.split(',').map(f => f.trim()).filter(f => f);
    // Add default info
    if (unit) {
      if (unit.rentType) {
        featureList.unshift(`${unit.rentType} ${unit.deposit || 0}/${unit.monthlyRent || 0}`);
      }
    }
    
    const result = await generateListingDescription(
      prop.name,
      unit ? unit.unitNumber : '미지정',
      featureList
    );
    setListingResult(result);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-yellow-300" />
          <h2 className="text-2xl font-bold">AI 스마트 비서</h2>
        </div>
        <p className="text-indigo-100">
          Google Gemini 2.5 Flash 모델을 기반으로 법률 상담과 매물 홍보글 작성을 도와드립니다.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'advisor' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            법률/임대차 상담
          </button>
          <button
            onClick={() => setActiveTab('listing')}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'listing' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            매물 홍보글 생성
          </button>
        </div>

        <div className="p-6 min-h-[400px]">
          {activeTab === 'advisor' ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2 font-medium">자주 묻는 질문 예시:</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setQuestion("세입자가 월세를 3개월째 연체 중인데 내용증명을 어떻게 보내나요?")} className="text-xs bg-white border border-gray-200 text-gray-900 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    월세 연체 내용증명
                  </button>
                  <button onClick={() => setQuestion("묵시적 갱신 후 세입자가 갑자기 나가겠다고 하면 중개수수료는 누가 내나요?")} className="text-xs bg-white border border-gray-200 text-gray-900 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    묵시적 갱신 중개수수료
                  </button>
                  <button onClick={() => setQuestion("상가 임대차 보호법상 10년 보장 범위가 어떻게 되나요?")} className="text-xs bg-white border border-gray-200 text-gray-900 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                    상가 10년 보장
                  </button>
                </div>
              </div>

              <form onSubmit={handleAdvisorSubmit} className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="부동산 관리와 관련된 법률적, 행정적 궁금증을 물어보세요..."
                  className="w-full h-32 p-4 border border-gray-300 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="absolute bottom-3 right-3 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </form>

              {answer && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 animate-fade-in">
                  <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                    {answer}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">건물(단지) 선택</label>
                  <select 
                    value={selectedPropId}
                    onChange={(e) => setSelectedPropId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">호실 선택 (선택사항)</label>
                  <select 
                     value={selectedUnitId}
                     onChange={(e) => setSelectedUnitId(e.target.value)}
                     className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">전체/미지정</option>
                    {units.filter(u => u.propertyId === selectedPropId).map(u => (
                      <option key={u.id} value={u.id}>{u.unitNumber}호 {u.rentType ? `(${u.rentType})` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">특징 키워드 (쉼표로 구분)</label>
                <input 
                  type="text" 
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="예: 남향, 풀옵션, 역세권, 신축, 반려동물 가능"
                  className="w-full p-2.5 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button
                onClick={handleListingSubmit}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                AI 홍보글 생성하기
              </button>

              {listingResult && (
                <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-4 relative">
                  <button
                    onClick={() => copyToClipboard(listingResult)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-indigo-600 transition-colors"
                    title="복사하기"
                  >
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                  <h3 className="font-semibold text-gray-900 mb-2">생성된 홍보글</h3>
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {listingResult}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
