// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465 ? true : false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, 
        to: options.email,        
        subject: options.subject, 
        text: options.message,    
        html: options.html       
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;