import user from '../Users/UserController';
import profile from '../Profile/ProfileController';

module.exports = (app, express) => {
  //////////////////
  //Handling Users
  //////////////////
  app.get('/Slack/users', user.findUser);
  app.post('/Slack/users', user.addUser);
  app.delete('/Slack/users', user.deleteUser);

  //////////////////
  //Handling Profile
  //////////////////
  app.get('/Slack/users/profile', profile.findProfile);
  app.post('/Slack/users/profile', profile.addProfile);
  app.delete('/Slack/users/profile', profile.deleteProfile);
  
}