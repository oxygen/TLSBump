# SelfSigned Certificate Authority

Older Linux systems may have very different ways of installing trusted CAs.

Currently, the .cnf files have hardcoded domains and IPs. Nothing is automated.

# Install CA as trusted root certificate

### CentOS
```shell
cp ca/ca.crt /etc/pki/ca-trust/source/anchors/
update-ca-trust
```

### Debian, Ubuntu
```shell
cp ca/ca.crt /usr/local/share/ca-certificates/ca.crt
update-ca-certificates
```
To remove: `update-ca-certificates --fresh`

### Windows
```batch
certutil -addstore -f "ROOT" ca/ca.crt
```

### Firefox (has its own store)
 * Go to Options (Settings) Advanced / Certificates / See certificates / Import
 * Authorize for websites.
 
