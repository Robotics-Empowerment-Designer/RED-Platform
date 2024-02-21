import socket
import os

from time import sleep
from zeroconf import ServiceInfo, Zeroconf

DOMAIN_NAMES = os.environ["HOSTNAME"]
PORT = 5000

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)

    ip = None

    try:
        s.connect(("10.254.254.254", 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    
    return ip

domain_names = DOMAIN_NAMES.split(",")
for domain_name in domain_names:
    domain_name = domain_name.strip()
    print(domain_name)

    info = ServiceInfo(
        "_http._tcp.local.",
        domain_name + "._http._tcp.local.",
        addresses=[socket.inet_aton(get_ip())],
        port=PORT,
        server= domain_name +".local.",
    )

    zeroconf = Zeroconf()
    zeroconf.register_service(info)

while True:
    sleep(0.1)
