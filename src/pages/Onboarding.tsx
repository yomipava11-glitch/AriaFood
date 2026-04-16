import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Activity, AlertTriangle, CheckCircle, ChevronRight, Heart } from 'lucide-react';

export default function Onboarding() {
  const { updateProfile, userProfile } = useData();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    gender: userProfile?.gender || '',
    medical_conditions: userProfile?.medical_conditions || '',
    allergies: userProfile?.allergies || ''
  });
  const [saving, setSaving] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        gender: formData.gender,
        medical_conditions: formData.medical_conditions,
        allergies: formData.allergies,
        has_completed_onboarding: true
      });
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

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-5">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-emerald-500' : step > s ? 'w-4 bg-emerald-300' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10">

          {/* STEP 1: GENDER */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <span className="text-4xl">👤</span>
                <h3 className="mt-3 text-lg font-bold text-gray-900">Comment vous appelez-vous ?</h3>
                <p className="text-sm text-gray-500 mt-1">Ce nom sera visible dans la communauté.</p>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Votre prénom ou pseudo"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all text-center"
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-medium mb-3">Vous êtes...</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setFormData({ ...formData, gender: 'male' }); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${formData.gender === 'male' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <span className="text-5xl">👨</span>
                  <span className={`text-sm font-bold ${formData.gender === 'male' ? 'text-emerald-600' : 'text-gray-600'}`}>Homme</span>
                  {formData.gender === 'male' && (
                    <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setFormData({ ...formData, gender: 'female' }); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${formData.gender === 'female' ? 'border-rose-400 bg-rose-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <span className="text-5xl">👩</span>
                  <span className={`text-sm font-bold ${formData.gender === 'female' ? 'text-rose-500' : 'text-gray-600'}`}>Femme</span>
                  {formData.gender === 'female' && (
                    <span className="w-5 h-5 bg-rose-400 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={handleNext}
                disabled={!formData.gender || !formData.full_name.trim()}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Continuer <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: MEDICAL CONDITIONS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="conditions" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Avez-vous des conditions médicales particulières ?
                </label>
                <div className="mt-2">
                  <textarea
                    id="conditions"
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Ex: Diabète, Hypertension, Cholestérol... (Laissez vide si aucune)"
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Ces informations permettront d'adapter vos conseils nutritionnels.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleNext}
                  className="w-2/3 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  Continuer <ChevronRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ALLERGIES */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="allergies" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <AlertTriangle className="w-4 h-4 text-emerald-500" />
                  Avez-vous des allergies ou intolérances ?
                </label>
                <div className="mt-2">
                  <textarea
                    id="allergies"
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Ex: Arachides, Gluten, Lactose... (Laissez vide si aucune)"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-2/3 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : <> Terminer <CheckCircle className="ml-2 w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
