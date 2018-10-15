const tmi = require("tmi.js");
const config = require("./config");
const emojo = require("node-emoji");

const smileEmoji = emojo.get(":smile:");

console.log("MostAwesomeBot started!");

// Valid commands start with:
let commandPrefix = "!";

// Define configuration options:
let opts = {
  options: {
    debug: true,
    clientId: config.TWITCH_CLIENT_ID
  },
  connection: {
    reconnect: true,
    secure: true,
    port: 443
  },
  identity: {
    username: "YOUR_BOT_USERNAME",
    password: `oauth:${config.TWITCH_OAUTH}`
  },
  channels: ["#YOUR_CHANNEL"]
};

// These are the commands the bot knows (defined below):
let knownCommands = { echo, timer, help };

// target === channel
// context === user
// params === "words"

// Function called when the "echo" command is issued:
// this will echo out any text that is passed in
// !echo hello world
function echo(target, context, params) {
  // If there's something to echo:
  if (params.length) {
    // Join the params into a string:
    const msg = params.join(" ");

    const message = `${cleanMessage(msg)} ${smileEmoji}`;
    // Send it back to the correct place:
    sendMessage(target, context, message);
  } else {
    // Nothing to echo
    console.log(`* Nothing to echo`);
  }
}

// will count down and print out when timer (in seconds) up 
// !timer 10 
function timer(target, context, params) {
  if (params.length) {
    const time = params[0];
    const isNotNumber = isNaN(parseInt(time));

    if (isNotNumber) {
      // we should tell them it's not a number
      const message = `Hey @${context.username} please use like this: !timer 1`;
      console.log(`${time}: is not a number.`);
      sendMessage(target, context, message);
    } else {
      const message = `Hey @${context.username} the time is up!`;
      const timeInMs = time * 1000;
      console.log(`time:${time} seconds`);
      setTimeout(sendMessage.bind(null, target, context, message), timeInMs);

      // do the do
    }
  }
}

// this prints out all commands the bot supports
// !help
function help(target, context) {
  const commands = Object.keys(knownCommands);

  let commandList = "";
  commands.forEach(command => {
    commandList += ` !${command}`;
  });

  const message = `We support the following commands: ${commandList}`;
  sendMessage(target, context, message);
}

function cleanMessage(message) {
  // strip off command prefix
  // strip off slash
  // strip off @
  // strip off .
  message = findAndReplace(message, commandPrefix, "");
  message = findAndReplace(message, "/", "");
  message = findAndReplace(message, ".", "");
  message = findAndReplace(message, "@", "");
  return message;
}

// this will find and replace all instances of a string
function findAndReplace(string, target, replacement) {
  var i = 0,
    length = string.length;

  for (i; i < length; i++) {
    string = string.replace(target, replacement);
  }

  return string;
}

// Helper function to send the correct type of message:
function sendMessage(target, context, message) {
  if (context["message-type"] === "whisper") {
    client.whisper(target, message);
  } else {
    client.say(target, message);
  }
}

// Create a client with our options:
let client = new tmi.client(opts);

// Register our event handlers (defined below):
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);
client.on("disconnected", onDisconnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in:
function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  } // Ignore messages from the bot

  // This isn't a command since it has no prefix:
  if (msg.substr(0, 1) !== commandPrefix) {
    console.log(
      `[${target} (${context["message-type"]})] ${context.username}: ${msg}`
    );
    return;
  }

  // Split the message into individual words:
  const parse = msg.slice(1).split(" ");
  // The command name is the first (0th) one:
  const commandName = parse[0];
  // The rest (if any) are the parameters:
  const params = parse.splice(1);

  // If the command is known, let's execute it:
  if (commandName in knownCommands) {
    // Retrieve the function by its name:
    const command = knownCommands[commandName];
    // Then call the command with parameters:
    command(target, context, params);
    console.log(`* Executed ${commandName} command for ${context.username}`);
  } else {
    console.log(`* Unknown command ${commandName} from ${context.username}`);
  }
}

// Called every time the bot connects to Twitch chat:
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

// Called every time the bot disconnects from Twitch:
function onDisconnectedHandler(reason) {
  console.log(`Disconnected: ${reason}`);
  process.exit(1);
}
