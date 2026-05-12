const sendEmail = async ({ to, subject, url }) => {
    
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Matchme - Login</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="background-color: #214A49; padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #BFAE7D; font-size: 32px; font-weight: 600; letter-spacing: 1px;">Matchme</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: #214A49; font-size: 24px; font-weight: 600;">Welcome Back!</h2>
                                <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                    Click the button below to securely log in to your Matchme account. This link is unique to you and will expire in 24 hours for your security.
                                </p>
                                <table role="presentation" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${url}" style="display: inline-block; padding: 16px 40px; background-color: #BFAE7D; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">Log In to Matchme</a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="margin: 20px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                                    If you didn't request this login link, please ignore this email or contact our support team if you have concerns.
                                </p>
                                <div style="margin: 30px 0; height: 1px; background-color: #e0e0e0;"></div>
                                <p style="margin: 0; color: #888888; font-size: 13px; line-height: 1.6;">Or copy and paste this link into your browser:</p>
                                <p style="margin: 10px 0 0 0; color: #BFAE7D; font-size: 12px; word-break: break-all;">${url}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                                <p style="margin: 0 0 10px 0; color: #888888; font-size: 14px;">© 2024 Matchme. All rights reserved.</p>
                                <p style="margin: 0; color: #aaaaaa; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Matchme" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject || "Complete your profile",
            text: `Log in to Matchme: ${loginUrl}`,
            html: htmlTemplate,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (err) {
        console.error("Error while sending mail:", err);
        throw err;
    }
};