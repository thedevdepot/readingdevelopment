const nodemailer = require('nodemailer');
const { normalizePrincipal, parsePrincipalHeader } = require('../_shared/cosmos-auth');

function isValidEmail(value) {
  const email = String(value || '').trim();
  if (!email) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Email service is not configured.');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  return cachedTransporter;
}

module.exports = async function (context, req) {
  const principal = parsePrincipalHeader(req);
  const auth = normalizePrincipal(principal);

  if (!auth.authenticated) {
    context.res = {
      status: 401,
      body: {
        sent: false,
        reason: 'not-authenticated',
        message: 'Sign in is required before sending email.'
      }
    };
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const to = String(body.to || '').trim();
    const cc = String(body.cc || '').trim();
    const subject = String(body.subject || '').trim();
    const text = String(body.body || '').trim();

    if (!isValidEmail(to)) {
      context.res = {
        status: 400,
        body: {
          sent: false,
          reason: 'invalid-to',
          message: 'Please provide a valid recipient email.'
        }
      };
      return;
    }

    if (!isValidEmail(cc)) {
      context.res = {
        status: 400,
        body: {
          sent: false,
          reason: 'invalid-cc',
          message: 'Unable to validate your account email for CC.'
        }
      };
      return;
    }

    if (!subject || !text) {
      context.res = {
        status: 400,
        body: {
          sent: false,
          reason: 'missing-content',
          message: 'Email subject and content are required.'
        }
      };
      return;
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
    const transporter = getTransporter();

    await transporter.sendMail({
      from: fromAddress,
      to,
      cc,
      subject,
      text,
      replyTo: auth.user.email
    });

    context.res = {
      status: 200,
      body: {
        sent: true,
        to,
        cc
      }
    };
  } catch (error) {
    context.log.error('Share progress API failure', error);
    context.res = {
      status: 500,
      body: {
        sent: false,
        reason: 'send-failed',
        message: 'Email could not be sent right now.'
      }
    };
  }
};
