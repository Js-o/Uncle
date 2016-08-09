import Botkit from 'botkit';
import dotenv from 'dotenv';
dotenv.config();

const controller = Botkit.slackbot({
  debug: false
});

controller.spawn({
  //Create .env file in the root directory and add SLACK_BOT_TOKEN
  token: process.env.SLACK_BOT_TOKEN
}).startRTM();

controller.hears('', ['direct_message'], function(bot, message) {
  console.log('replying to message');
  let responses = ["Yooo It's your boi JBuxxx, wats good?"]
  bot.reply(message, responses[0]);
});


