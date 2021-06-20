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
<div class=" flex align-center">
  <div class=" card">
    <div class=" card-header">
      <img src="https://blackout-gaming.s3.amazonaws.com/Images/assets/280w_80h_sm.png" alt="">
    </div>
    <div class=" card-text">
      <p>There has been a email change requested. If you didn't request this, please disregard. This request is good for 10 minutes.</p>
      <p>Click on the button below to complete the request.
    </div>
    <div class=" card-action">
      <a class="card-btn" href="{{url}}?id={{id}}&code={{code}}">Verify</a>
    </div>
  </div>
</div>
</body>
</html>
`;

const text =
  "There has been a email change requested. If you didn't request this, please disregard. This request is good for 10 minutes.\n" +
  "Copy and paste the following into your browser to complete the request. \n" +
  "{{url}}?id={{id}}&code={{code}}";

const params = {
  Template: {
    TemplateName: "CHANGE_EMAIL",
    HtmlPart: html,
    SubjectPart: "A request for an email address change.",
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
