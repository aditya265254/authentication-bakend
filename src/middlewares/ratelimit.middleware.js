import redisClient from '../config/redis.js'

export const redisRateLimiter = (limit = 5, windowInSeconds = 60) => {
    return async (req, res, next) => {
        try {
            const identifier = req.user ? req.user.id : req.ip
            const key = `ratelimit:${identifier}`

            const requests = await redisClient.incr(key)

            if (requests === 1) {
                await redisClient.expire(key, windowInSeconds)
            }

            if (requests > limit) {
                return res.status(429).json({
                    success: false,
                    message: "Too many attempts, please try again later"
                })
            }

            next()
        } catch (error) {
            console.error("Rate limiter error:", error)
            next()
        }
    }
}

export const loginRateLimiter = (limit = 5, windowInSeconds = 900) => {
    return async (req, res, next) => {
        try {
            const email = req.body?.email || req.user?.email
            const ip = req.ip

            const emailKey = `ratelimit:email:${email}`
            const ipKey = `ratelimit:ip:${ip}`

            const [emailCount, ipCount] = await Promise.all([
                redisClient.incr(emailKey),
                redisClient.incr(ipKey)
            ])

            if (emailCount === 1) await redisClient.expire(emailKey, windowInSeconds)
            if (ipCount === 1) await redisClient.expire(ipKey, windowInSeconds)

            if (emailCount > limit || ipCount > limit) {
                // ← Google OAuth check
                const isGoogleRequest = req.path.includes('google')

                if (isGoogleRequest) {
                    return res.redirect(
                        `${process.env.FRONTEND_URL}/login?error=Too many attempts. Try again after ${windowInSeconds / 60} minutes`
                    )
                }

                return res.status(429).json({
                    success: false,
                    message: `Too many attempts. Try again after ${windowInSeconds / 60} minutes`
                })
            }

            next()
        } catch (error) {
            console.error("Rate limiter error:", error)
            next()
        }
    }
}