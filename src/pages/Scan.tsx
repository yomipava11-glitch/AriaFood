import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MOCK_ANALYSIS_V2 } from '../data/mockData';
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

const Scan: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [photoData, setPhotoData] = useState<string | null>(null);
    const [status, setStatus] = useState<'STARTING' | 'IDLE' | 'CAMERA_ACTIVE' | 'ANALYZING'>('STARTING');
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Check if device has multiple cameras
    useEffect(() => {
        navigator.mediaDevices?.enumerateDevices().then(devices => {
            const videoInputs = devices.filter(d => d.kind === 'videoinput');
            setHasMultipleCameras(videoInputs.length > 1);
        }).catch(() => {});
    }, []);

    // Start camera on mount
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async (mode?: 'environment' | 'user') => {
        stopCamera();
        setCameraError(null);
        const selectedMode = mode || facingMode;

        try {
            if (Capacitor.isNativePlatform()) {
                await Camera.requestPermissions();
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: selectedMode }, width: { ideal: 1280 }, height: { ideal: 960 } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setStatus('CAMERA_ACTIVE');
                setFacingMode(selectedMode);
            }
        } catch (err: any) {
            console.error("Camera error:", err);
            setCameraError("Impossible d'accéder à la caméra. Utilisez l'import de fichier.");
            setStatus('IDLE');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const switchCamera = () => {
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        startCamera(newMode);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Limiter la résolution pour réduire la taille du base64
                const MAX_DIM = 800;
                let w = video.videoWidth;
                let h = video.videoHeight;
                if (w > MAX_DIM || h > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }
                canvas.width = w;
                canvas.height = h;

                // Mirror if front camera
                if (facingMode === 'user') {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }

                ctx.drawImage(video, 0, 0, w, h);
                const data = canvas.toDataURL('image/jpeg', 0.6);
                setPhotoData(data);
                stopCamera();
                setStatus('IDLE');
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Compresser l'image importée via canvas
        const img = new Image();
        img.onload = () => {
            const MAX_DIM = 800;
            let w = img.width;
            let h = img.height;
            if (w > MAX_DIM || h > MAX_DIM) {
                const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            setPhotoData(compressed);
            stopCamera();
            setStatus('IDLE');
        };
        img.src = URL.createObjectURL(file);
    };

    const retake = () => {
        setPhotoData(null);
        setCameraError(null);
        startCamera();
    };

    const runAIAnalysis = async () => {
        if (!photoData) return;
        setStatus('ANALYZING');

        try {
            const { data, error } = await supabase.functions.invoke('analyze-food', {
                body: { image: photoData }
            });

            if (error) throw error;

            if (data && data.error) {
                console.error('AI Error:', data);
                throw new Error(data.error);
            }

            navigate('/scan/results', {
                state: { result: { ...data, image_url: photoData } }
            });
        } catch (err: any) {
            console.error('AI Analysis Error:', err);
            alert(`L'analyse a échoué. Utilisation des données de démo.`);
            navigate('/scan/results', { state: { result: MOCK_ANALYSIS_V2 } });
        } finally {
            setStatus('IDLE');
        }
    };

    return (
        <div className="min-h-full pb-36 lg:pb-12 flex flex-col px-4 sm:px-6 lg:px-8 pt-6 select-none bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => { stopCamera(); navigate(-1); }}
                    className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl shadow-sm hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-gray-600 text-xl">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-gray-900">Scanner</h1>
                    <p className="text-xs text-gray-400">Analysez votre repas</p>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Camera Viewfinder */}
            <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full">
                <div className="w-full aspect-[4/3] rounded-3xl relative overflow-hidden bg-gray-900 border border-gray-200 shadow-lg">
                    
                    {/* Video Feed */}
                    <video ref={videoRef} autoPlay playsInline muted
                        className={`w-full h-full object-cover transition-opacity duration-300 ${status === 'CAMERA_ACTIVE' ? 'opacity-100' : 'opacity-0 absolute'}`}
                        style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : {}}
                    />

                    {/* Captured Photo */}
                    {photoData && status !== 'CAMERA_ACTIVE' && (
                        <img src={photoData} alt="captured" className="w-full h-full object-cover" />
                    )}

                    {/* Camera Error State */}
                    {cameraError && !photoData && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-3">no_photography</span>
                            <p className="text-sm text-gray-300 mb-4">{cameraError}</p>
                            <button onClick={() => fileInputRef.current?.click()}
                                className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                                Importer une photo
                            </button>
                        </div>
                    )}

                    {/* Idle State (no camera, no photo) */}
                    {(status === 'IDLE' || status === 'STARTING') && !photoData && !cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                            <span className="material-symbols-outlined text-5xl text-gray-500 mb-3">photo_camera</span>
                            <p className="text-sm text-gray-400">Démarrage de la caméra...</p>
                        </div>
                    )}

                    {/* Analyzing Overlay */}
                    {status === 'ANALYZING' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                            <div className="w-14 h-14 border-3 border-gray-600 border-t-emerald-400 rounded-full animate-spin mb-4"></div>
                            <p className="text-white text-sm font-semibold">Analyse en cours...</p>
                            <p className="text-gray-400 text-xs mt-1">AriaFood identifie votre repas</p>
                        </div>
                    )}

                    {/* Corner Guides (when camera active) */}
                    {status === 'CAMERA_ACTIVE' && (
                        <div className="absolute inset-0 pointer-events-none z-10 p-6">
                            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-xl"></div>
                            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-xl"></div>
                            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-xl"></div>
                            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-xl"></div>
                        </div>
                    )}

                    {/* Camera Controls Overlay (when camera active) */}
                    {status === 'CAMERA_ACTIVE' && (
                        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/50 to-transparent z-20 flex items-center justify-center gap-8">
                            {/* File import */}
                            <button onClick={() => fileInputRef.current?.click()}
                                className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition">
                                <span className="material-symbols-outlined text-white text-lg">photo_library</span>
                            </button>
                            
                            {/* Capture button */}
                            <button onClick={capturePhoto}
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform">
                                <div className="w-12 h-12 bg-white rounded-full hover:bg-gray-100 transition"></div>
                            </button>

                            {/* Switch camera */}
                            {hasMultipleCameras && (
                                <button onClick={switchCamera}
                                    className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition">
                                    <span className="material-symbols-outlined text-white text-lg">cameraswitch</span>
                                </button>
                            )}
                            {!hasMultipleCameras && <div className="w-10"></div>}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 w-full space-y-3">
                    {/* No photo, no camera */}
                    {!photoData && status === 'IDLE' && (
                        <>
                            <button onClick={() => startCamera()}
                                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all">
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                                    Réessayer la caméra
                                </span>
                            </button>
                            <button onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all">
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">upload</span>
                                    Importer une photo
                                </span>
                            </button>
                        </>
                    )}

                    {/* Photo captured - show analyze/retake */}
                    {photoData && status === 'IDLE' && (
                        <>
                            <button onClick={runAIAnalysis}
                                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all">
                                <span className="flex items-center justify-center gap-2">
                                    <img src="/logo.png" alt="logo" className="w-[18px] h-[18px] object-contain brightness-0 invert" />
                                    Analyser le repas
                                </span>
                            </button>
                            <button onClick={retake}
                                className="w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all">
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-lg">refresh</span>
                                    Reprendre la photo
                                </span>
                            </button>
                        </>
                    )}

                    {/* Analyzing state */}
                    {status === 'ANALYZING' && (
                        <div className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-sm text-center">
                            Analyse en cours...
                        </div>
                    )}
                </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        </div>
    );
};

export default Scan;
