# Eurosky Portal

This app provides the Eurosky Portal for accessing your account settings and applications

## Development

To build a development docker image:

```sh
docker build -f Dockerfile -t eurosky-portal:dev .
```

To run that image:

```sh
cp .env.docker.example .env.docker.local

docker run -p 4075:4075 --rm --env-file .env.docker.local eurosky-portal:dev
```

```

```
