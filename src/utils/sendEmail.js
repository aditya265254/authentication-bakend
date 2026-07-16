import nodemailer from 'nodemailer';

const sendVerificationEmail = async (email, token) => {
    try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        
        const mailOptions = {
            from: `"Auth App" <${process.env.EMAIL_USER}>`,
            to: email, // Yahan ab local par test karte waqt kisi ka bhi mail ID daal sakte ho!
            subject: 'Email Verification Required',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Welcome to Auth App!</h2>
                    <p style="font-size: 16px; color: #333333;">Thank you for registering. Please verify your email address to complete your registration account setup.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Verify Email Address
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #666666; text-align: center;">If you didn't request this email, you can safely ignore it.</p>
                </div>
            `
        };

        // 3. Send email execution
        const info = await transporter.sendMail(mailOptions);
        console.log("Email successfully dispatched via Gmail SMTP! MessageId:", info.messageId);
        
    } catch (error) {
        console.error("Nodemailer internal error detected:", error);
        
        throw new Error("Gmail SMTP transmission failed.");
    }
};

export default sendVerificationEmail;