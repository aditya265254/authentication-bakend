import passport  from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from '../models/user.model.js'

passport.use(
    new GoogleStrategy ({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
         callbackURL: "/api/auth/google/callback"
    },
  
    async(acessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value
            const existingUser= await User.findOne({email})
            if (existingUser) {
                return done(null, existingUser)
            }
            const newUser = await User.create({
                fullName: profile.displayName,
                email: email,
                googleId: profile.id,
                isVerified: true 
            })
            return done(null, newUser)
        } catch (error) {
            done(error, null)
        }
    }
      ),
)
passport.serializeUser((user, done) => {
    done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        done(null, user)

    } catch (error) {
        done(error, null)
    }
})

export default passport