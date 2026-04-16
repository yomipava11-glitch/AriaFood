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
            <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="pb-10 bg-gray-50 min-h-full">
            {/* Header Sticky */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 sm:px-6 flex items-center justify-between">
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Communauté</h1>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white transform active:scale-90 transition-transform"
                >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                </button>
            </div>

            {/* Feed List */}
            <div className="p-4 sm:p-6 max-w-lg mx-auto">
                {posts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-gray-300 text-4xl">no_photography</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Aucune publication</h3>
                        <p className="text-sm text-gray-500 mb-6">Soyez le premier à partager votre plat avec la communauté !</p>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-primary text-white font-bold py-3 px-6 rounded-2xl shadow-lg active:scale-95 transition-transform"
                        >
                            Publier un plat
                        </button>
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            onLikeToggle={handleLikeToggle} 
                            onCommentClick={handleCommentClick} 
                            onDeletePost={handleDeletePost}
                        />
                    ))
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
