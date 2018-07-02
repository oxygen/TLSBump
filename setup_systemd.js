const exec = require("child_process").exec;
const fs = require("fs-extra");
const path = require("path");
const mkdirp = require("mkdirp");

const strServiceFileContents = `
	[Unit]
	Description=TLSBump
	Documentation=https://github.com/oxygen/TLSBump

	[Service]
	SyslogIdentifier=tlsbump
	User=root
	ExecStart= /usr/bin/node ${path.join(__dirname, "index.js")} 0.0.0.0 8059 8060
	KillMode=process
	#StartLimitIntervalSec=5
	StartLimitInterval=5
	StartLimitBurst=1
	RestartSec=5
	Restart=always
	StandardOutput=syslog
	StandardError=syslog

	[Install]
	WantedBy=multi-user.target
`.replace(/^[\s]+/gm, "").trim();


process.on(
	"unhandledRejection", 
	async (reason, promise) => 
	{
		console.log("Unhandled Rejection at: Promise", promise, "reason", reason);
		process.exit(1);
	}
);


async function runCLICommand(strCommand)
{
	console.log(strCommand);
	const processCommand = exec(strCommand);
	processCommand.stdout.pipe(process.stdout);
	processCommand.stderr.pipe(process.stderr);
	return new Promise( (fnResolve, fnReject) => {
		processCommand.on("error", fnReject);
		processCommand.on("exit", (nCode) => {
			if(nCode === 0)
			{
				fnResolve();
			}
			else
			{
				fnReject(new Error("Failed with error code " + nCode));
			} 
		});
	});
}

async function runCLICommandWrapper(strCommand)
{
	await runCLICommand(strCommand)
}

async function service_install(strServiceName, strServiceFileContents){
	strDirectoryPath = "/usr/lib/systemd/system";
	strUnitFilePath = path.join(strDirectoryPath, strServiceName) + ".service";
	//Compare existing file content with the new strServiceFileContents
	if(fs.existsSync(strUnitFilePath))
	{
		const strExistingServiceFileContents = fs.readFileSync(strUnitFilePath, "utf8");
		if(strExistingServiceFileContents === strServiceFileContents)
		{
			//return false;
			//Enable for speed, disable for debug
		}
	}
	else
	{
		mkdirp(strDirectoryPath);
		console.log("Created path " + strDirectoryPath);

	}   
	//Overwrite or create the file
	fs.writeFileSync(strUnitFilePath, strServiceFileContents.replace(/\r/gm, ""));

	//Succesful overwriting
	try
	{	
		await runCLICommandWrapper("node build.js");
		await runCLICommandWrapper("chown root " + strUnitFilePath);
		await runCLICommandWrapper("chmod 0644 " + strUnitFilePath);
		await runCLICommandWrapper("systemctl daemon-reload");
		await runCLICommandWrapper("systemctl enable " + strServiceName);
		await runCLICommandWrapper("systemctl stop " + strServiceName);
		await runCLICommandWrapper("systemctl start " + strServiceName);
		await runCLICommandWrapper("systemctl status " + strServiceName);
	}
	catch(runCLICommandError)
	{
		console.error("runCLICommandError in setup_systemd.js ", runCLICommandError );
	}

	return true;
}


(async() => 
{
	//data = new Buffer.from(x);
	service_install("tlsbump", strServiceFileContents);
})();
