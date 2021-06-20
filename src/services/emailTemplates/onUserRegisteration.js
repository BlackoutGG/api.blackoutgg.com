require("dotenv").config();

const aws = require("aws-sdk");

aws.config.update({
  secretAccessKey: "z1loupNgvfL66i/a+3FtkayJhJYb2YNiISiWC4z0",
  accessKeyId: "AKIAJ7VATHXK6W5EPTTA",
  region: "ca-central-1",
});

const html = `<html>
<head>
<style>
body {
  background-color: #0a0a0a;
  font-family: "sans-serif";
}

html, body {
  height: 100%;
}

.flex { 
  display: flex; 
  justify-content: center;
  height: 100%; 
  width: 100%; 
}

.card { 
  background-color: #1a1a1a;
  width: 500px;
  border-radius: 4px;
  text-align: center;
  padding: 0.75rem;
  margin: 1rem;
}

.card-header {
  text-align: center;
  padding: 1rem;
}

.card-text {
  text-align: center;
  color: white;
}

.card-action {
  padding: 1rem 0;
}

.card-btn {
  padding: 0.75rem;
  color: white;
  text-decoration: none;
  background-color: coral;
  text-transform: uppercase;
}
</style>
</head>
<body>
<div class="flex align-center">
  <div class="card">
    <div class="card-header">
      <img src="https://blackout-gaming.s3.amazonaws.com/Images/assets/280w_80h_sm.png" alt="">
    </div>
    <div class="card-text">
      <p>Thank you for registering with Blackout! Your account requires activation. Please click on the button below to complete the process.</p>
    </div>
    <div class="card-action">
      <a class="card-btn" role="button" href="{{url}}?id={{id}}&code={{code}}">Activate</a>
    </div>
  </div>
</div>
</body>
</html>
`;

const text =
  "Thank you for registering with Blackout! Your account requires activation.\n Please copy and paste the following link into your browser\n" +
  "{{url}}?id={{id}}&code={{code}}";

const params = {
  Template: {
    TemplateName: "USER_REGISTERATION",
    HtmlPart: html,
    SubjectPart: "Thank you for registering.",
    TextPart: text,
  },
};

(async function () {
  try {
    const data = await new aws.SES().updateTemplate(params).promise();
    console.log(data);
    process.exit(1);
  } catch (err) {
    console.log(err, err.stack);
    process.exit(1);
  }
})();
