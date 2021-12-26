const aws = require("aws-sdk");

module.exports = async function (address, template, templateData) {
  console.log(address);

  const params = {
    Destination: {
      ToAddresses: [address],
    },
    Source: "NOREPLY <noreply@blackout.team>",
    Template: template,
    TemplateData: JSON.stringify(templateData),
    ReplyToAddresses: ["noreply@blackout.team"],
  };

  try {
    const data = await new aws.SES().sendTemplatedEmail(params).promise();
    console.log(data);
  } catch (err) {
    console.error(err, err.stack);
  }
};
