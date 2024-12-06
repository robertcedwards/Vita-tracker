import { Pill, Clock, Plus } from 'lucide-react';
import { Supplement } from '../types';
import { format, isToday } from 'date-fns';

interface SupplementListProps {
  supplements: Supplement[];
  onTakeSupplement: (id: string) => void;
  onAddClick: () => void;
}

export function SupplementList({ supplements, onTakeSupplement, onAddClick }: SupplementListProps) {
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">My Supplements</h2>
        <button
          onClick={onAddClick}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
      
      <div className="space-y-3">
        {supplements.map((supplement) => (
          <div
            key={supplement.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Pill className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">{supplement.name}</h3>
                  <p className="text-sm text-gray-500">{supplement.dosage}</p>
                  <p className="text-sm text-gray-500">{supplement.frequency}</p>
                </div>
              </div>
              <button
                onClick={() => onTakeSupplement(supplement.id)}
                className={`p-2 rounded-full ${
                  supplement.lastTaken && isToday(new Date(supplement.lastTaken))
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>
            {supplement.lastTaken && (
              <p className="text-xs text-gray-500 mt-2">
                Last taken: {format(new Date(supplement.lastTaken), 'PPp')}
              </p>
            )}
          </div>
        ))}
        
        {supplements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            <p>No supplements added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
