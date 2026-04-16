import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

interface Comment {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
    };
}

interface CommentsModalProps {
    postId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ postId, isOpen, onClose }) => {
    const { userProfile } = useData();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && postId) {
            fetchComments();
            setTimeout(() => inputRef.current?.focus(), 300);
        } else {
            setComments([]);
            setNewComment('');
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('social_comments')
                .select(`
                    id, user_id, content, created_at,
                    profiles (full_name, avatar_url)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments((data as any[]) || []);
            // Scroll to bottom
            setTimeout(() => {
                if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
            }, 100);
        } catch (err) {
            console.error("Error fetching comments:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newComment.trim() || !postId || !userProfile?.id || sending) return;
        setSending(true);
        try {
            const { error } = await supabase
                .from('social_comments')
                .insert({
                    post_id: postId,
                    user_id: userProfile.id,
                    content: newComment.trim()
                });

            if (error) throw error;
            setNewComment('');
            await fetchComments();
        } catch (err) {
            console.error("Error sending comment:", err);
        } finally {
            setSending(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await supabase.from('social_comments').delete().eq('id', commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error("Error deleting comment:", err);
        }
    };

    const formatTime = (dateStr: string) => {
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return "à l'instant";
        if (diff < 3600) return `${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
        return `${Math.floor(diff / 86400)} j`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white rounded-t-[32px] max-h-[75vh] flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle Bar */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-gray-300"></div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
                    <h3 className="text-base font-extrabold text-gray-900">Commentaires</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-400 text-xl">close</span>
                    </button>
                </div>

                {/* Comments List */}
                <div ref={listRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-hide min-h-[200px]">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined text-gray-200 text-5xl mb-3 block">chat_bubble</span>
                            <p className="text-sm text-gray-400 font-medium">Aucun commentaire pour l'instant.</p>
                            <p className="text-xs text-gray-300 mt-1">Soyez le premier à commenter !</p>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="flex gap-3 group">
                                <img 
                                    src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${comment.user_id}`}
                                    alt="" 
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 border border-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-gray-900">{comment.profiles?.full_name || 'Utilisateur'}</span>
                                        <span className="text-[10px] text-gray-400">{formatTime(comment.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-0.5 break-words">{comment.content}</p>
                                </div>
                                {/* Delete button for own comments */}
                                {comment.user_id === userProfile?.id && (
                                    <button 
                                        onClick={() => handleDeleteComment(comment.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all self-start"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <img 
                        src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile?.id}`}
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 flex items-center bg-white rounded-full border border-gray-200 px-4 py-2.5 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Ajouter un commentaire..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 p-0 focus:ring-0"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!newComment.trim() || sending}
                            className={`ml-2 transition-all ${newComment.trim() ? 'text-primary' : 'text-gray-300'}`}
                        >
                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentsModal;
