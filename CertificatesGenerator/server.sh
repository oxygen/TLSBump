mkdir /etc/TLSBump
mkdir /etc/TLSBump/Certificates
mkdir /etc/TLSBump/Certificates/csr
mkdir /etc/TLSBump/Certificates/server
mkdir /etc/TLSBump/Certificates/db

openssl genrsa -out /etc/TLSBump/Certificates/server/private.pem 4096
openssl rsa -in /etc/TLSBump/Certificates/server/private.pem -pubout -out /etc/TLSBump/Certificates/server/public.pem
openssl req -new -sha256 -key /etc/TLSBump/Certificates/server/private.pem -out /etc/TLSBump/Certificates/csr/server.csr -config server.cnf
rm -f /etc/TLSBump/Certificates/db/index.txt
rm -f /etc/TLSBump/Certificates/db/serial.txt
touch /etc/TLSBump/Certificates/db/index.txt
echo '01' > /etc/TLSBump/Certificates/db/serial.txt
openssl ca -config ca.cnf -policy signing_policy -extensions v3_req -out /etc/TLSBump/Certificates/server/server.crt -infiles /etc/TLSBump/Certificates/csr/server.csr
