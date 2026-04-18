import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import type { SocialPost } from '../types/social';


interface PostCardProps {
    post: SocialPost;
    onLikeToggle: (postId: string, isLiked: boolean) => void;
    onCommentClick: (postId: string) => void;
    onDeletePost?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLikeToggle, onCommentClick, onDeletePost }) => {
    const { userProfile } = useData();
    const [isLiking, setIsLiking] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    
    // Extract counts safely handling the array returned by supabase depending on the query
    const likesCount = (post.likes && post.likes[0] && Array.isArray(post.likes) ? post.likes[0].count : (post.likes as any)?.count) || 0;
    const commentsCount = (post.comments && post.comments[0] && Array.isArray(post.comments) ? post.comments[0].count : (post.comments as any)?.count) || 0;

    const handleLike = async () => {
        if (!userProfile?.id || isLiking) return;
        setIsLiking(true);
        try {
            await onLikeToggle(post.id, !!post.user_has_liked);
        } finally {
            setIsLiking(false);
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Plat de ${post.profiles?.full_name || 'un utilisateur'} sur AriaFood`,
                    text: post.content || 'Regarde ce plat !',
                    url: window.location.href, // Or a deep link if available
                });
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                alert("Lien copié dans le presse-papiers !");
            }
        } catch (error) {
           console.log("Erreur lors du partage", error);
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return "À l'instant";
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
        return `Il y a ${Math.floor(diff / 86400)} j`;
    };

    return (
        <div className="bg-white overflow-hidden mb-5 border-y border-gray-100/80"
             style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }}>
            {/* Header */}
            <div className="flex items-center px-4 py-3.5 relative">
                <div className="relative">
                    <img 
                        src={post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/notionists/svg?seed=fallback'} 
                        alt="avatar" 
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-100"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{post.profiles?.full_name || 'Utilisateur'}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{formatTimeAgo(post.created_at)}</p>
                </div>
                {userProfile?.id === post.user_id && (
                    <div>
                        <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
                            <span className="material-symbols-outlined text-xl">more_horiz</span>
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-4 top-14 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-20 min-w-[140px]"
                                     style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
                                    <button 
                                        onClick={() => {
                                            setShowMenu(false);
                                            onDeletePost?.(post.id);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2.5 rounded-xl mx-auto transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                        Supprimer
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Image */}
            <div className="relative aspect-[4/5] bg-gray-100 w-full overflow-hidden">
                {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-400 rounded-full animate-spin"></div>
                    </div>
                )}
                <img 
                    src={post.image_url} 
                    alt="Post image" 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                
                {/* Food name tag in image */}
                {post.food_name && (
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2">
                        <span className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-sm font-bold text-gray-900 shadow-lg border border-white/50 truncate max-w-[70%]">
                            {post.food_name}
                        </span>
                        {post.calories && (
                            <div className="bg-white/20 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-lg flex-shrink-0">
                                <span className="material-symbols-outlined text-orange-300 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                                <span className="text-white text-xs font-bold">{post.calories} kcal</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center px-4 pt-3.5 pb-2 gap-1">
                <button 
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all transform active:scale-90 ${
                        post.user_has_liked 
                            ? 'text-red-500 bg-red-50' 
                            : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: post.user_has_liked ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                    </span>
                    {likesCount > 0 && <span className="text-sm font-bold">{likesCount}</span>}
                </button>
                
                <button 
                    onClick={() => onCommentClick(post.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-all transform active:scale-90"
                >
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                        chat_bubble
                    </span>
                    {commentsCount > 0 && <span className="text-sm font-bold">{commentsCount}</span>}
                </button>

                <div className="flex-1"></div>

                <button 
                    onClick={handleShare}
                    className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-all transform active:scale-90"
                >
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                        share
                    </span>
                </button>
            </div>

            {/* Content / Description */}
            {post.content && (
                <div className="px-4 pb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        <span className="font-bold text-gray-900 mr-1.5">{post.profiles?.full_name}</span>
                        {post.content}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PostCard;
