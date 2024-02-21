FROM python:3.7.14-alpine3.16

WORKDIR /home/

RUN pip install --upgrade pip
RUN pip install zeroconf

EXPOSE 53

CMD ["python", "mdns.py"]
