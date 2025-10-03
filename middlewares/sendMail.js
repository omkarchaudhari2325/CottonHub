const nodemailer = require("nodemailer");
require("dotenv").config();

const sendVerificationEmail = async (email, username) => {
    console.log(email, username);
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        let info = await transporter.sendMail({
            from: "Cottons Hub",
            to: email,
            subject: "🌳Welcome to Cottons Hub!",
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: lightgreen; margin-bottom: 20px;">Hey ${username},</h2>
                    <p>Welcome to Cottons-Hub, your one-stop solution for cotton disease detection and management. We are delighted to have you on board!</p>

                    <p>At Cottons-Hub, we are committed to providing you with accurate and reliable information about cotton diseases. Our platform leverages cutting-edge technology to help you identify and manage these diseases effectively.</p>

                    <h3 style="margin-top: 30px; margin-bottom: 10px;">Cotton Disease Categories:</h3>
                    <ul>
                        <li>Aphids</li>
                        <li>Armyworm</li>
                        <li>Bacterial Blight</li>
                        <li>Cotton Boll Rot</li>
                        <li>Green Cotton Boll</li>
                        <li>Healthy</li>
                        <li>Powdery Mildew</li>
                        <li>Target Spot</li>
                    </ul>

                    <p>Our platform provides accurate identification and information for these eight categories of cotton diseases, enabling you to make informed decisions for your crops.</p>

                    <h3 style="margin-top: 30px; margin-bottom: 10px;">Terms and Conditions:</h3>
                    <p>By using our services, you agree to our Terms and Conditions. Please review our terms carefully on our website.</p>

                    <h3 style="margin-top: 30px; margin-bottom: 10px;">Additional Information:</h3>
                    <p>As a valued member of our community, you will receive regular updates and newsletters about the latest developments in cotton disease research, as well as tips for maintaining healthy crops.</p>

                    <p>If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!</p>

                    <p>Thank you for choosing Cottons-Hubs!</p>
                    <p>Best Regards,<br/>The Cottons-Hubs Team</p>
                </div>
            `
        });

        console.log(info);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { sendVerificationEmail };
