require("dotenv").config();

var fs = require("fs");
const Discord  = require("discord.js");

const bot = new Discord.Client();
const prefix = "cx!";
var commands = new Map();

const token = process.env["TOKEN"];
const color = process.env["COLOR"];

var curMap = require("./country_currency.json");
var cMap = new Map();
// cMap is the map version of curMap object literal.
for (vl in curMap) {
    pair = curMap[vl];
    key = pair["country"].toLowerCase();
    value = pair["currency_code"];
    cMap.set(key,value);
}
// cList is the value array version of cMap map
var cList = Array.from(cMap.values());
for (let i=0;i<cList.length;i++){
    cList[i] = cList[i].toLowerCase();
} 


function inviteCommand(message){
    let link = "https://discord.com/api/oauth2/authorize?client_id=814545167222046740&permissions=0&scope=bot";
    let emb = new Discord.MessageEmbed()
    .setColor(color)
    .setTitle("Invite!")
    .setDescription(`Here is the invite link, thanks for your attention!\n[Click to invite!](${link})`);
    message.channel.send(emb);

}


// This function finds currency arguments (10 usd,5 try etc.) from the text given.
// And it returns arguments it found.
function isInt(value) {
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
  }

function parseCurrencies(content){

    let words = content.replace(/[|&;$%@"<>()+,.]/g, "");
    words = words.trim().toLowerCase().split(" ");
    let args = []
    let found = false;
    for(let i=1;i<words.length;i++){
        let word = words[i];
        if (cList.includes(word)){
            // If there is a currency name and there is a number in front of that word it's an argument.
            // 3 is just a random number, not matter what.
            if (isInt(words[i-1])){
                args.push(words[i-1].concat(" "+word));
                found = true;}
            
        }
    }
    return [found,args];
}

// This function returns arguments when we use commands
function getArgs(command,content){
    return content.replace(prefix+command," ").trim().split(" ");
}

// This function returns help message.
function helpFunction(message){
    let desc = "Hey welcome, I will help you to **convert currencies easily**, just start with setting your currency, in order to start type **cx!set**\nAlso you can learn anyone's currency using **cx!currency** and you can invite the bot to your server using **cx!invite**\nAnd to learn equal of any money in your currency, just react to the message that bot reacted.";

    let embed = new Discord.MessageEmbed().setColor(color).setTitle("Welcome!").setDescription(desc)
    message.channel.send(embed)
}

const filter = () => true;

// This function is for cx!set function.
function setFunction(message){
    // We'll check whether we could set a currency or not using this variable.
    global["found"] = false;

    let desc = "In order to set your currency type your country, please make sure that you type your country's name truly";
    let embed = new Discord.MessageEmbed().setColor(color).setTitle("Setting your currency!").setDescription(desc)
    .setFooter(`Requested by ${message.author.username}`,message.author.avatarURL());
    message.channel.send(embed);

    // Message collecter will collect messages from the author for 10 seconds.
    var collector = message.channel.createMessageCollector(filter,{time:10000});
    collector.on("collect",m => {
        if(m.author.id != message.author.id) {return;}
        // If we don't have that country in our country list
        // show error message and return 
        if (!cMap.has(m.content.toLowerCase())){
            let desc = "Country you given is invalid, please make sure that you've typed your country's name truly. Also please don't use shortenings.";
            let embed = new Discord.MessageEmbed().setColor("#BF0A30").setTitle("Invalid Country!").setDescription(desc)
            .setFooter(`Determined invalid by ${message.author.username}`,message.author.avatarURL());
            m.channel.send(embed);
            return;
        }
        // Change value of user from JSON file and show message, also change value of
        // global["found"] to true.
        let readedJson = JSON.parse(fs.readFileSync("./users_currencies.json"));
        let crrncy = cMap.get(m.content.toLowerCase());
        readedJson[m.author.id] = crrncy;

        fs.writeFileSync("./users_currencies.json",JSON.stringify(readedJson));

        let desc = `Your currency succesfully setted as ${crrncy}`;
        let embed = new Discord.MessageEmbed().setColor(color).setTitle("Succesfull!").setDescription(desc)
        .setFooter(`Setted as ${crrncy.toUpperCase()} by ${message.author.username}`,message.author.avatarURL());
        m.channel.send(embed)
        global["found"] = true;
        collector.stop();

    })

    collector.on("end", (collected) => {
        // If we could not find any currency and time expired show this message.
        if (global["found"] == false){
        message.channel.send(new Discord.MessageEmbed().setColor(color).setTitle("Time Expired to Determine Country").setDescription("Time expired to determine your country, please try again using cx!set again."));
    }})

}

// This function shows currency of any user.
function currencyFunction(message){
    let args = getArgs("currency",message.content);
    let crL = JSON.parse(fs.readFileSync("./users_currencies.json"));
    crL = new Map(Object.entries(crL));

    // If we have any args and args is not '' this means we don't have any argument
    // so we'll show the currency of user.

    if (args.length == 1 && args[0] == ''){
        let cr = crL.get(message.author.id);
        if (cr != null){
            let desc = `User ${message.author.username}'s currency is **${cr}**`;
            let emb = new Discord.MessageEmbed().setColor(color).setTitle("Currency of User")
            .setDescription(desc).setFooter(message.author.username,message.author.avatarURL());
            message.channel.send(emb);
            return;
        }
    
        else{
            let desc = "*You did not set a currency yet, please set a currency using cx!set*";
            message.channel.send(desc);
            return;
        } 
    // But if user mentioned anyone.
    }
    else{
        let mention = args[0];
        // First we'll check it whether is it a mention or not.
        if (mention.startsWith("<@!")){
            let id = mention.replace("<@!","").replace(">","").trim();
            

            if (crL.has(id)){
                let cr = crL.get(id);
                let user = bot.users.cache.get(id);
                let desc = `User ${user.username}'s currency is **${cr}**`;
                let emb = new Discord.MessageEmbed().setColor(color).setTitle("Currency of User")
                .setDescription(desc).setFooter(user.username,user.avatarURL());
                message.channel.send(emb);
                return;
            }
    
            else{
                message.channel.send("*User did not set currency yet*");
                return;
            }
        }
        else{
            message.channel.send(new Discord.MessageEmbed().setColor(color).setTitle("Invalid Mention").setDescription("Please make sure that you mentioned truly."));
        }
    }
    
    }
    

// We've created commands map and now we added our commands.
commands.set("help",helpFunction);
commands.set("set",setFunction);
commands.set("currency",currencyFunction);
commands.set("invite",inviteCommand);


// We'll use these libraries when we scrape currency values from transferwise
var request = require("request"),cheerio = require("cheerio");

bot.on("ready", () => {
    console.log("Exchange Bot started to work!");
    bot.user.setActivity("| cx!help for help!",{type:"WATCHING"});

})

bot.on("message",(message) => {

    if(message.author.bot) return;
    // If message is a command
    if (message.content.startsWith(prefix)){
        let command = message.content.split(" ")[0].substr(prefix.length);
        if (commands.has(command)){
            commands.get(command)(message);
        }
        
    }
    // If its not, we'll check whether it has a currency argument or not.
    else{
        let res = parseCurrencies(message.content);
        if (res[0] === true){
            message.react("💵");
        }
    }
})

// When anyone reacted
bot.on("messageReactionAdd", (reaction,user)=> {
    let message = reaction.message;
    let emoji = reaction.emoji.name;
    // If bot reacted to the message, dont't consider it.
    if (user.id == bot.user.id) return;

    if (emoji == "💵" && reaction.users.cache.array().includes(bot.user)){
                // This is the map of users and their currencies
                let lastUs = new Map(Object.entries(JSON.parse(fs.readFileSync("users_currencies.json"))));

                // If user setted a currency continue, else reply and stop.
                const DEST = lastUs.get(user.id);
                if (typeof DEST != typeof "") {
                    message.channel.send("You did not set any currency yet, please set your currency first.");
                    return;
                }
                // Cur params is the list of arguments (10 USD, 20 AZN etc.)

                const res = parseCurrencies(message.content);
                const curParams = res[1];


                curParams.forEach((el) => {
                // Splitting each argument, first value will be AMOUNT
                // second value will be SOURCE 
                const arg_split = el.split(" ");
                const AMOUNT = parseInt(arg_split[0]);
                const SOURCE = arg_split[1].toLowerCase();

                
                const FINAL_URL = `https://wise.com/tr/currency-converter/${SOURCE}-to-${DEST}-rate?amount=1`;

                request(FINAL_URL,function(error,response,body){
                    
                    $ = cheerio.load(body);
                    var src1 = $(".text-success").text().substr(0,6).replace(",",".");
                    // This result is equal of 1 SRC in DEST.
                    result = (Number(src1) * AMOUNT).toFixed(3);
                    result  = `${result} ${DEST.toUpperCase()}`;
                    var description = `**Mention**: ${el.toUpperCase()}\n**Result**: ${result.toUpperCase()}\n`;
                    if (SOURCE.toLowerCase() == DEST.toLowerCase()){
                        description = `**Mention**: ${el.toUpperCase()}\n**Result**: ${el.toUpperCase()}\n`;
                    } 
                    let emb = new Discord.MessageEmbed().setColor(color).setDescription(description)
                    .setFooter(`Requested by ${user.username}`,user.avatarURL());
                    message.channel.send(emb);
                })
                })

                           
    }

})

bot.login(token);