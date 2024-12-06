import { useState } from 'react';
import { ArrowLeft, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Supplement, IntakeRecord } from '../types';
import { format } from 'date-fns';
import { supplementStorage } from '../utils/supplementStorage';
import toast from 'react-hot-toast';

interface SupplementDetailProps {
  supplement: Supplement;
  onLogIntake: (record: Partial<IntakeRecord>) => void;
}

export function SupplementDetail({ supplement, onLogIntake }: SupplementDetailProps) {
  const navigate = useNavigate();
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const handleLogIntake = () => {
    onLogIntake({
      timestamp: new Date().toISOString(),
      taken: true,
      notes,
      mood: rating,
    });
    setRating(0);
    setNotes('');
  };

  const handleRefreshNutritionalInfo = async () => {
    setRefreshing(true);
    try {
      const success = await supplementStorage.refreshNutritionalInfo(supplement.id);
      if (success) {
        toast.success('Nutritional information updated');
      } else {
        toast.error('Could not update nutritional information');
      }
    } catch (error) {
      toast.error('Error updating nutritional information');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">{supplement.name}</h1>
        </div>
        {supplement.image && (
          <div className="mt-4 flex justify-center">
            <img 
              src={supplement.image} 
              alt={supplement.name}
              className="w-32 h-32 object-contain rounded-lg shadow-sm"
            />
          </div>
        )}
      </header>

      <div className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Dosage</label>
              <p className="font-medium">{supplement.dosage}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Frequency</label>
              <p className="font-medium">{supplement.frequency}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Time of Day</label>
              <p className="font-medium">{supplement.timeOfDay}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Last Taken</label>
              <p className="font-medium">
                {supplement.lastTaken
                  ? format(new Date(supplement.lastTaken), 'PPp')
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Log */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-4">Log Intake</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 block mb-2">How do you feel?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className={`p-2 rounded-full ${
                      rating === value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 block mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={3}
              />
            </div>

            <button
              onClick={handleLogIntake}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Log Intake
            </button>
          </div>
        </div>

        {/* Nutritional Information */}
        {supplement.nutritionalInfo && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Nutritional Information</h3>
              {supplement.barcode && (
                <button
                  onClick={handleRefreshNutritionalInfo}
                  disabled={refreshing}
                  className={`p-2 rounded-full hover:bg-gray-100 ${
                    refreshing ? 'animate-spin' : ''
                  }`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Serving Size</label>
                <p className="font-medium">{supplement.nutritionalInfo.servingSize}</p>
              </div>

              {supplement.nutritionalInfo.ingredients.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Ingredients</label>
                  <ul className="mt-1 space-y-1">
                    {supplement.nutritionalInfo.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-sm">{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}

              {supplement.nutritionalInfo.warnings && supplement.nutritionalInfo.warnings.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Warnings</label>
                  <ul className="mt-1 space-y-1">
                    {supplement.nutritionalInfo.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {supplement.apiData && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Last updated: {format(new Date(supplement.apiData.lastUpdated), 'PPp')}
                  {supplement.apiData.source === 'OpenFoodFacts' && ' via OpenFoodFacts'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium mb-4">Recent History</h3>
          <div className="space-y-3">
            {supplement.intakeHistory.slice(0, 5).map((record, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{format(new Date(record.timestamp), 'PPp')}</span>
                </div>
                {record.mood && (
                  <span className="text-sm text-gray-500">Rating: {record.mood}/5</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
