import Team from '../models/teamModel';
import rp from 'request-promise';

const addTeam = (req, res) => {
  let code = req.query.code;
  let options = {
    uri: 'https://slack.com/api/oauth.access',
    method:'GET',
    qs: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
      redirect_uri: 'http://localhost:8080/slack/teams/auth'
    },
    json: true
  }

  rp(options)
  .then((body) => {
    if (body.ok) {
      let slackTeamData = {
        slackTeamToken: body.access_token,
        slackTeamName: body.team_name,
        slackTeamId: body.team_id,
        slackBotId: body.bot.bot_user_id,
        slackBotToken: body.bot.bot_access_token
      }
      return slackTeamData;
    } else {
      console.log('Error obtaing tokens from Slack');
      //TODO: redirect to error page due to failed respone request to slack
      res.redirect('/');
    }
  })
  .then((slackTeamData) => {
    return Team.create(slackTeamData)
  }) 
  .then((team) => {
    findTeamUsers(team);
    res.redirect('/');
  })
  .catch((err) => {
    console.log("Error while adding Slack Team:", err);
    res.redirect('/') /* due to failed request to slack */ 
  });

} 


const findTeamUsers = (team) => {
  let teamId = team.dataValues.id;
  let token = team.dataValues.slackBotToken;

  let teamUsersData = {
    uri: 'https://slack.com/api/users.list',
    method: 'GET',
    qs: { token }
  }

  rp(teamUsersData)
  .then(body => {
    body = JSON.parse(body);
    if (body.ok) {
      let users = parseUsersInfo(body.members);
      let usersData = { 
        url: 'http://localhost:8080/slack/users',
        method: 'POST',
        json: { users, teamId } 
      }
      return rp(usersData);
    } else {
      //TODO: redirect to error page
      res.redirect('/');
    }
  }) 
  .catch((err) => {
    console.log(err)
    //TODO: redirect to error page
    res.redirect('/');
  });
}

const parseUsersInfo = (users) => {
  return users.filter((user) => {
    // Slack bot is considered a bot so it needs to be omitted
    return user.is_bot === false && user.id !== 'USLACKBOT'
  })
  .map((user) => {
    return { 
      name: user.name,
      slackUserId : user.id, 
      slackTeamId: user.team_id,
      email: user.profile.email
    };
  });
}

export default { addTeam };