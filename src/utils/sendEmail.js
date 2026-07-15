 import nodemailer from "nodemailer"

const sendVerificationEmail = async (email, token) => {
    try {
        
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

      
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Email Verification Required",
            html: `
                <h2>Welcome to Our App!</h2>
                <p>Click the button below to verify your email:</p>
                <a href="${verificationLink}" style="background: blue; color: white; padding: 10px; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>Or copy this link: ${verificationLink}</p>
            `
        };

    
        await transporter.sendMail(mailOptions);
        console.log("Email successfully sent!");

    } catch (error) {
        console.error("Email send karne me dikkat aayi:", error);
        throw new Error("Email sending failed");
    }
};


export default sendVerificationEmail;

