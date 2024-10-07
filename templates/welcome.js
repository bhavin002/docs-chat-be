module.exports.welcome = (name) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Email</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #4CAF50;
      color: #ffffff;
      padding: 10px;
      text-align: center;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    p {
      font-size: 16px;
      line-height: 1.5;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to techupLab!</h1>
    </div>
    <p>Dear ${name},</p>
    <p>We’re excited to have you on board! Thank you for registering with us. You can now start exploring all the amazing features we have to offer.</p>
    <p>If you have any questions or need assistance, feel free to reach out to our support team at any time.</p>
    <a href=${process.env.FRONTED_URL} class="button">Get Started</a>
    <div class="footer">
      <p>Best regards,</p>
      <p>The techupLab Team</p>
      <p>If you did not register for this account, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;