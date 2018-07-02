# TLSBump
Hacked together a TLS 1.0 bump to newer TLS for some legacy 15 y.o. systems, urgently as they are down

Be careful if using this, this is not secured and can be used malliciously unless you know your network well.

Modify the /etc/hosts or %windir%\System32\etc\hosts of the legacy system to have `some.outgoing.domain.com` sufixed with `.tlsbump` like this: `some.outgoing.domain.com.tlsbump`.

The server listens on `8059`, and by default forwards to `443`.

To specify a custom HTTPS outgoing port, use .tlsbump[port] as sufix, like this: `.tlsbump1234`, where 1234 is the target port.

So, `https://some.outgoing.domain.com/xxx` (http WITH s) needs to be modified in your applications to `http://some.outgoing.domain.com.tlsbump:8059/xxx` (http, without s)

If this server is **not** hosted on the same machine as the legacy application, then you may go **without .tlsbump trick**, just override the original domain and you're good.

After downloading/cloning this app, run `npm install` inside the root directory, to populate the node_modules directory.

Start the application using `node index.js` to listen on 8059, or `node index.js 80` to listen on a custom port, in this example 80.

Use a node version which still supports TLS 1.0. Try 8.11.3.

To install as a Linux system service use `node setup_systemd.js`, then check if it is up and running using `systemctl status tlsbump`.