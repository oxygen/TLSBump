const http = require("http");
const https = require("https");
const HTTPProxy = require("http-proxy");
const rangeCheck = require("range_check");
const os = require("os");
const net = require("net");
const fs = require("fs");


process.on(
	"unhandledRejection",
	(reason, promise) =>
	{
		console.log("[" + process.pid + "] Unhandled Rejection at: Promise", promise, "reason", reason);

		process.exit(1);
	}
);

process.on(
	"uncaughtException",
	(error) => {
		console.log("[" + process.pid + "] Unhandled exception.");
		console.error(error);

		process.exit(1);
	}
);


class Main
{
	constructor()
	{
		this._proxy = HTTPProxy.createProxyServer({
			secure: false
		});

		this._arrAllowedRemoteSubnets = ["127.0.0.0/24", "192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12", "89.36.24.2/32", "84.40.32.137/32"];


		this._httpServer = http.createServer();
		this._httpsServer = https.createServer({
			key: fs.readFileSync("/etc/TLSBump/Certificates/server/private.pem"),
			cert: fs.readFileSync("/etc/TLSBump/Certificates/server/server.crt"),
			ca: fs.readFileSync("/etc/TLSBump/Certificates/ca/ca.crt"),
			requestCert: false, 
			rejectUnauthorized: false
		});
		

		this._httpsServer.on("request", (incomingRequest, serverResponse) => {
			this.processHTTPRequest(incomingRequest, serverResponse);
		});

		this._httpServer.on("request", (incomingRequest, serverResponse) => {
			this.processHTTPRequest(incomingRequest, serverResponse);
		});

		let nListeningPort = 8059;
		let nListeningPortSSL = 8060;
		let strListenIP = "0.0.0.0";
		if(process.argv[2])
		{
			if(!net.isIP(process.argv[2]))
			{
				console.error(os.EOL + "Invalid listening IP param. Usage: node index.js 0.0.0.0 8059 8060" + os.EOL + os.EOL);
				process.exit(1);
			}

			strListenIP = process.argv[2];

			if(process.argv[3])
			{
				if(!String(process.argv[3].match(/^[0-9]{1, 5}$/) && parseInt(process.argv[3]) >= 1 && parseInt(process.argv[3]) <= 65535))
				{
					console.error(os.EOL + "Invalid listening port param. Usage ([listen ip] [listen http port] [listen https port]): node index.js 0.0.0.0 8059 8060" + os.EOL + os.EOL);
					process.exit(1);
				}

				nListeningPort = process.argv[3];

				
				if(process.argv[4])
				{
					if(!String(process.argv[3].match(/^[0-9]{1, 5}$/) && parseInt(process.argv[4]) >= 1 && parseInt(process.argv[4]) <= 65535))
					{
						console.error(os.EOL + "Invalid listening port param. Usage ([listen ip] [listen http port] [listen https port]): node index.js 0.0.0.0 8059 8060" + os.EOL + os.EOL);
						process.exit(1);
					}

					nListeningPortSSL = process.argv[4];
				}
			}
		}

		this._httpServer.listen(nListeningPort, strListenIP);
		this._httpsServer.listen(nListeningPortSSL, strListenIP);


		console.log("Listening on " + strListenIP + " on HTTP port " + nListeningPort + " and HTTPS port " + nListeningPortSSL);

		setInterval(() => {}, 19999);
	}


	/**
	 * @param {http.IncomingRequest} incomingRequest 
	 * @param {http.ServerResponse} serverResponse 
	 */
	async processHTTPRequest(incomingRequest, serverResponse)
	{
		if(!rangeCheck.inRange(incomingRequest.socket.remoteAddress, this._arrAllowedRemoteSubnets))
		{
			const strError = "Remote address " + incomingRequest.socket.remoteAddress + " not allowed for security. Only these are allowed: " + JSON.stringify(this._arrAllowedRemoteSubnets) + ".";
			
			serverResponse.statusCode = 500;
			serverResponse.write(strError);

			incomingRequest.socket.end();
			incomingRequest.socket.destroy();
			
			console.error(strError);
			return;
		}

		if(!incomingRequest.headers.host)
		{
			const strError = "This proxy server requires that all requests have the HTTP host header set.";
			
			serverResponse.statusCode = 500;
			serverResponse.write(strError);

			incomingRequest.socket.end();
			incomingRequest.socket.destroy();
			
			console.error(strError);
			return;
		}

		const strRequestedDomain = incomingRequest.headers.host.split(":")[0];

		this._proxyRequest(incomingRequest, serverResponse, strRequestedDomain);
	}


	/**
	 * @param {http.IncomingRequest} incomingRequest 
	 * @param {http.ServerResponse} serverResponse 
	 * @param {string} strRequestedDomain
	 */
	_proxyRequest(incomingRequest, serverResponse, strRequestedDomain)
	{
		let nTargetPort = 443; 

		if(strRequestedDomain.endsWith(".tlsbump"))
		{
			strRequestedDomain = strRequestedDomain.substr(0, strRequestedDomain.length - ".tlsbump".length)
		}

		if(strRequestedDomain.match(/.*\.tlsbump[0-9]+$/i))
		{
			const arrMatches = strRequestedDomain.match(/(.*)\.tlsbump([0-9]{1,5})$/i);
			strRequestedDomain = arrMatches[1];
			nTargetPort = parseInt(arrMatches[2], 10);
		}

		console.log("Proxying " + strRequestedDomain + " " + incomingRequest.method + " " + incomingRequest.url);
		
		/*if(strRequestedDomain === "somebody.com")
		{
			nTargetPort: 7216;
		}*/

		this._proxy.web(
			incomingRequest, 
			serverResponse, 
			{
				target: {
					port: nTargetPort,
					host: strRequestedDomain,
					protocol: "https:"
				},

				
				// { '0': [Error: Hostname/IP doesn't match certificate's altnames] }
				// https://stackoverflow.com/a/45579167/584490
				changeOrigin: true
			},
			(error) => {
				console.error(error);

				serverResponse.statusCode = 500;
				serverResponse.write(error.message + "\r\n" + error.stack);
				serverResponse.end();
			}
		);
	}
};


var x = new Main();