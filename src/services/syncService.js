import redisClient from '../config/redis.js';
import PostModel from '../models/post.model.js';

export const startLikeSyncWorker = () => {
    setInterval(async () => {
        try {
            const postIds = await redisClient.sMembers('modified:posts');
            if (postIds.length === 0) return;

            console.log(`🔄 Syncing likes for ${postIds.length} posts from Redis to MongoDB...`);

            for (const postId of postIds) {
                const likedUsersKey = `post:${postId}:liked_users`;
                const userIds = await redisClient.sMembers(likedUsersKey);

                await PostModel.findByIdAndUpdate(postId, {
                    $set: { likes: userIds }
                });
            }

            await redisClient.del('modified:posts');
            console.log('✅ Likes synced successfully to MongoDB!');

        } catch (error) {
            console.error('❌ Error in background like sync:', error);
        }
    }, 10000); 
};