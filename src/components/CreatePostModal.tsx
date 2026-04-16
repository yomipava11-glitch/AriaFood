import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated }) => {
    const { userProfile } = useData();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [foodName, setFoodName] = useState('');
    const [content, setContent] = useState('');
    const [calories, setCalories] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClose = () => {
        setImageFile(null);
        setImagePreview(null);
        setFoodName('');
        setContent('');
        setCalories('');
        setError(null);
        onClose();
    };

    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas to Blob failed'));
                    }, 'image/jpeg', 0.7);
                };
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!userProfile?.id) {
            setError("Profil utilisateur introuvable.");
            return;
        }

        if (!imagePreview) {
            setError("Veuillez sélectionner une image.");
            return;
        }

        setIsUploading(true);

        try {
            // Dans une vraie app, on uploadrait via Storage. Ici on va utiliser le base64 pour la démo locale si Storage n'est pas prêt.
            // On tente d'utiliser une compression forte pour le base64 
            let finalImageUrl = imagePreview; 
            
            if (imageFile) {
               // finalImageUrl = await uploadImageToStorage(imageFile); // Idéalement
               const blob = await compressImage(imageFile);
               const reader = new FileReader();
               reader.readAsDataURL(blob);
               finalImageUrl = await new Promise((resolve) => {
                   reader.onloadend = () => resolve(reader.result as string);
               });
            }

            const { error: insertError } = await supabase
                .from('social_posts')
                .insert({
                    user_id: userProfile.id,
                    image_url: finalImageUrl,
                    content: content || null,
                    food_name: foodName || null,
                    calories: calories ? parseInt(calories, 10) : null
                });

            if (insertError) throw insertError;

            onPostCreated();
            handleClose();

        } catch (err: any) {
            console.error(err);
            setError("Erreur lors de la publication : " + (err.message || ''));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm sm:p-0">
            <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <button onClick={handleClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-500">close</span>
                    </button>
                    <h2 className="font-extrabold text-gray-900 text-lg tracking-tight">Nouvelle Publication</h2>
                    <button 
                        onClick={handleSubmit}
                        disabled={isUploading || !imagePreview}
                        className={`font-bold text-primary px-2 transition-opacity ${(!imagePreview || isUploading) ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {isUploading ? '...' : 'Partager'}
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Image Upload Area */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full aspect-[4/5] bg-gray-50 rounded-2xl border-2 border-dashed ${imagePreview ? 'border-transparent' : 'border-gray-200'} flex flex-col items-center justify-center mb-6 overflow-hidden relative cursor-pointer group transition-all`}
                    >
                        {imagePreview ? (
                            <>
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>add_a_photo</span>
                                </div>
                                <span className="text-sm font-bold text-gray-500">Ajouter une belle photo</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleImageChange}
                            className="hidden" 
                        />
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <input 
                                type="text"
                                placeholder="Nom du plat (ex: Ndolé aux crevettes)"
                                value={foodName}
                                onChange={(e) => setFoodName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm font-bold text-gray-900 placeholder-gray-400"
                            />
                        </div>
                        <div>
                            <textarea 
                                placeholder="Ajoutez une description... Qu'est-ce qui rend ce plat spécial ?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm md:text-base text-gray-900 placeholder-gray-400 resize-none"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20">
                                <span className="material-symbols-outlined text-gray-400" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                                <input 
                                    type="number"
                                    placeholder="Calories (optionnel)"
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value)}
                                    className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-gray-900 placeholder-gray-400"
                                />
                                <span className="text-xs font-bold text-gray-400">kcal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
