//***************** CONNECTION QUERIES **********//
const PROPOSE_CONNECTION = `INSERT INTO contacts (memberid_a, memberid_b)
                 SELECT $1, $2
                 WHERE NOT EXISTS(
                             SELECT memberid_a, memberid_b
                             FROM contacts
                             WHERE memberid_a = $1 and memberid_b = $2
                                OR memberid_a = $2 and memberid_b = $1
                     );`;

const ACCEPT_CONNECTION = `UPDATE contacts SET verified = 1
                       WHERE verified = 0
                               AND (memberid_a = $1 AND "memberid_b" = $2)
                          OR (memberid_a = $2 AND memberid_b = $1);`;

const FIND_UNIQUE_CONTACT = `SELECT memberid, firstname, lastname, username, email FROM members where username~*$1 OR email~*$1;`;

const FIND_CONTACT_BYREST = `SELECT memberid, firstname, lastname, username, email FROM members WHERE firstname ilike $1
                                                                                                OR lastname ilike $1
                                                                                                OR username ilike  $1`;

const GET_ALL_CONTACTS = `SELECT Members.email, Members.memberid, Members.firstname, Members.lastname, Members.username, Contacts.verified
                           FROM Members
                                  INNER JOIN Contacts
                                    ON (Members.MemberID = Contacts.memberid_a AND Contacts.memberid_b = $1)
                                         OR (Members.MemberID = Contacts.memberid_b AND Contacts.memberid_a = $1);`;

CONNECTION_QUERIES = {PROPOSE_CONNECTION, ACCEPT_CONNECTION, FIND_UNIQUE_CONTACT, FIND_CONTACT_BYREST, GET_ALL_CONTACTS};

//***************** MESSAGING QUERIES **********//

const GET_CHATID_BY_NAME = `SELECT chatid FROM chats WHERE name =$1`;

const ADD_MEMBERS_TO_CHATROOM = `INSERT into chatmembers(chatid, memberid) VALUES($1, $2),($3, $4)`;

const CREATE_CHATROOM = `INSERT into chats(name) VALUES($1)`;

const INSERT_MESSAGE = `INSERT INTO Messages(ChatId, Message, MemberId)
                  SELECT $1, $2, MemberId FROM Members
                  WHERE email=$3;`;

const GET_ALL_MESSAGES_BY_CHATID = `SELECT Members.Email, Messages.Message, Members.memberid,
                        to_char(Messages.Timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US' ) AS Timestamp
                 FROM Messages
                        INNER JOIN Members ON Messages.MemberId=Members.MemberId
                 WHERE ChatId=$1
                 ORDER BY Timestamp DESC;`;

const GET_ALL_TOKENS_IN_A_CHAT = `SELECT token FROM fcm_token JOIN chatmembers on chatmembers.memberid = fcm_token.memberid WHERE chatmembers.chatid = 10;`;

MESSAGING_QUERIES = {GET_CHATID_BY_NAME, CREATE_CHATROOM, ADD_MEMBERS_TO_CHATROOM, INSERT_MESSAGE, GET_ALL_MESSAGES_BY_CHATID, GET_ALL_TOKENS_IN_A_CHAT};


const VERIFY_USER_ACCOUNT = "UPDATE members SET verification = 1 WHERE email =$1";

const INSERT_NEW_MEMBER = 'INSERT INTO MEMBERS(FirstName, LastName, Username, Email, Password, Salt) VALUES ($1, $2, $3, $4, $5, $6)';

const GET_FB_TOKEM_BY_EMAIL = 'SELECT fcm_token.token FROM fcm_token JOIN Members on Members.memberid = fcm_token.memberid WHERE Members.email = $1;';

const GET_USERDATA_BY_EMAIL = 'SELECT memberid, firstname, lastname, username, email, verification FROM Members WHERE Email=$1';

MISC_QUERIES = {VERIFY_USER_ACCOUNT, INSERT_NEW_MEMBER, GET_FB_TOKEM_BY_EMAIL, GET_USERDATA_BY_EMAIL};

module.exports = {
    CONNECTION_QUERIES, MESSAGING_QUERIES, MISC_QUERIES
};