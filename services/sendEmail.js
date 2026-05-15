const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, url, fullName }) => {
    
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MatchMe Silver Circle</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <!-- Logo Header -->
                        <tr>
                            <td style="background-color: #214A49; padding: 30px; text-align: center;">
                                <img src="${'https://silvercircleapi.matchmeglobal.com/public/logo.png'}" alt="MatchMe Silver Circle" style="max-width: 200px; height: auto; display: block; margin: 0 auto 15px auto;" />
                                <h1 style="margin: 0; color: #BFAE7D; font-size: 28px; font-weight: 600; letter-spacing: 1px;">MatchMe Silver Circle</h1>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <p style="margin: 0 0 20px 0; color: #214A49; font-size: 16px; font-weight: 600; text-align: center;">
                                    Thank you for showing your interest in MatchMe Silver Circle!!
                                </p>
                                
                                <p style="margin: 0 0 10px 0; color: #214A49; font-size: 16px; font-weight: 600;">
                                    Dear ${fullName},
                                </p>
                                
                                <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                    Greetings of the day!
                                </p>
                                
                                <p style="margin: 0 0 25px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                    Further to our interaction, if you are interested in our services, please fill your information on the below link and join the network.
                                </p>
                                
                                <!-- CTA Button -->
                                <table role="presentation" style="margin: 30px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${url}" style="display: inline-block; padding: 16px 40px; background-color: #BFAE7D; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px;">Fill Your Information</a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 25px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                    You can pay our membership fee through cheque/bank transfer/UPI. Details for the same will be shared later.
                                </p>
                                
                                <p style="margin: 20px 0 5px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                    Thank and Regards
                                </p>
                                
                                <p style="margin: 5px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                                    With all good wishes
                                </p>
                                
                                <p style="margin: 15px 0 5px 0; color: #214A49; font-size: 16px; font-weight: 600;">
                                    Mishi and Tania
                                </p>
                                
                                <p style="margin: 0; color: #214A49; font-size: 15px;">
                                    9810069813 / 9818185905
                                </p>
                                
                                <div style="margin: 30px 0; height: 1px; background-color: #e0e0e0;"></div>
                                
                                <p style="margin: 0; color: #888888; font-size: 13px; line-height: 1.6;">Or copy and paste this link into your browser:</p>
                                <p style="margin: 10px 0 0 0; color: #BFAE7D; font-size: 12px; word-break: break-all;">${url}</p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                                <p style="margin: 0 0 10px 0; color: #888888; font-size: 14px;">© ${new Date().getFullYear()} MatchMe Silver Circle. All rights reserved.</p>
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
            from: `"MatchMe Silver Circle" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject || "Join MatchMe Silver Circle Network",
            text: `Dear ${fullName}, Thank you for showing interest in MatchMe Silver Circle. Please fill your information at: ${url}`,
            html: htmlTemplate,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (err) {
        console.error("Error while sending mail:", err);
        throw err;
    }
};


module.exports = {
    sendEmail
}