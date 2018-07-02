mkdir /etc/TLSBump
mkdir /etc/TLSBump/Certificates
mkdir /etc/TLSBump/Certificates/ca
openssl genrsa -out /etc/TLSBump/Certificates/ca/ca.pem 4096
openssl req -new -x509 -days 99999 -key /etc/TLSBump/Certificates/ca/ca.pem -out /etc/TLSBump/Certificates/ca/ca.crt -config ca.cnf
