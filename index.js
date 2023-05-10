const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const imapConfig = {
  user: process.env.EMAIL,
  password: process.env.APP_PASSWORD,
  host: process.env.IMAP_HOST,
  port: 993,
  tls: true,
};

const getEmails = () => {
  try {
    const imap = new Imap(imapConfig);
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
          if (err) {
            return Promise.reject(err);
          }

          const f = imap.fetch(results, { bodies: '' });
          f.on('message', msg => {
            msg.on('body', stream => {
              simpleParser(stream, async (err, parsed) => {
                console.log(parsed.subject);
              });
            });
            msg.once('attributes', attrs => {
              const {uid} = attrs;
              imap.addFlags(uid, ['\\Seen'], () => {
                console.log('Marked as read!');
              });
            });
          });
          f.once('error', (err) => {
            return Promise.reject(err);
          });
          f.once('end', () => {
            console.log('Done fetching all messages!');
            imap.end();
          });
        });
      });
    });

    imap.once('error', err => {
      console.log(err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
    });

    imap.connect();
  } catch (err) {
    console.error(`An error occurred: ${err?.message || err}`);
  }
};

getEmails();