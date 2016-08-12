import User from './userModel';
import Profile from '../profile/profileModel';
import Team from '../teams/teamModel';

import rp from 'request-promise';

//some logic to query slack for slack_id and team_id
//need to register app to receive client id and client secret
let generateInfo = (token) => {

}

//auth user the first time they sign in with Slack
const authUser = (req, res) => {
  console.log('authenticating user!');
  //check for error (perhaps they declined to sign in)
  //if no error, extract code and swap for access token

  console.log('this is the req.query:', req.query);

  let options = {
    uri: 'https://slack.com/api/oauth.access',
    method:'GET',
    qs: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: req.query.code,
      redirect_uri: 'http://localhost:8080/slack/users/auth'
    }
  }

  rp(options)
    .then(body => {
      body = JSON.parse(body);

      if (body.ok) {
        console.log('response body', body);
        let teamId = body.team.id;

        //TODO: Fix nested promise structure -- this is an antipattern (PM)
        Team.findOne({ where: {slackTeamId: teamId} })
        .then((team) => {
          if (team !== null) {
            console.log('team exists:', team);
            findOrCreateUser(body, res);
          } else {
            // TODO: implement this with front end /oops page
            // this is where we handle a user that signs in but their team
            // has not yet installed bot to their slack
            console.log('Team needs to add uncle bot first!');
          }
        })
        .catch((err) => {
          console.log("Error finding team:", err);
        });
      } else {
        //redirect to handle error
        console.log('Error: ', err);
      }
    })
    .catch(err => res.redirect('/'));
}

//moved findOrCreateUser into its own function
const findOrCreateUser = (body, res) => {
  // find or create user using access token and the info from body
  let name = body.user.name;
  let accessToken = body.access_token;
  let slackUserId = body.user.id;
  let slackTeamId = body.team.id;
  let email = body.user.email;

  User.findOrCreate({
    where: { name, accessToken, slackUserId, slackTeamId, email }
  })
  .spread((user, create) => {
    created ? res.send('User created') : res.send('User already exists.');
  })
  .catch(err => res.send(err));
}

//we have a database of users based on slack bot interaction
//we should be able to find, addUser, deleteUser
const findUser = (req, res) => {
  User.findOne({
    where: {
      name: req.body.username,
      slackId: req.body.slack_id
    }
  })
  .then(user => {
    res.json(user);
  })
  .catch(err => {
    console.log('Error: ', err);
    done(err);
  });
};

//Adduser if not created, otherwise will return user info
//users need to passed as a array even if it's a single user
//accessToken is set to null initially 
const addUser = (req, res) => {
  let users = req.body.users;
  let teamId = req.body.teamId;
  let accessToken = null;

  users.forEach( ({ name, slackUserId, slackTeamId, email }) => {
    
    User.findOrCreate({
      where: { name, accessToken, slackUserId, slackTeamId, email, teamId }
    })
    .spread ((user, created) => {
      let userId = user.id;
      let name = user.name;
      let location = 'San Francisco';

      if(created) {
        console.log(user.name + ' added');
        Profile.findOrCreate({ where: { userId, name, location } })
          .spread((profile, created) => {
            created ? console.log('profile created') : console.log('profile already exists'); 
          })
          .catch(err => console.log(err));

      } else {
        console.log(user.name + ' exists');
      }

    })
    .catch(err => console.log(err));   

  });

}

const deleteUser = (req, res) => {
  User.destroy({
    where: {
      name: req.body.username,
      slackUserId: req.body.slack_id
    }
  })
  .then(user => {
    console.log('deleted user: ', user);
    res.end()
  })
  .catch(err => {
    console.log('Error: ', err);
    done(err);
  })
}


export default { findUser, addUser, deleteUser, authUser };
