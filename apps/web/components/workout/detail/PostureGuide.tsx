'use client';

import { Info, Lightbulb } from 'lucide-react';

interface PostureGuideProps {
  instructions: string[];
  tips?: string[];
}

export default function PostureGuide({ instructions, tips }: PostureGuideProps) {
  return (
    <div className="space-y-6">
      {/* 자세 가이드 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
          <Info className="w-5 h-5 text-indigo-500" />
          자세 가이드
        </h3>
        <ol className="space-y-4">
          {instructions.map((instruction, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex-shrink-0 w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <p className="text-gray-700 leading-relaxed pt-0.5">{instruction}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* 팁 섹션 */}
      {tips && tips.length > 0 && (
        <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
          <h3 className="flex items-center gap-2 text-lg font-bold text-yellow-800 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            팁
          </h3>
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li key={index} className="flex gap-3 text-yellow-800">
                <span className="text-yellow-500">•</span>
                <p className="leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
