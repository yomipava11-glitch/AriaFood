import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Activity, AlertTriangle, CheckCircle, ChevronRight, Heart } from 'lucide-react';

export default function Onboarding() {
  const { updateProfile, userProfile } = useData();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    medical_conditions: userProfile?.medical_conditions || '',
    allergies: userProfile?.allergies || ''
  });
  const [saving, setSaving] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateProfile({
        medical_conditions: formData.medical_conditions,
        allergies: formData.allergies,
        has_completed_onboarding: true
      });
      // Will auto-redirect via AppRoutes once has_completed_onboarding is true
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Heart className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Bienvenue sur AriaFood
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Personnalisons votre expérience santé
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label htmlFor="conditions" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Avez-vous des conditions médicales particulières ?
                </label>
                <div className="mt-2">
                  <textarea
                    id="conditions"
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Ex: Diabète, Hypertension, Cholestérol... (Laissez vide si aucune)"
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Ces informations permettront à l'IA d'adapter ses conseils nutritionnels.</p>
              </div>
              <button
                onClick={handleNext}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Continuer <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label htmlFor="allergies" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <AlertTriangle className="w-4 h-4 text-emerald-500" />
                  Avez-vous des allergies ou intolérances ?
                </label>
                <div className="mt-2">
                  <textarea
                    id="allergies"
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Ex: Arachides, Gluten, Lactose... (Laissez vide si aucune)"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-2/3 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : <>Terminer <CheckCircle className="ml-2 w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
