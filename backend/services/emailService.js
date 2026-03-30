import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(` Email sent to ${to}`);
  } catch (error) {
    console.error(" Email error:", error);
    throw error;
  }
};

export const sendApprovalEmail = (email, classroomName, time) => {
  const html = `
    <h2>Classroom Request Approved</h2>
    <p>Your classroom request has been approved!</p>
    <p><strong>Classroom:</strong> ${classroomName}</p>
    <p><strong>Time:</strong> ${time}</p>
    <p>Please arrive 5 minutes early.</p>
  `;
  return sendEmail(email, "Classroom Request Approved", html);
};

export const sendRejectionEmail = (email, classroomName, reason) => {
  const html = `
    <h2>Classroom Request Rejected</h2>
    <p>Unfortunately, your classroom request was not approved.</p>
    <p><strong>Classroom:</strong> ${classroomName}</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please try booking another time slot.</p>
  `;
  return sendEmail(email, "Classroom Request Rejected", html);
};

export const sendRequestNotificationEmail = (
  email,
  classroomName,
  requesterName,
  course,
) => {
  const html = `
    <h2>New Classroom Request</h2>
    <p>A new classroom request has been submitted for approval.</p>
    <p><strong>Classroom:</strong> ${classroomName}</p>
    <p><strong>Requester:</strong> ${requesterName}</p>
    <p><strong>Course:</strong> ${course}</p>
    <p>Please review and approve/reject this request.</p>
  `;
  return sendEmail(email, "New Classroom Request for Review", html);
};
