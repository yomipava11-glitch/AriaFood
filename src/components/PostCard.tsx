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
        <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_4px_30px_rgb(0,0,0,0.04)] mb-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-center px-4 py-3 relative">
                <img 
                    src={post.profiles?.avatar_url || 'https://api.dicebear.com/7.x/notionists/svg?seed=fallback'} 
                    alt="avatar" 
                    className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover"
                />
                <div className="ml-3 flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{post.profiles?.full_name || 'Utilisateur'}</h3>
                    <p className="text-[11px] text-gray-400 font-medium">{formatTimeAgo(post.created_at)}</p>
                </div>
                {userProfile?.id === post.user_id && (
                    <div>
                        <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-gray-400 hover:text-gray-900 transition-colors">
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                        {showMenu && (
                            <div className="absolute right-4 top-12 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-10 min-w-[120px]">
                                <button 
                                    onClick={() => {
                                        setShowMenu(false);
                                        onDeletePost?.(post.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    Supprimer
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Image */}
            <div className="relative aspect-[4/5] bg-gray-100 w-full overflow-hidden">
                <img 
                    src={post.image_url} 
                    alt="Post image" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                
                {/* Calories Tag inside Image if available */}
                {post.calories && (
                    <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md border border-white/40 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-lg">
                        <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                        <span className="text-white text-xs font-bold">{post.calories} kcal</span>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center px-4 pt-3 pb-2 gap-4">
                <button 
                    onClick={handleLike}
                    disabled={isLiking}
                    className={`flex items-center gap-1.5 transition-all transform active:scale-90 ${post.user_has_liked ? 'text-red-500' : 'text-gray-800'}`}
                >
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: post.user_has_liked ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                    </span>
                    <span className="text-sm font-bold">{likesCount > 0 ? likesCount : ''}</span>
                </button>
                
                <button 
                    onClick={() => onCommentClick(post.id)}
                    className="flex items-center gap-1.5 text-gray-800 transition-all transform active:scale-90"
                >
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                        chat_bubble
                    </span>
                    <span className="text-sm font-bold">{commentsCount > 0 ? commentsCount : ''}</span>
                </button>

                <div className="flex-1"></div>

                <button 
                    onClick={handleShare}
                    className="text-gray-800 transition-all transform active:scale-90"
                >
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 0" }}>
                        send
                    </span>
                </button>
            </div>

            {/* Content / Description */}
            <div className="px-4 pb-4">
                {post.food_name && (
                    <div className="mb-1">
                        <span className="font-extrabold text-sm text-gray-900">{post.food_name}</span>
                    </div>
                )}
                {post.content && (
                    <p className="text-sm text-gray-700">
                        <span className="font-bold text-gray-900 mr-2">{post.profiles?.full_name}</span>
                        {post.content}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PostCard;
