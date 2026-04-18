import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import type { SocialPost } from '../types/social';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import CommentsModal from '../components/CommentsModal';

const Feed: React.FC = () => {
    const { userProfile, loading: profileLoading } = useData();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);

    const fetchPosts = async () => {
        if (!userProfile) return;
        setLoading(true);
        try {
            // Fetch posts with profiles, likes count, and comments count
            const { data, error } = await supabase
                .from('social_posts')
                .select(`
                    id, user_id, image_url, content, food_name, calories, created_at,
                    profiles (full_name, avatar_url),
                    likes:social_likes (count),
                    comments:social_comments (count)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            // Fetch the user's explicit likes to set user_has_liked
            const { data: myLikes, error: likesError } = await supabase
                .from('social_likes')
                .select('post_id')
                .eq('user_id', userProfile.id);
            
            if (likesError) throw likesError;

            const likedPostIds = new Set(myLikes?.map(like => like.post_id) || []);

            const formattedPosts = (data as any[]).map(post => ({
                ...post,
                user_has_liked: likedPostIds.has(post.id)
            }));

            setPosts(formattedPosts as SocialPost[]);
        } catch (err) {
            console.error("Error fetching feed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!profileLoading) {
            fetchPosts();
        }
    }, [userProfile, profileLoading]);

    const handleLikeToggle = async (postId: string, isLiked: boolean) => {
        if (!userProfile) return;

        // Optimistic UI Update
        setPosts(prevPosts => 
            prevPosts.map(p => {
                if (p.id === postId) {
                    const currentCount = p.likes?.[0]?.count || (p.likes as any)?.count || 0;
                    return {
                        ...p,
                        user_has_liked: !isLiked,
                        likes: [{ count: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1 }]
                    };
                }
                return p;
            })
        );

        try {
            if (isLiked) {
                // Unlike
                await supabase
                    .from('social_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', userProfile.id);
            } else {
                // Like
                await supabase
                    .from('social_likes')
                    .insert({ post_id: postId, user_id: userProfile.id });
            }
        } catch (err) {
            console.error("Error handling like", err);
            // On error, we could revert optimistic update here
        }
    };

    const handleCommentClick = (postId: string) => {
        setActiveCommentPostId(postId);
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette publication ?")) return;
        
        // Optimistic UI Update
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));

        try {
            await supabase
                .from('social_posts')
                .delete()
                .eq('id', postId);
        } catch (err) {
            console.error("Error deleting post", err);
            // On error we should fetch again or revert, simple approach: fetch all
            fetchPosts();
        }
    };

    if (profileLoading || (loading && posts.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-sm text-gray-400 mt-4 font-medium">Chargement du fil...</p>
            </div>
        );
    }

    return (
        <div className="pb-28 lg:pb-12 min-h-full" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #f8fafc 30%)' }}>
            {/* Premium Header */}
            <div className="sticky top-0 z-30 backdrop-blur-2xl border-b border-white/60 px-5 py-4 sm:px-6"
                 style={{ background: 'rgba(255,255,255,0.75)' }}>
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Communauté</h1>
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 tracking-wide">
                            {posts.length > 0 ? `${posts.length} publication${posts.length > 1 ? 's' : ''}` : 'Partagez vos plats'}
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)', boxShadow: '0 8px 24px rgba(16,185,129,0.3)' }}
                    >
                        <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_a_photo</span>
                        <span className="text-white text-sm font-bold hidden sm:inline">Publier</span>
                    </button>
                </div>
            </div>

            {/* Feed List */}
            <div className="p-4 sm:p-6 max-w-lg mx-auto">
                {posts.length === 0 ? (
                    <div className="text-center py-16">
                        {/* Empty State - Premium */}
                        <div className="w-28 h-28 mx-auto mb-6 rounded-[32px] flex items-center justify-center relative"
                             style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
                            <span className="material-symbols-outlined text-emerald-400 text-5xl" 
                                  style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-gray-100">
                                <span className="material-symbols-outlined text-emerald-500 text-lg" 
                                      style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-extrabold text-gray-900 mb-2">Le fil est vide</h3>
                        <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
                            Soyez le premier à partager un plat délicieux avec la communauté AriaFood !
                        </p>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white font-bold text-sm shadow-xl active:scale-95 transition-transform"
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)', boxShadow: '0 8px 30px rgba(16,185,129,0.35)' }}
                        >
                            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add_a_photo</span>
                            Partager mon premier plat
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {posts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                onLikeToggle={handleLikeToggle} 
                                onCommentClick={handleCommentClick} 
                                onDeletePost={handleDeletePost}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreatePostModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onPostCreated={fetchPosts} 
            />
            <CommentsModal
                postId={activeCommentPostId}
                isOpen={!!activeCommentPostId}
                onClose={() => setActiveCommentPostId(null)}
            />
        </div>
    );
};

export default Feed;
