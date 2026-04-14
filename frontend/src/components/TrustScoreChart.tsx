import type { TrustScore } from '@/lib/api';

export default function TrustScoreChart({ score }: { score: TrustScore }) {
  const dimensions = [
    { label: 'Activity', value: score.activity_score, color: 'bg-blue-500' },
    { label: 'Community', value: score.community_score, color: 'bg-purple-500' },
    { label: 'Maintenance', value: score.maintenance_score, color: 'bg-emerald-500' },
    { label: 'Popularity', value: score.popularity_score, color: 'bg-amber-500' },
    { label: 'Maturity', value: score.maturity_score ?? 0, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Trust Breakdown</h3>
        <span className="text-2xl font-bold text-gray-900">{score.overall.toFixed(0)}<span className="text-sm font-normal text-gray-500">/100</span></span>
      </div>
      {dimensions.map((dim) => (
        <div key={dim.label}>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{dim.label}</span>
            <span>{dim.value.toFixed(0)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full ${dim.color} transition-all`}
              style={{ width: `${Math.min(dim.value, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
