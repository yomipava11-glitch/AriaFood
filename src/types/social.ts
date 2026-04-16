export interface SocialPost {
    id: string;
    user_id: string;
    image_url: string;
    content: string | null;
    food_name: string | null;
    calories: number | null;
    created_at: string;
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
    };
    likes?: { count: number }[];
    comments?: { count: number }[];
    user_has_liked?: boolean;
}
