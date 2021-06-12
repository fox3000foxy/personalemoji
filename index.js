const dotenv = require("dotenv");
dotenv.config();
const fetch = require('node-fetch');
const fileUpload = require('express-fileupload');
const express = require('express');
const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client()
const { clientID, clientSecret } = require('./config.json');
const PORT = process.env.PORT;
//Web App
const app = express();
app.get('/', async ({ query }, response) => {
	const { code } = query;
	if (code) {
			const oauthResult = await fetch('https://discord.com/api/oauth2/token', {
				method: 'POST',
				body: new URLSearchParams({
					client_id: clientID,
					client_secret: clientSecret,
					code,
					grant_type: 'authorization_code',
					redirect_uri: `https://personalemoji.fox3000.repl.co`,
					scope: 'identify',
				}),
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
			});
			const oauthData = await oauthResult.json();
			const userResult = await fetch('https://discord.com/api/users/@me', {headers: {authorization: `${oauthData.token_type} ${oauthData.access_token}`,},});
			clientAuth = await userResult.json()
			console.log(clientAuth)
			if (clientAuth.id!=undefined){
				fs.writeFileSync("clients/"+clientAuth.id+".auth",JSON.stringify(clientAuth))
				}	
	}
	return response.sendFile('/index.html', { root: '.' });
});

app.use('/login',(req,res)=>{
	res.send(`
	<script>
		localStorage.setItem('id',"${clientAuth.id}")
		localStorage.setItem('username',"${clientAuth.username}")
		localStorage.setItem('avatar',"${clientAuth.avatar}")
		localStorage.setItem('discriminator',"${clientAuth.discriminator}")
		location.href = "main.html"
	</script>
	`)
})

app.get('/files/:id',async (req,res)=>{
	var dir = __dirname+'/public/emojis/'+req.params.id+"/";
	fileList = []
	await fs.readdir(dir,async (err, files) => {
		files.forEach(async file =>{
			await fileList.push(file)
		});
		await res.send(fileList)
	});
})

app.get('/delete/:id/:emojiName',(req,res)=>{
	var dir = __dirname+'/public/emojis/'+req.params.id+"/";
	fs.unlinkSync(dir + req.params.emojiName)
	res.send("Deleted !")
})
app.use(fileUpload());
app.post('/upload', function(req, res) {
	var dir = __dirname+'/public/emojis/'+req.body.id+"/";
	if (!fs.existsSync(dir)){fs.mkdirSync(dir);}
	let uploadEmojis, uploadPath;
  uploadEmojis = req.files.uploadEmojis;
  uploadPath = dir + uploadEmojis.name.split(".")[0];
  uploadEmojis.mv(uploadPath, function(err) {  res.redirect("main.html")});
});



app.use(express.static("public"))
app.listen(PORT, () => console.log(`App listening at http://localhost:${PORT}`));
//Discord bot
client.on("message",async (msg)=>{
	if(msg.author.bot==true) return
	if (msg.content.indexOf(";")!=-1) emojiName = msg.content.split(";")[1]
	else return
	let path = __dirname+'/public/emojis/'+msg.author.id+'/'+emojiName
	if (fs.existsSync(path)) {replaceMessage(msg,path)}
})


client.on('ready',()=>{console.log("Ready !")})
client.login("ODQ0OTM2OTg2MTE1ODMzODU4.YKZq4w"+".NAcFqDXCW9WIS9jcaY_5wh02eO4")

function replaceMessage(msg,path){
  		//Replace message
		msg.delete()
		channel = msg.channel
		emoji = msg.guild.emojis.create(path, emojiName).then(async emote=>{
		message = msg.content.split(";")[0]+"<:"+ emote.name + ":"+ emote.id+">"+msg.content.split(";")[2]
		
		const webhooks = await channel.fetchWebhooks();
		const webhook = webhooks.first();
		if(webhook==undefined){
			channel.createWebhook('Webhook', {avatar: 'https://i.imgur.com/wSTFkRM.png'})
			const webhook = webhooks.first();
		}
		await webhook.send(message, {
			username: msg.author.username,
			avatarURL: msg.author.displayAvatarURL()
		});
		
		await emote.delete()
		})
}